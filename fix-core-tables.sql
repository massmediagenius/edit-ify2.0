-- Run this in Supabase → SQL Editor → New query → Run
-- Creates all missing core tables: content_styles, submissions, earnings, payout_requests

-- ── CONTENT STYLES ───────────────────────────────────────────────────────────
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

alter table public.content_styles enable row level security;
drop policy if exists "content_styles_select" on public.content_styles;
drop policy if exists "content_styles_insert" on public.content_styles;
drop policy if exists "content_styles_update" on public.content_styles;
drop policy if exists "content_styles_delete" on public.content_styles;
create policy "content_styles_select" on public.content_styles for select using (auth.role() = 'authenticated');
create policy "content_styles_insert" on public.content_styles for insert with check (public.is_admin());
create policy "content_styles_update" on public.content_styles for update using (public.is_admin());
create policy "content_styles_delete" on public.content_styles for delete using (public.is_admin());

-- Seed default content styles
insert into public.content_styles (name, description, price_per_edit, level, gradient_class) values
  ('Podcast Clips',             'Short-form clips cut from long podcast recordings',      10.00, 1, 'from-purple-500/20 to-pink-500/20'),
  ('Talking Head Videos',       'Motivational or educational talking-to-camera edits',    15.00, 2, 'from-cyan-500/20 to-blue-500/20'),
  ('Glow Up / Before & After',  'Transformation and glow up style edits',                  5.00, 1, 'from-orange-500/20 to-yellow-500/20'),
  ('B-Roll Cinematic',          'Scenic and atmospheric b-roll with music sync',           12.00, 2, 'from-green-500/20 to-teal-500/20'),
  ('Raw Phone Content',         'Quick edits of raw vertical phone footage',                8.00, 1, 'from-red-500/20 to-orange-500/20')
on conflict do nothing;

-- ── SUBMISSIONS ──────────────────────────────────────────────────────────────
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

alter table public.submissions enable row level security;
drop policy if exists "submissions_insert_editor" on public.submissions;
drop policy if exists "submissions_select" on public.submissions;
drop policy if exists "submissions_update" on public.submissions;
create policy "submissions_insert_editor" on public.submissions for insert with check (auth.uid() = editor_id);
create policy "submissions_select" on public.submissions for select using (auth.uid() = editor_id or public.is_admin());
create policy "submissions_update" on public.submissions for update using (public.is_admin() or (auth.uid() = editor_id and status = 'revision'));

-- ── EARNINGS ─────────────────────────────────────────────────────────────────
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

alter table public.earnings enable row level security;
drop policy if exists "earnings_select" on public.earnings;
drop policy if exists "earnings_update" on public.earnings;
create policy "earnings_select" on public.earnings for select using (auth.uid() = editor_id or public.is_admin());
create policy "earnings_update" on public.earnings for update using (public.is_admin());

-- ── PAYOUT REQUESTS ──────────────────────────────────────────────────────────
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

alter table public.payout_requests enable row level security;
drop policy if exists "payout_requests_insert" on public.payout_requests;
drop policy if exists "payout_requests_select" on public.payout_requests;
drop policy if exists "payout_requests_update" on public.payout_requests;
create policy "payout_requests_insert" on public.payout_requests for insert with check (auth.uid() = editor_id);
create policy "payout_requests_select" on public.payout_requests for select using (auth.uid() = editor_id or public.is_admin());
create policy "payout_requests_update" on public.payout_requests for update using (public.is_admin());

-- ── TRIGGERS ─────────────────────────────────────────────────────────────────

-- Auto-create earnings row + add to pending_balance when submission inserted
create or replace function public.handle_new_submission()
returns trigger as $$
declare style_price decimal(10,2);
begin
  select price_per_edit into style_price from public.content_styles where id = new.content_style_id;
  insert into public.earnings (editor_id, submission_id, content_style_id, amount, status)
  values (new.editor_id, new.id, new.content_style_id, style_price, 'pending');
  update public.profiles set pending_balance = pending_balance + style_price where id = new.editor_id;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_submission_created on public.submissions;
create trigger on_submission_created
  after insert on public.submissions
  for each row execute procedure public.handle_new_submission();

-- Move balances when earning status changes
create or replace function public.handle_earning_status_change()
returns trigger as $$
begin
  if new.status = 'approved' and old.status = 'pending' then
    new.approved_at = now();
    update public.profiles
    set pending_balance  = pending_balance  - new.amount,
        approved_balance = approved_balance + new.amount,
        total_earned     = total_earned     + new.amount
    where id = new.editor_id;
  end if;
  if new.status = 'paid' and old.status = 'approved' then
    new.paid_at = now();
    update public.profiles set approved_balance = approved_balance - new.amount where id = new.editor_id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_earning_status_change on public.earnings;
create trigger on_earning_status_change
  before update on public.earnings
  for each row execute procedure public.handle_earning_status_change();

-- Storage buckets
insert into storage.buckets (id, name, public) values ('submissions', 'submissions', false) on conflict do nothing;

-- Storage RLS for submissions bucket
drop policy if exists "submissions_editor_upload" on storage.objects;
drop policy if exists "submissions_read" on storage.objects;
create policy "submissions_editor_upload" on storage.objects for insert with check (bucket_id = 'submissions' and auth.role() = 'authenticated');
create policy "submissions_read" on storage.objects for select using (bucket_id = 'submissions' and (public.is_admin() or auth.uid()::text = (storage.foldername(name))[1]));

notify pgrst, 'reload schema';
