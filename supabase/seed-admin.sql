-- After your first signup (the community leader / "Dad"):
-- 1. Find their UUID in Authentication → Users
-- 2. Run:

update public.users
set role = 'ADMIN'
where email = 'dad@example.com';

-- Or by id:
-- update public.users set role = 'ADMIN' where id = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';
