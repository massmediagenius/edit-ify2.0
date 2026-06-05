-- Run this in Supabase → SQL Editor → New query → Run

create table if not exists public.drive_files_cache (
  drive_id text primary key,
  name text not null,
  mime_type text,
  file_size text,
  thumbnail_link text,
  folder_name text not null,
  synced_at timestamptz not null default now()
);

alter table public.drive_files_cache enable row level security;

create policy "drive_cache_select"
  on public.drive_files_cache for select
  using (auth.role() = 'authenticated');

create policy "drive_cache_insert"
  on public.drive_files_cache for insert
  with check (public.is_admin());

create policy "drive_cache_update"
  on public.drive_files_cache for update
  using (public.is_admin());

create policy "drive_cache_delete"
  on public.drive_files_cache for delete
  using (public.is_admin());
