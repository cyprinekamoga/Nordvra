-- Nordvra – initial schema
-- Customers never read or write tables directly. Public actions go through SECURITY DEFINER
-- functions (submit_request, get_quote, accept_quote, decline_quote). Everything else is
-- admin-only via Row Level Security.


-- Functions, triggers and public RPCs

-- True when the caller is a confirmed Supabase Auth user whose email is in admin_users.
create function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.admin_users a
    join auth.users u on lower(u.email) = a.email
    where u.id = (select auth.uid())
      and u.email_confirmed_at is not null
  );
$$;

-- Used by the admin sign-up form so only allow-listed emails can create an account.
create function public.admin_email_allowed(p_email text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admin_users where email = lower(trim(p_email)));
$$;

-- ───────────────────────────── Triggers ─────────────────────────────
create function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger services_touch before update on public.services
  for each row execute function public.touch_updated_at();
create trigger price_ranges_touch before update on public.price_ranges
  for each row execute function public.touch_updated_at();
create trigger settings_touch before update on public.settings
  for each row execute function public.touch_updated_at();
create trigger partners_touch before update on public.partners
  for each row execute function public.touch_updated_at();
create trigger bookings_touch before update on public.bookings
  for each row execute function public.touch_updated_at();

-- Who made a change: the admin's email, "kund" for anonymous RPC calls, "system" for cron.
create function public.current_actor() returns text
language sql stable set search_path = '' as $$
  select case
    when coalesce(current_setting('request.jwt.claims', true), '') = '' then 'system'
    else coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'email', 'kund')
  end;
$$;

create function public.set_booking_number() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.booking_number := 'NV-' || to_char(now() at time zone 'Europe/Stockholm', 'YYYY') || '-'
    || lpad(nextval('public.booking_number_seq')::text, 5, '0');
  return new;
end;
$$;
create trigger bookings_number before insert on public.bookings
  for each row execute function public.set_booking_number();

-- A partner without verified F-skatt can never be assigned. Assigning our own company
-- turns on the conflict-of-interest disclosure.
create function public.check_booking_partner() returns trigger
language plpgsql set search_path = '' as $$
declare
  v_partner public.partners%rowtype;
begin
  if new.partner_id is null then
    new.performed_in_house := false;
    return new;
  end if;
  if tg_op = 'UPDATE' and new.partner_id is not distinct from old.partner_id then
    return new;
  end if;
  select * into v_partner from public.partners where id = new.partner_id;
  if not found or not v_partner.active then
    raise exception 'Utföraren finns inte eller är inaktiv.'
      using errcode = 'P0001', hint = 'partner_inactive';
  end if;
  if not v_partner.f_skatt_verified then
    raise exception 'Utföraren har inte verifierad F-skatt och kan inte tilldelas.'
      using errcode = 'P0001', hint = 'partner_f_skatt';
  end if;
  new.performed_in_house := v_partner.is_own_company;
  return new;
end;
$$;
create trigger bookings_partner before insert or update of partner_id on public.bookings
  for each row execute function public.check_booking_partner();

create function public.log_booking_status() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.status is distinct from old.status then
    insert into public.booking_events (booking_id, actor, kind, from_status, to_status)
    values (new.id, public.current_actor(), 'status', old.status, new.status);
  end if;
  return new;
end;
$$;
create trigger bookings_status_log after update of status on public.bookings
  for each row execute function public.log_booking_status();

-- ───────────────────────────── Public RPCs ─────────────────────────────

-- Public settings the request flow needs (no internal values).
create function public.public_config() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'pets_surcharge_pct', s.pets_surcharge_pct,
    'extra_floor_surcharge_pct', s.extra_floor_surcharge_pct,
    'tax_overrides', coalesce((select jsonb_agg(to_jsonb(t) - 'note' - 'updated_by' - 'updated_at') from public.tax_rule_overrides t), '[]'::jsonb)
  )
  from public.settings s where s.id = 1;
$$;

-- Creates a request (förfrågan). The app validates with zod first; constraints validate again.
create function public.submit_request(p jsonb) returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_service public.services%rowtype;
  v_id uuid;
  v_number text;
  v_email text := lower(trim(p ->> 'contact_email'));
