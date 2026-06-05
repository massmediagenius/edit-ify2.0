-- Run this in Supabase → SQL Editor → New query → Run
-- Drops and recreates the assets table with all correct columns

drop table if exists public.assets cascade;

create table public.assets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  folder text not null,
  file_url text not null,
  file_type text,
  file_size bigint,
  uploaded_by uuid,
  uploaded_at timestamptz not null default now()
);

alter table public.assets enable row level security;

create policy "assets_select" on public.assets
  for select using (auth.role() = 'authenticated');

create policy "assets_insert" on public.assets
  for insert with check (public.is_admin());

create policy "assets_delete" on public.assets
  for delete using (public.is_admin());

notify pgrst, 'reload schema';
