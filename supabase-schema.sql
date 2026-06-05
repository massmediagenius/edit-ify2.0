-- ============================================================
-- Edit-ify — Full Database Schema
-- Run this entire script in Supabase → SQL Editor → New query
-- ============================================================

-- PROFILES (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  avatar_url text,
  role text not null default 'editor' check (role in ('editor', 'admin')),
  onboarding_completed boolean not null default false,
  editing_software text[],
  content_style_prefs text[],
  payout_method text check (payout_method in ('paypal', 'wise', 'bank')),
  payout_details jsonb,
  pending_balance decimal(10,2) not null default 0,
  approved_balance decimal(10,2) not null default 0,
  total_earned decimal(10,2) not null default 0,
  created_at timestamptz not null default now()
);

-- CONTENT STYLES (edit categories with pricing)
create table if not exists public.content_styles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price_per_edit decimal(10,2) not null,
  level int not null default 1 check (level between 1 and 3),
  is_active boolean not null default true,
  example_video_urls text[],
  brand_guide_notes text,
  gradient_class text default 'from-cyan-500/20 to-purple-500/20',
  created_at timestamptz not null default now()
);

-- SUBMISSIONS (editor upload submissions)
create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  editor_id uuid not null references public.profiles(id) on delete cascade,
  content_style_id uuid not null references public.content_styles(id),
  file_url text not null,
  file_name text,
  file_size bigint,
  status text not null default 'pending' check (status in ('pending', 'approved', 'revision', 're-uploaded')),
  admin_notes text,
  revision_timestamp text,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewer_id uuid references public.profiles(id)
);

-- EARNINGS (one row per submission)
create table if not exists public.earnings (
  id uuid primary key default gen_random_uuid(),
  editor_id uuid not null references public.profiles(id) on delete cascade,
  submission_id uuid not null references public.submissions(id) on delete cascade,
  content_style_id uuid references public.content_styles(id),
  amount decimal(10,2) not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'paid')),
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  paid_at timestamptz
);

-- PAYOUT REQUESTS
create table if not exists public.payout_requests (
  id uuid primary key default gen_random_uuid(),
  editor_id uuid not null references public.profiles(id) on delete cascade,
  amount decimal(10,2) not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'paid', 'rejected')),
  payout_method text,
  payout_details_snapshot jsonb,
  requested_at timestamptz not null default now(),
  scheduled_pay_date timestamptz,
  paid_at timestamptz,
  admin_notes text
);

-- ASSETS (admin-uploaded files for editors to download)
create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  folder text not null check (folder in ('Talking Videos', 'B-roll', 'Podcast', 'Raw')),
  file_url text not null,
  file_type text check (file_type in ('video', 'image', 'audio', 'other')),
  file_size bigint,
  uploaded_by uuid references public.profiles(id),
  uploaded_at timestamptz not null default now()
);

-- ============================================================
-- TRIGGER: auto-create profile on signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- TRIGGER: auto-create earnings row when submission inserted
-- ============================================================
create or replace function public.handle_new_submission()
returns trigger as $$
declare
  style_price decimal(10,2);
begin
  select price_per_edit into style_price
  from public.content_styles
  where id = new.content_style_id;

  insert into public.earnings (editor_id, submission_id, content_style_id, amount, status)
  values (new.editor_id, new.id, new.content_style_id, style_price, 'pending');

  -- Add to pending balance
  update public.profiles
  set pending_balance = pending_balance + style_price
  where id = new.editor_id;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_submission_created on public.submissions;
create trigger on_submission_created
  after insert on public.submissions
  for each row execute procedure public.handle_new_submission();

-- ============================================================
-- TRIGGER: when earning approved → move pending → approved balance
-- ============================================================
create or replace function public.handle_earning_status_change()
returns trigger as $$
begin
  if new.status = 'approved' and old.status = 'pending' then
    new.approved_at = now();
    update public.profiles
    set
      pending_balance  = pending_balance  - new.amount,
      approved_balance = approved_balance + new.amount,
      total_earned     = total_earned     + new.amount
    where id = new.editor_id;
  end if;

  if new.status = 'paid' and old.status = 'approved' then
    new.paid_at = now();
    update public.profiles
    set approved_balance = approved_balance - new.amount
    where id = new.editor_id;
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_earning_status_change on public.earnings;
create trigger on_earning_status_change
  before update on public.earnings
  for each row execute procedure public.handle_earning_status_change();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles enable row level security;
