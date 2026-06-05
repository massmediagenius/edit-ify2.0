-- Run this in Supabase → SQL Editor → New query → Run
-- Adds the missing INSERT policy so editors can create their own profile row.

create policy "profiles_insert_own"
  on public.profiles
  for insert
  with check (auth.uid() = id);
