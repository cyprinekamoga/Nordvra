-- Admin accounts are only created by an existing admin (Edge Function "admin-users", which
-- creates the login already confirmed). Nobody signs up themselves, so the public helper that
-- told the old sign-up form whether an email was allow-listed is no longer callable: it also
-- let anyone check whether an address is an admin. (Revoked rather than dropped; the app no
-- longer uses it.)
revoke execute on function public.admin_email_allowed(text) from public, anon, authenticated;
