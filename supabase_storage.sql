-- Create the 'avatars' bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Set up RLS policies for the 'avatars' bucket
create policy "Avatar images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'avatars' );

create policy "Anyone can upload an avatar."
  on storage.objects for insert
  to authenticated
  with check ( bucket_id = 'avatars' );

-- Optional: Restrict uploads to user's own folder if strictly needed
-- create policy "Users can only upload to their own folder"
--   on storage.objects for insert
--   to authenticated
--   with check ( bucket_id = 'avatars' and (storage.foldername(name))[1]::uuid = auth.uid() );
