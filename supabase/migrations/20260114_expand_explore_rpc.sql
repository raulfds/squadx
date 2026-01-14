-- Expand RPC to support advanced filters
-- Drop previous versions to ensure signature update works
drop function if exists get_profiles_to_explore;

create or replace function get_profiles_to_explore(
  p_limit int default 10,
  min_respect int default 1,
  min_communication int default 1,
  min_humor int default 1,
  min_collaboration int default 1,
  -- New Parameters
  p_gender text default null,
  p_same_location boolean default false,
  p_same_platform boolean default false,
  p_common_games boolean default false,
  p_min_age int default 18,
  p_max_age int default 99
)
returns setof profiles
language sql
security definer
as $$
  select p.* 
  from profiles p
  join profiles me on me.id = auth.uid()
  left join user_rating_averages r on p.id = r.rated_id
  where p.id != auth.uid()
  -- Exclude already swiped
  and p.id not in (select swiped_id from swipes where swiper_id = auth.uid())
  
  -- 1. Gender Filter (exact match if provided)
  and (p_gender IS NULL OR p.gender = p_gender)
  
  -- 2. Age Range (Calculated from birth_date)
  -- Coalesce birth_date to ensure we don't crash on nulls, though profiles usually have it
  and (
      p.birth_date IS NULL OR 
      (EXTRACT(YEAR FROM age(p.birth_date)) BETWEEN p_min_age AND p_max_age)
  )

  -- 3. Same Location
  and (
      p_same_location IS FALSE OR 
      (p.city is not null and me.city is not null and p.city = me.city)
  )

  -- 4. Shared Platforms
  and (
      p_same_platform IS FALSE OR (
          (me.discord_handle IS NOT NULL AND p.discord_handle IS NOT NULL) OR
          (me.psn_handle IS NOT NULL AND p.psn_handle IS NOT NULL) OR
          (me.xbox_handle IS NOT NULL AND p.xbox_handle IS NOT NULL) OR
          (me.steam_handle IS NOT NULL AND p.steam_handle IS NOT NULL)
      )
  )

  -- 5. Common Games (Requires user_favorites table)
  -- Check if there is AT LEAST ONE common game_id
  and (
      p_common_games IS FALSE OR EXISTS (
          select 1 
          from user_favorites f_me
          join user_favorites f_them on f_me.game_id = f_them.game_id -- Assuming generic game identifier column
          where f_me.user_id = me.id 
          and f_them.user_id = p.id
      )
  )

  -- 6. Rating Filters (Previous Logic: allow unrated if min=1, else strictly >=)
  and (coalesce(r.avg_respect, 0) >= min_respect OR min_respect <= 1)
  and (coalesce(r.avg_communication, 0) >= min_communication OR min_communication <= 1)
  and (coalesce(r.avg_humor, 0) >= min_humor OR min_humor <= 1)
  and (coalesce(r.avg_collaboration, 0) >= min_collaboration OR min_collaboration <= 1)
  
  order by random()
  limit p_limit;
$$;
