-- Run this in Supabase → SQL Editor → New query → Run

insert into public.drive_folders (folder_name)
values ('Las Vegas w/Steve')
on conflict do nothing;
