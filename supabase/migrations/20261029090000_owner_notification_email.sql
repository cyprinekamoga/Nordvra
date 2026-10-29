-- Customer actions (new request, answered quote, re-clean, review) run without an admin session,
-- so they could not read the settings row and always mailed the default address. This returns
-- only the notification address the owner chose under Inställningar, nothing else.
create function public.owner_notification_email() returns text
language sql stable security definer set search_path = '' as $$
  select notification_email from public.settings where id = 1;
$$;
revoke execute on function public.owner_notification_email() from public, anon, authenticated;
grant execute on function public.owner_notification_email() to anon, authenticated;
