-- FIX SCRIPT: Run this to ensure all required tables and functions exist.

-- 1. Create user_favorites table if missing
create table if not exists user_favorites (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  game_id text not null, -- IGDB Game ID
  game_name text not null,
  game_cover_url text, -- optional
  game_genres text, -- Store as comma separated string
  created_at timestamp with time zone default now(),
  unique(user_id, game_id)
);

-- 2. RLS Policies for user_favorites
alter table user_favorites enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Users can view their own favorites') then
    create policy "Users can view their own favorites" on user_favorites for select using (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where policyname = 'Users can insert their own favorites') then
    create policy "Users can insert their own favorites" on user_favorites for insert with check (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where policyname = 'Users can delete their own favorites') then
    create policy "Users can delete their own favorites" on user_favorites for delete using (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where policyname = 'Favorites are viewable by everyone') then
    create policy "Favorites are viewable by everyone" on user_favorites for select using (true);
  end if;
end
$$;

-- 3. Update RPC Function (get_profiles_to_explore) to accept filters
-- We drop it first to ensure the signature is updated if it existed with different params
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
  -- Apply Filters
  and coalesce(r.avg_respect, 0) >= min_respect
  and coalesce(r.avg_communication, 0) >= min_communication
  and coalesce(r.avg_humor, 0) >= min_humor
  and coalesce(r.avg_collaboration, 0) >= min_collaboration
  order by random()
  limit p_limit;
$$;
