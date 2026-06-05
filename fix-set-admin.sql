-- Run this in Supabase → SQL Editor → New query → Run
-- Sets your account as admin

update public.profiles
set role = 'admin'
where id = (
  select id from auth.users where email = 'aceopm01@gmail.com'
);

-- Confirm it worked
select id, full_name, role from public.profiles
where id = (select id from auth.users where email = 'aceopm01@gmail.com');
