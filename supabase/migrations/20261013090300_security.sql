-- Nordvra – scheduled jobs, privileges and Row Level Security

-- ───────────────────────────── Scheduled jobs ─────────────────────────────
create function public.expire_quotes() returns int
language plpgsql security definer set search_path = '' as $$
declare
  v_count int;
begin
  update public.bookings set status = 'offert_utgangen'
  where status = 'offert_skickad' and quote_expires_at < now();
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- GDPR: removes personnummer when it's no longer needed.
--  • Seller-model jobs: N years after the RUT/ROT claim is settled (accounting requirement).
--  • Jobs that never lead to our own claim (agent model, cancelled, declined): after N days.
create function public.anonymise_expired_pnr() returns int
language plpgsql security definer set search_path = '' as $$
declare
  s public.settings%rowtype;
  v_count int;
begin
  select * into s from public.settings where id = 1;
  update public.booking_buyers bb
  set pnr_encrypted = null, pnr_masked = 'XXXXXX-XXXX', anonymised_at = now()
  from public.bookings b
  where bb.booking_id = b.id
    and bb.anonymised_at is null
    and (
      (b.model = 'seller' and b.claim_settled_at is not null
        and b.claim_settled_at + make_interval(years => s.pnr_retention_years) < current_date)
      or (b.model = 'agent' and b.status = 'avslutad'
        and b.updated_at + make_interval(days => s.pnr_unused_retention_days) < now())
      or (b.status in ('avbokad', 'nekad', 'offert_utgangen')
        and b.updated_at + make_interval(days => s.pnr_unused_retention_days) < now())
    );
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

select cron.schedule('nordvra-expire-quotes', '7 * * * *', 'select public.expire_quotes()');
select cron.schedule('nordvra-anonymise-pnr', '17 3 * * *', 'select public.anonymise_expired_pnr()');

-- ───────────────────────────── Privileges ─────────────────────────────
-- Functions are executable by PUBLIC by default in Postgres. Lock down, then open what's public.
revoke execute on all functions in schema public from public, anon, authenticated;

grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.admin_email_allowed(text) to anon, authenticated;
grant execute on function public.public_config() to anon, authenticated;
grant execute on function public.submit_request(jsonb) to anon, authenticated;
grant execute on function public.get_quote(text) to anon, authenticated;
grant execute on function public.accept_quote(text, jsonb, jsonb, jsonb) to anon, authenticated;
grant execute on function public.decline_quote(text, text) to anon, authenticated;

revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
grant select on public.categories, public.services, public.service_addons, public.price_ranges to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage on all sequences in schema public to authenticated;

-- ───────────────────────────── Row Level Security ─────────────────────────────
alter table public.admin_users enable row level security;
alter table public.categories enable row level security;
alter table public.services enable row level security;
alter table public.service_addons enable row level security;
alter table public.price_ranges enable row level security;
alter table public.settings enable row level security;
alter table public.tax_rule_overrides enable row level security;
alter table public.partners enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_buyers enable row level security;
alter table public.booking_events enable row level security;
alter table public.booking_notes enable row level security;

-- Catalogue: everyone reads active rows, admins read everything and write.
create policy "catalogue read" on public.categories for select to anon, authenticated
  using (active or (select public.is_admin()));
create policy "catalogue read" on public.services for select to anon, authenticated
  using (active or (select public.is_admin()));
create policy "catalogue read" on public.service_addons for select to anon, authenticated using (true);
create policy "catalogue read" on public.price_ranges for select to anon, authenticated using (true);

create policy "admin insert" on public.categories for insert to authenticated with check ((select public.is_admin()));
create policy "admin update" on public.categories for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin delete" on public.categories for delete to authenticated using ((select public.is_admin()));
create policy "admin insert" on public.services for insert to authenticated with check ((select public.is_admin()));
create policy "admin update" on public.services for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin delete" on public.services for delete to authenticated using ((select public.is_admin()));
create policy "admin insert" on public.service_addons for insert to authenticated with check ((select public.is_admin()));
create policy "admin update" on public.service_addons for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin delete" on public.service_addons for delete to authenticated using ((select public.is_admin()));
create policy "admin insert" on public.price_ranges for insert to authenticated with check ((select public.is_admin()));
create policy "admin update" on public.price_ranges for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin delete" on public.price_ranges for delete to authenticated using ((select public.is_admin()));

-- Admin-only tables.
create policy "admin all" on public.admin_users for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin all" on public.settings for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin all" on public.tax_rule_overrides for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin all" on public.partners for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin all" on public.bookings for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin all" on public.booking_buyers for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin read" on public.booking_events for select to authenticated
  using ((select public.is_admin()));
create policy "admin insert" on public.booking_events for insert to authenticated
  with check ((select public.is_admin()));
create policy "admin all" on public.booking_notes for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

insert into public.settings (id) values (1);
