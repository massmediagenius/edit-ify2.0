-- Run this in Supabase → SQL Editor → New query → Run

alter table public.assets add column if not exists folder text;
alter table public.assets add column if not exists file_size bigint;
alter table public.assets add column if not exists file_type text;
alter table public.assets add column if not exists uploaded_by uuid;
alter table public.assets add column if not exists uploaded_at timestamptz default now();

-- This reloads the PostgREST schema cache so new columns are recognized immediately
notify pgrst, 'reload schema';
