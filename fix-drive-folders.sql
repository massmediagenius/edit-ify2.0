-- Run this in Supabase → SQL Editor → New query → Run

create table if not exists public.drive_folders (
  folder_name text primary key,
  drive_folder_id text,
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);

-- Seed the 4 folders
insert into public.drive_folders (folder_name) values
  ('Talking Videos'),
  ('B-roll'),
  ('Podcast'),
  ('Raw')
on conflict do nothing;

-- RLS
alter table public.drive_folders enable row level security;

drop policy if exists "drive_folders_select" on public.drive_folders;
drop policy if exists "drive_folders_insert" on public.drive_folders;
drop policy if exists "drive_folders_update" on public.drive_folders;

create policy "drive_folders_select"
  on public.drive_folders for select
  using (auth.role() = 'authenticated');

create policy "drive_folders_insert"
  on public.drive_folders for insert
  with check (public.is_admin());

create policy "drive_folders_update"
  on public.drive_folders for update
  using (public.is_admin());