begin
  select * into v_service from public.services where id = p ->> 'service_id' and active;
  if not found then
    raise exception 'unknown_service' using errcode = 'P0001';
  end if;
  if (p ->> 'preferred_date')::date < (now() at time zone 'Europe/Stockholm')::date then
    raise exception 'date_in_past' using errcode = 'P0001';
  end if;
  -- Simple abuse guard: at most 5 requests per email and hour.
  if (select count(*) from public.bookings
      where contact_email = v_email and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;

  insert into public.bookings (
    service_id, service_name, deduction_type, model, rot_kind, labour_share_of_total, skv_work_type,
    housing_type, size_band, floors, pets, details,
    preferred_date, time_window, flexible, inspection_date,
    postcode, street, city, contact_name, contact_phone, contact_email, customer_note,
    eligibility, buyer_count, estimate, terms_version, consent_terms_at
  ) values (
    v_service.id, v_service.name, v_service.deduction_type, v_service.model, v_service.rot_kind,
    v_service.labour_share_of_total, v_service.skv_work_type,
    (p ->> 'housing_type')::public.housing_type,
    nullif(p ->> 'size_band', '')::public.size_band,
    nullif(p ->> 'floors', '')::smallint,
    (p ->> 'pets')::boolean,
    coalesce(p -> 'details', '{}'::jsonb),
    (p ->> 'preferred_date')::date,
    (p ->> 'time_window')::public.time_window,
    coalesce((p ->> 'flexible')::boolean, false),
    nullif(p ->> 'inspection_date', '')::date,
    p ->> 'postcode', trim(p ->> 'street'), trim(p ->> 'city'),
    trim(p ->> 'contact_name'), p ->> 'contact_phone', v_email,
    nullif(trim(p ->> 'customer_note'), ''),
    coalesce(p -> 'eligibility', '{}'::jsonb),
    coalesce(nullif(p ->> 'buyer_count', '')::smallint, 1),
    p -> 'estimate',
    p ->> 'terms_version',
    now()
  ) returning id, booking_number into v_id, v_number;

  insert into public.booking_events (booking_id, actor, kind, to_status, message)
  values (v_id, 'kund', 'created', 'ny_forfragan', 'Förfrågan skickad');

  return v_number;
end;
$$;

-- Everything the customer's quote page needs, found by the SHA-256 hash of the link token.
create function public.get_quote(p_token_hash text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  b public.bookings%rowtype;
  v_partner public.partners%rowtype;
begin
  if p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$' then
    return null;
  end if;
  select * into b from public.bookings where quote_token_hash = p_token_hash;
  if not found then
    return null;
  end if;
  if b.status = 'offert_skickad' and b.quote_expires_at < now() then
    update public.bookings set status = 'offert_utgangen' where id = b.id;
    b.status := 'offert_utgangen';
  end if;
  select * into v_partner from public.partners where id = b.partner_id;

  return jsonb_build_object(
    'booking_number', b.booking_number,
    'status', b.status,
    'service_id', b.service_id,
    'service_name', b.service_name,
    'deduction_type', b.deduction_type,
    'model', b.model,
    'rot_kind', b.rot_kind,
    'labour_share_of_total', b.labour_share_of_total,
    'housing_type', b.housing_type,
    'size_band', b.size_band,
    'details', b.details,
    'preferred_date', b.preferred_date,
    'scheduled_date', b.scheduled_date,
    'scheduled_time_window', b.scheduled_time_window,
    'street', b.street,
    'postcode', b.postcode,
    'city', b.city,
    'contact_name', b.contact_name,
    'buyer_count', b.buyer_count,
    'eligibility', b.eligibility,
    'labour_ore', b.labour_ore,
    'material_ore', b.material_ore,
    'travel_ore', b.travel_ore,
    'hours', b.hours,
    'quote_message', b.quote_message,
    'quote_expires_at', b.quote_expires_at,
    'performed_in_house', b.performed_in_house,
    'partner_name', v_partner.name,
    'partner_org_nr', v_partner.org_nr,
    'approved_at', b.approved_at,
    'declined_at', b.declined_at
  );
end;
$$;

-- Customer accepts the quote: stores buyers (encrypted personnummer), ROT property details and
-- the consents, and turns the request into a binding booking.
create or replace function public.accept_quote(
  p_token_hash text,
  p_buyers jsonb,
  p_rot_property jsonb,
  p_consents jsonb
) returns text
language plpgsql security definer set search_path = '' as $$
declare
  b public.bookings%rowtype;
  v_buyer jsonb;
  v_pos int := 0;
  v_share_sum numeric := 0;
  v_count int;
  v_today date := (now() at time zone 'Europe/Stockholm')::date;
begin
  if p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'quote_not_found' using errcode = 'P0001';
  end if;
  select * into b from public.bookings where quote_token_hash = p_token_hash for update;
  if not found then
    raise exception 'quote_not_found' using errcode = 'P0001';
  end if;
  if b.status <> 'offert_skickad' then
    raise exception 'quote_not_open' using errcode = 'P0001';
  end if;
  if b.quote_expires_at < now() then
    update public.bookings set status = 'offert_utgangen' where id = b.id;
    raise exception 'quote_expired' using errcode = 'P0001';
  end if;

  if p_buyers is null or jsonb_typeof(p_buyers) <> 'array' then
    raise exception 'invalid_buyers' using errcode = 'P0001';
  end if;
  v_count := jsonb_array_length(p_buyers);
  if v_count < 1 or v_count > 4 then
    raise exception 'invalid_buyers' using errcode = 'P0001';
  end if;
  for v_buyer in select * from jsonb_array_elements(p_buyers) loop
    if jsonb_typeof(v_buyer) <> 'object'
       or coalesce(trim(v_buyer ->> 'full_name'), '') = ''
       or coalesce(v_buyer ->> 'pnr_encrypted', '') = ''
       or coalesce(v_buyer ->> 'pnr_masked', '') = ''
       or coalesce(v_buyer ->> 'share_pct', '') !~ '^[0-9]+(\.[0-9]+)?$' then
      raise exception 'invalid_buyers' using errcode = 'P0001';
    end if;
    v_share_sum := v_share_sum + (v_buyer ->> 'share_pct')::numeric;
  end loop;
  if abs(v_share_sum - 100) > 0.01 then
    raise exception 'invalid_shares' using errcode = 'P0001';
  end if;

  if coalesce((p_consents ->> 'deduction')::boolean, false) is not true
     or coalesce((p_consents ->> 'terms')::boolean, false) is not true then
    raise exception 'missing_consent' using errcode = 'P0001';
  end if;
  if b.scheduled_date is not null and b.scheduled_date < v_today + 14
     and coalesce((p_consents ->> 'withdrawal_waiver')::boolean, false) is not true then
    raise exception 'missing_withdrawal_waiver' using errcode = 'P0001';
  end if;

  if b.deduction_type = 'rot' and coalesce((b.eligibility ->> 'eligible')::boolean, true) then
    if b.housing_type in ('villa', 'fritidshus') and coalesce(trim(p_rot_property ->> 'fastighetsbeteckning'), '') = '' then
      raise exception 'missing_property' using errcode = 'P0001';
    end if;
    if b.housing_type = 'bostadsratt' and (
      coalesce(trim(p_rot_property ->> 'brf_org_nr'), '') = '' or coalesce(trim(p_rot_property ->> 'lagenhetsnummer'), '') = ''
    ) then
      raise exception 'missing_property' using errcode = 'P0001';
    end if;
  end if;

  -- No DELETE here: the admin "Skicka offert" action clears old buyers before re-sending a quote.
  -- Leftover buyers beyond the new count would make the share total wrong, so refuse.
  if exists (select 1 from public.booking_buyers where booking_id = b.id and position > v_count) then
    raise exception 'buyers_exist' using errcode = 'P0001';
  end if;

  for v_buyer in select * from jsonb_array_elements(p_buyers) loop
    v_pos := v_pos + 1;
    insert into public.booking_buyers (booking_id, position, full_name, pnr_encrypted, pnr_masked, share_pct)
    values (
      b.id, v_pos, trim(v_buyer ->> 'full_name'), v_buyer ->> 'pnr_encrypted',
      v_buyer ->> 'pnr_masked', (v_buyer ->> 'share_pct')::numeric
    )
    on conflict (booking_id, position) do update set
      full_name = excluded.full_name,
      pnr_encrypted = excluded.pnr_encrypted,
      pnr_masked = excluded.pnr_masked,
      share_pct = excluded.share_pct,
      anonymised_at = null;
  end loop;

  update public.bookings set
    status = 'godkand',
    approved_at = now(),
    buyer_count = v_count,
    rot_property = case when b.deduction_type = 'rot' then p_rot_property else null end,
    consent_deduction_at = now(),
    consent_terms_quote_at = now(),
    consent_withdrawal_waiver_at = case
      when coalesce((p_consents ->> 'withdrawal_waiver')::boolean, false) then now() end
  where id = b.id;

  insert into public.booking_events (booking_id, actor, kind, message)
  values (b.id, 'kund', 'approved', 'Kunden godkände offerten');

  return b.booking_number;
end;
$$;

create function public.decline_quote(p_token_hash text, p_reason text) returns text
language plpgsql security definer set search_path = '' as $$
declare
  b public.bookings%rowtype;
begin
  select * into b from public.bookings where quote_token_hash = p_token_hash for update;
  if not found then
    raise exception 'quote_not_found' using errcode = 'P0001';
  end if;
  if b.status not in ('offert_skickad', 'offert_utgangen') then
    raise exception 'quote_not_open' using errcode = 'P0001';
  end if;
  update public.bookings
  set status = 'nekad', declined_at = now(), decline_reason = left(nullif(trim(p_reason), ''), 500)
  where id = b.id;
  insert into public.booking_events (booking_id, actor, kind, message)
  values (b.id, 'kund', 'declined', 'Kunden tackade nej till offerten');
  return b.booking_number;
end;
$$;

