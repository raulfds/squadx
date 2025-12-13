-- Create a table for public profiles if it doesn't exist
create table if not exists profiles (
  id uuid references auth.users not null primary key,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  avatar_url text,
  bio text,
  
  constraint username_length check (char_length(username) >= 3)
);

-- Add new columns safely
alter table profiles add column if not exists city text;
alter table profiles add column if not exists state text;
alter table profiles add column if not exists discord_handle text;
alter table profiles add column if not exists steam_handle text;
alter table profiles add column if not exists psn_handle text;
alter table profiles add column if not exists xbox_handle text;
alter table profiles add column if not exists riot_handle text;

-- Set up Row Level Security (safely)
alter table profiles enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Public profiles are viewable by everyone.') then
    create policy "Public profiles are viewable by everyone." on profiles for select using ( true );
  end if;

  if not exists (select 1 from pg_policies where policyname = 'Users can insert their own profile.') then
    create policy "Users can insert their own profile." on profiles for insert with check ( auth.uid() = id );
  end if;

  if not exists (select 1 from pg_policies where policyname = 'Users can update own profile.') then
    create policy "Users can update own profile." on profiles for update using ( auth.uid() = id );
  end if;
end
$$;

-- SWIPES TABLE
create table if not exists swipes (
  id uuid default gen_random_uuid() primary key,
  swiper_id uuid references profiles(id) on delete cascade not null,
  swiped_id uuid references profiles(id) on delete cascade not null,
  is_like boolean default false,
  created_at timestamp with time zone default now(),
  unique(swiper_id, swiped_id)
);

alter table swipes enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Users can insert their own swipes') then
    create policy "Users can insert their own swipes" on swipes for insert with check (auth.uid() = swiper_id);
  end if;
  
  if not exists (select 1 from pg_policies where policyname = 'Users can view their own swipes') then
    create policy "Users can view their own swipes" on swipes for select using (auth.uid() = swiper_id);
  end if;
end
$$;

-- MESSAGES TABLE (Optional/Future)
create table if not exists messages (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references profiles(id) not null,
  receiver_id uuid references profiles(id) not null,
  content text not null,
  created_at timestamp with time zone default now()
);

alter table messages enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Users can view their own messages') then
    create policy "Users can view their own messages" on messages for select 
    using (auth.uid() = sender_id or auth.uid() = receiver_id);
  end if;

  if not exists (select 1 from pg_policies where policyname = 'Users can insert messages to matches') then
    create policy "Users can insert messages to matches" on messages for insert 
    with check (auth.uid() = sender_id);
  end if;
end
$$;

-- USER RATINGS TABLE
create table if not exists user_ratings (
  id uuid default gen_random_uuid() primary key,
  rater_id uuid references profiles(id) on delete cascade not null,
  rated_id uuid references profiles(id) on delete cascade not null,
  respect int check (respect between 1 and 5),
  communication int check (communication between 1 and 5),
  humor int check (humor between 1 and 5),
  collaboration int check (collaboration between 1 and 5),
  created_at timestamp with time zone default now(),
  unique(rater_id, rated_id)
);

alter table user_ratings enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Users can insert own ratings') then
    create policy "Users can insert own ratings" on user_ratings for insert with check (auth.uid() = rater_id);
  end if;
  
  if not exists (select 1 from pg_policies where policyname = 'Ratings are viewable by everyone') then
    create policy "Ratings are viewable by everyone" on user_ratings for select using (true);
  end if;
end
$$;

-- VIEW FOR RATING AVERAGES
create or replace view user_rating_averages as
select 
  rated_id,
  count(*) as rating_count,
  round(avg(respect)::numeric, 1) as avg_respect,
  round(avg(communication)::numeric, 1) as avg_communication,
  round(avg(humor)::numeric, 1) as avg_humor,
  round(avg(collaboration)::numeric, 1) as avg_collaboration
from user_ratings
group by rated_id;

-- RPC Function to get profiles to explore
create or replace function get_profiles_to_explore(p_limit int default 10)
returns setof profiles
language sql
security definer
as $$
  select * from profiles
  where id != auth.uid()
  and id not in (select swiped_id from swipes where swiper_id = auth.uid())
  order by random()
  limit p_limit;
$$;
