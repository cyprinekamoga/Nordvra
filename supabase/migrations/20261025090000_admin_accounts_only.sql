-- Admin accounts are only created by an existing admin (Edge Function "admin-users", which
-- creates the login already confirmed). Nobody signs up themselves, so the public helper that
-- told the old sign-up form whether an email was allow-listed is removed: it also let anyone
-- check whether an address is an admin.
drop function if exists public.admin_email_allowed(text);
