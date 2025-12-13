-- Update RPC Function to get profiles to explore with filters
drop function if exists get_profiles_to_explore;

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
  -- Apply Filters (handling nulls as 0/1 equivalent or ignore? 
  -- If user has no ratings, r.* will be null. 
  -- Use coalesce to treat nulls as 0 or 3(average)? Let's assume 0 for strict filtering, or allow them if filter is 1 (min).
  -- A filter of 1 means "any score".
  and coalesce(r.avg_respect, 0) >= min_respect
  and coalesce(r.avg_communication, 0) >= min_communication
  and coalesce(r.avg_humor, 0) >= min_humor
  and coalesce(r.avg_collaboration, 0) >= min_collaboration
  order by random()
  limit p_limit;
$$;
