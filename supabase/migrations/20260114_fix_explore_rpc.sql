-- Fix RPC Function to include unrated users when filter is 1
create or replace function get_profiles_to_explore(
  p_limit int default 10,
  min_respect int default 1,
  min_communication int default 1,
  min_humor int default 1,
  min_collaboration int default 1
)
returns setof profiles
language sql
security definer
as $$
  select p.* 
  from profiles p
  left join user_rating_averages r on p.id = r.rated_id
  where p.id != auth.uid()
  -- Exclude already swiped profiles
  and p.id not in (select swiped_id from swipes where swiper_id = auth.uid())
  -- Apply Filters
  -- If filter is 1 (default), allow unrated users (coalesce to 0 check fails, so we need OR min_X <= 1)
  -- Logic: If user has a rating, it must be >= min. If user has NO rating (0), they only pass if min <= 1.
  and (coalesce(r.avg_respect, 0) >= min_respect OR min_respect <= 1)
  and (coalesce(r.avg_communication, 0) >= min_communication OR min_communication <= 1)
  and (coalesce(r.avg_humor, 0) >= min_humor OR min_humor <= 1)
  and (coalesce(r.avg_collaboration, 0) >= min_collaboration OR min_collaboration <= 1)
  order by random()
  limit p_limit;
$$;
