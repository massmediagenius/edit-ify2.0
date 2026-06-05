-- Run this in Supabase → SQL Editor → New query → Run
-- Creates placeholder files in each folder so they appear in Storage

insert into storage.objects (bucket_id, name, metadata)
values
  ('assets', 'B-roll/.keep',             '{"mimetype": "text/plain", "size": 0}'),
  ('assets', 'Podcast/.keep',            '{"mimetype": "text/plain", "size": 0}'),
  ('assets', 'Raw/.keep',                '{"mimetype": "text/plain", "size": 0}'),
  ('assets', 'Private jet/.keep',        '{"mimetype": "text/plain", "size": 0}'),
  ('assets', 'Las Vegas w/Steve/.keep',  '{"mimetype": "text/plain", "size": 0}')
on conflict do nothing;
