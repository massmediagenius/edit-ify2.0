-- Run this in Supabase → SQL Editor → New query → Run

insert into public.drive_folders (folder_name)
values ('Private jet')
on conflict do nothing;