alter table public.content_styles enable row level security;
alter table public.submissions enable row level security;
alter table public.earnings enable row level security;
alter table public.payout_requests enable row level security;
alter table public.assets enable row level security;

-- Helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- profiles
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id or public.is_admin());
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id or public.is_admin());

-- content_styles
create policy "content_styles_select" on public.content_styles for select using (auth.role() = 'authenticated');
create policy "content_styles_insert" on public.content_styles for insert with check (public.is_admin());
create policy "content_styles_update" on public.content_styles for update using (public.is_admin());
create policy "content_styles_delete" on public.content_styles for delete using (public.is_admin());

-- submissions
create policy "submissions_insert_editor" on public.submissions for insert with check (auth.uid() = editor_id);
create policy "submissions_select" on public.submissions for select using (auth.uid() = editor_id or public.is_admin());
create policy "submissions_update" on public.submissions for update using (public.is_admin() or (auth.uid() = editor_id and status = 'revision'));

-- earnings
create policy "earnings_select" on public.earnings for select using (auth.uid() = editor_id or public.is_admin());
create policy "earnings_update" on public.earnings for update using (public.is_admin());

-- payout_requests
create policy "payout_requests_insert" on public.payout_requests for insert with check (auth.uid() = editor_id);
create policy "payout_requests_select" on public.payout_requests for select using (auth.uid() = editor_id or public.is_admin());
create policy "payout_requests_update" on public.payout_requests for update using (public.is_admin());

-- assets
create policy "assets_select" on public.assets for select using (auth.role() = 'authenticated');
create policy "assets_insert" on public.assets for insert with check (public.is_admin());
create policy "assets_delete" on public.assets for delete using (public.is_admin());

-- ============================================================
-- SEED: default content styles (update prices as needed)
-- ============================================================
insert into public.content_styles (name, description, price_per_edit, level, gradient_class) values
  ('Podcast Clips',        'Short-form clips cut from long podcast recordings',         10.00, 1, 'from-purple-500/20 to-pink-500/20'),
  ('Talking Head Videos',  'Motivational or educational talking-to-camera edits',       15.00, 2, 'from-cyan-500/20 to-blue-500/20'),
  ('Glow Up / Before & After', 'Transformation and glow up style edits',               5.00,  1, 'from-orange-500/20 to-yellow-500/20'),
  ('B-Roll Cinematic',     'Scenic and atmospheric b-roll with music sync',             12.00, 2, 'from-green-500/20 to-teal-500/20'),
  ('Raw Phone Content',    'Quick edits of raw vertical phone footage',                 8.00,  1, 'from-red-500/20 to-orange-500/20')
on conflict do nothing;

-- ============================================================
-- Storage buckets (run separately in Supabase dashboard if SQL doesn't work)
-- ============================================================
-- Create bucket: assets   (public)
-- Create bucket: submissions (private)
insert into storage.buckets (id, name, public) values ('assets', 'assets', true) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('submissions', 'submissions', false) on conflict do nothing;

-- Storage RLS
create policy "assets_public_read" on storage.objects for select using (bucket_id = 'assets');
create policy "assets_admin_write" on storage.objects for insert with check (bucket_id = 'assets' and public.is_admin());
create policy "assets_admin_delete" on storage.objects for delete using (bucket_id = 'assets' and public.is_admin());

create policy "submissions_editor_upload" on storage.objects for insert with check (bucket_id = 'submissions' and auth.role() = 'authenticated');
create policy "submissions_read" on storage.objects for select using (bucket_id = 'submissions' and (public.is_admin() or auth.uid()::text = (storage.foldername(name))[1]));
