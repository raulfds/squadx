-- Allow users to see swipes directed AT them (so they can check for matches)
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Users can view swipes directed at them') then
    create policy "Users can view swipes directed at them" on swipes for select using (auth.uid() = swiped_id);
  end if;
end
$$;
