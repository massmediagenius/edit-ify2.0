-- Run this in Supabase → SQL Editor → New query → Run

create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  folder text not null,
  file_url text not null,
  file_type text check (file_type in ('video', 'image', 'audio', 'other')),
  file_size bigint,
  uploaded_by uuid references public.profiles(id),
  uploaded_at timestamptz not null default now()
);

alter table public.assets enable row level security;

drop policy if exists "assets_select" on public.assets;
drop policy if exists "assets_insert" on public.assets;
drop policy if exists "assets_delete" on public.assets;

create policy "assets_select"
  on public.assets for select
  using (auth.role() = 'authenticated');

create policy "assets_insert"
  on public.assets for insert
  with check (public.is_admin());

create policy "assets_delete"
  on public.assets for delete
  using (public.is_admin());
