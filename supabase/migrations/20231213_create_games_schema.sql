-- Create a table for user favorite games
create table if not exists user_favorites (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  game_id text not null, -- IGDB Game ID
  game_name text not null,
  game_cover_url text, -- optional
  game_genres text, -- Store as comma separated string or JSONB array if needed for matchmaking
  created_at timestamp with time zone default now(),
  unique(user_id, game_id)
);

-- RLS Policies
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

    -- Public View Policy (so others can see your games on your profile)
  if not exists (select 1 from pg_policies where policyname = 'Favorites are viewable by everyone') then
    create policy "Favorites are viewable by everyone" on user_favorites for select using (true);
  end if;
end
$$;
