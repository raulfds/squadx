-- Geolocation Support Migration

-- 1. Enable Extensions
CREATE EXTENSION IF NOT EXISTS "cube";
CREATE EXTENSION IF NOT EXISTS "earthdistance";

-- 2. Add Coordinates to Profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS latitude float8;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS longitude float8;

-- 3. Update Explore RPC with Distance Logic
DROP FUNCTION IF EXISTS get_profiles_to_explore;

CREATE OR REPLACE FUNCTION get_profiles_to_explore(
  p_limit int default 10,
  min_respect int default 1,
  min_communication int default 1,
  min_humor int default 1,
  min_collaboration int default 1,
  p_gender text default null,
  p_same_location boolean default false,
  p_same_platform boolean default false,
  p_common_games boolean default false,
  p_min_age int default 18,
  p_max_age int default 99,
  -- New Distance Parameter
  p_max_distance_km int default null
)
RETURNS TABLE (
  id uuid,
  username text,
  full_name text,
  city text,
  state text,
  bio text,
  avatar_url text,
  photos text[],
  game_genres text[],
  availability jsonb,
  discord_handle text,
  psn_handle text,
  xbox_handle text,
  steam_handle text,
  birth_date date,
  gender text,
  latitude float8,
  longitude float8,
  distance_km float8 
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  WITH my_location AS (
    SELECT latitude, longitude, city, state, discord_handle, psn_handle, xbox_handle, steam_handle, id
    FROM profiles
    WHERE id = auth.uid()
  )
  SELECT 
    p.id, p.username, p.full_name, p.city, p.state, p.bio, p.avatar_url, p.photos, p.game_genres, p.availability,
    p.discord_handle, p.psn_handle, p.xbox_handle, p.steam_handle, p.birth_date, p.gender,
    p.latitude, p.longitude,
    -- Calculate distance using earthdistance (returns meters, convert to km)
    CASE 
      WHEN me.latitude IS NOT NULL AND me.longitude IS NOT NULL AND p.latitude IS NOT NULL AND p.longitude IS NOT NULL 
      THEN (point(me.longitude, me.latitude) <@> point(p.longitude, p.latitude)) * 1.60934
      ELSE NULL 
    END AS distance_km
  FROM profiles p
  CROSS JOIN my_location me
  LEFT JOIN user_rating_averages r ON p.id = r.rated_id
  WHERE p.id != auth.uid()
  -- Exclude already swiped
  AND p.id NOT IN (SELECT swiped_id FROM swipes WHERE swiper_id = auth.uid())

  -- 1. Distance Filter
  AND (
      p_max_distance_km IS NULL OR 
      (
        me.latitude IS NOT NULL AND me.longitude IS NOT NULL AND p.latitude IS NOT NULL AND p.longitude IS NOT NULL AND
        ((point(me.longitude, me.latitude) <@> point(p.longitude, p.latitude)) * 1.60934) <= p_max_distance_km
      )
  )

  -- 2. Gender Filter
  AND (p_gender IS NULL OR p.gender = p_gender)

  -- 3. Age Range
  AND (
      p.birth_date IS NULL OR 
      (EXTRACT(YEAR FROM age(p.birth_date)) BETWEEN p_min_age AND p_max_age)
  )

  -- 4. Same Location (Fallback if coords missing, or explicit request)
  -- Note: If distance filter is active, this might be redundant, but kept for logic consistency
  AND (
      p_same_location IS FALSE OR 
      (p.city is not null and me.city is not null and p.city = me.city)
  )

  -- 5. Shared Platforms
  AND (
      p_same_platform IS FALSE OR (
          (me.discord_handle IS NOT NULL AND p.discord_handle IS NOT NULL) OR
          (me.psn_handle IS NOT NULL AND p.psn_handle IS NOT NULL) OR
          (me.xbox_handle IS NOT NULL AND p.xbox_handle IS NOT NULL) OR
          (me.steam_handle IS NOT NULL AND p.steam_handle IS NOT NULL)
      )
  )

  -- 6. Common Games
  AND (
      p_common_games IS FALSE OR EXISTS (
          SELECT 1 
          FROM user_favorites f_me
          JOIN user_favorites f_them ON f_me.game_id = f_them.game_id 
          WHERE f_me.user_id = me.id 
          AND f_them.user_id = p.id
      )
  )

  -- 7. Ratings
  AND (coalesce(r.avg_respect, 0) >= min_respect OR min_respect <= 1)
  AND (coalesce(r.avg_communication, 0) >= min_communication OR min_communication <= 1)
  AND (coalesce(r.avg_humor, 0) >= min_humor OR min_humor <= 1)
  AND (coalesce(r.avg_collaboration, 0) >= min_collaboration OR min_collaboration <= 1)

  ORDER BY distance_km ASC NULLS LAST, random()
  LIMIT p_limit;
$$;
