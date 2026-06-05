-- Run this in Supabase → SQL Editor → New query → Run
-- Step 1: Check if is_admin() function exists and works correctly
select public.is_admin();

-- Step 2: Check your profile role (replace with your actual user ID from auth.users)
select id, full_name, role from public.profiles where role = 'admin';

-- Step 3: Check if submissions exist at all
select count(*) from public.submissions;

-- Step 4: Recreate is_admin() to make sure it's correct
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- Step 5: Drop and recreate submissions RLS to be safe
drop policy if exists "submissions_select" on public.submissions;
create policy "submissions_select"
  on public.submissions for select
  using (auth.uid() = editor_id or public.is_admin());

-- Step 6: Reload schema cache
notify pgrst, 'reload schema';
