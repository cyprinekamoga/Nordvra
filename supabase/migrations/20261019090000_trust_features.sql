-- Nordvra – trust features (October 2026)
--  • Kontrollerat företag: the partner's registration date, shown with the other checks.
--  • Boka åt en anhörig: the person who lives in the home, when someone else books.
--  • Påminnelser: an opt-in reminder date per booking.
--  • Besiktningsgaranti: the customer can ask for a free re-clean from the booking page.
--  • Fotorapport: photos of the finished job, shown on the booking page and in the home log.
--  • Bostadens logg: every job at the same home, read with any of its booking links.

-- ───────────────────────────── Columns ─────────────────────────────
alter table public.partners
  add column founded_on date;

alter table public.bookings
  add column resident_name text check (char_length(resident_name) between 2 and 200),
  add column resident_phone text check (resident_phone ~ '^\+46\d{7,10}$'),
  add column remind_on date,
  add column reminder_sent_at timestamptz,
  add column redo_requested_at timestamptz,
  add column redo_message text check (char_length(redo_message) <= 2000),
  add constraint resident_phone_needs_name check (resident_phone is null or resident_name is not null);
create index bookings_remind_idx on public.bookings (remind_on) where reminder_sent_at is null;
create index bookings_home_idx on public.bookings (contact_email, postcode);

-- ───────────────────────────── Photo reports ─────────────────────────────
create table public.booking_photos (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  -- Object path in the "fotorapporter" bucket: <booking id>/<random uuid>.<ext>.
  path text not null unique check (path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png|webp)$'),
  caption text check (char_length(caption) <= 200),
  kind text not null default 'efter' check (kind in ('fore', 'efter')),
  uploaded_by text not null,
  created_at timestamptz not null default now()
);
create index booking_photos_booking_idx on public.booking_photos (booking_id, created_at);

alter table public.booking_photos enable row level security;
create policy "admin all" on public.booking_photos for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
grant select, insert, update, delete on public.booking_photos to authenticated;

-- Public bucket: a photo is only reachable by its exact path, which holds a random uuid and is
-- only handed out with a booking link (like the link token itself). Nobody but admins may list,
-- upload or delete.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotorapporter', 'fotorapporter', true, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "fotorapporter admin read" on storage.objects for select to authenticated
  using (bucket_id = 'fotorapporter' and (select public.is_admin()));
create policy "fotorapporter admin insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'fotorapporter' and (select public.is_admin()));
create policy "fotorapporter admin delete" on storage.objects for delete to authenticated
  using (bucket_id = 'fotorapporter' and (select public.is_admin()));

-- ───────────────────────────── Helpers ─────────────────────────────
create function public.booking_photo_list(p_booking_id uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('path', p.path, 'caption', p.caption, 'kind', p.kind)
    order by p.kind desc, p.created_at), '[]'::jsonb)
  from public.booking_photos p where p.booking_id = p_booking_id;
$$;

-- Last day the customer may ask for a free re-clean: the inspection date, or 7 days after the
-- cleaning, whichever is later. Null when the job has no date yet.
create function public.redo_last_day(b public.bookings) returns date
language sql immutable set search_path = '' as $$
  select case
    when coalesce(b.completed_at, b.scheduled_date) is null then null
    else greatest(coalesce(b.completed_at, b.scheduled_date) + 7, coalesce(b.inspection_date, coalesce(b.completed_at, b.scheduled_date) + 7))
  end;
$$;

-- ───────────────────────────── Public RPCs ─────────────────────────────
create or replace function public.submit_request(p jsonb) returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_service public.services%rowtype;
  v_id uuid;
  v_number text;
  v_email text := lower(trim(p ->> 'contact_email'));
  v_today date := (now() at time zone 'Europe/Stockholm')::date;
  v_remind date := nullif(p ->> 'remind_on', '')::date;
begin
  select * into v_service from public.services where id = p ->> 'service_id' and active;
  if not found then
    raise exception 'unknown_service' using errcode = 'P0001';
  end if;
  if (p ->> 'preferred_date')::date < v_today then
    raise exception 'date_in_past' using errcode = 'P0001';
  end if;
  if v_remind is not null and (v_remind <= v_today or v_remind > v_today + 730) then
    v_remind := null;
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
    resident_name, resident_phone, remind_on,
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
    nullif(trim(p ->> 'resident_name'), ''),
    nullif(p ->> 'resident_phone', ''),
    v_remind,
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

create or replace function public.get_quote(p_token_hash text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  b public.bookings%rowtype;
  v_partner public.partners%rowtype;
  v_form public.form_kind;
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
  select form_kind into v_form from public.services where id = b.service_id;

  return jsonb_build_object(
    'booking_number', b.booking_number,
    'status', b.status,
    'service_id', b.service_id,
    'service_name', b.service_name,
    'form_kind', v_form,
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
    'inspection_date', b.inspection_date,
    'completed_at', b.completed_at,
    'street', b.street,
    'postcode', b.postcode,
    'city', b.city,
    'contact_name', b.contact_name,
    'resident_name', b.resident_name,
    'buyer_count', b.buyer_count,
    'eligibility', b.eligibility,
    'labour_ore', b.labour_ore,
    'material_ore', b.material_ore,
    'travel_ore', b.travel_ore,
    'hours', b.hours,
    'quote_message', b.quote_message,
    'quote_expires_at', b.quote_expires_at,
    'partner_name', v_partner.name,
    'partner_org_nr', v_partner.org_nr,
    'partner_checks', case when v_partner.id is null then null else jsonb_build_object(
      'f_skatt_checked_at', case when v_partner.f_skatt_verified then v_partner.f_skatt_checked_at end,
      'employer_registered', v_partner.employer_registered,
      'insurance_company', v_partner.insurance_company,
      'insurance_valid_to', v_partner.insurance_valid_to,
      'founded_on', v_partner.founded_on,
      'agreement_signed', v_partner.subcontractor_agreement_signed
    ) end,
    'approved_at', b.approved_at,
    'declined_at', b.declined_at,
    'redo_requested_at', b.redo_requested_at,
    'redo_last_day', public.redo_last_day(b),
    'photos', public.booking_photo_list(b.id)
  );
end;
$$;

-- Every approved job at the same home (same email, postcode and street) for "Bostadens logg".
create function public.get_home_log(p_token_hash text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  b public.bookings%rowtype;
begin
  if p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$' then
    return null;
  end if;
  select * into b from public.bookings where quote_token_hash = p_token_hash;
  if not found then
    return null;
  end if;
  return coalesce((
    select jsonb_agg(entry order by sort_date desc nulls last, entry ->> 'booking_number' desc)
    from (
      select coalesce(x.completed_at, x.scheduled_date, x.preferred_date) as sort_date,
        jsonb_build_object(
          'booking_number', x.booking_number,
          'status', x.status,
          'service_name', x.service_name,
          'deduction_type', x.deduction_type,
          'model', x.model,
          'scheduled_date', x.scheduled_date,
          'completed_at', x.completed_at,
          'partner_name', p.name,
          'partner_org_nr', p.org_nr,
          'labour_ore', x.labour_ore,
          'material_ore', x.material_ore,
          'travel_ore', x.travel_ore,
          'paid_amount_ore', x.paid_amount_ore,
          'paid_at', x.paid_at,
          'invoice_number', x.invoice_number,
          'invoice_date', x.invoice_date,
          'claim_approved_ore', x.claim_approved_ore,
          'photos', public.booking_photo_list(x.id)
        ) as entry
      from public.bookings x
      left join public.partners p on p.id = x.partner_id
      where x.contact_email = b.contact_email
        and x.postcode = b.postcode
        and lower(regexp_replace(trim(x.street), '\s+', ' ', 'g')) = lower(regexp_replace(trim(b.street), '\s+', ' ', 'g'))
        and x.status in ('godkand', 'utford', 'betald', 'rut_rot_begard', 'avslutad')
      limit 100
    ) rows
  ), '[]'::jsonb);
end;
$$;

-- Besiktningsgaranti: the customer asks for a free re-clean (move-out cleaning only), from the
-- day of the cleaning up to and including redo_last_day().
create function public.request_redo(p_token_hash text, p_message text) returns text
language plpgsql security definer set search_path = '' as $$
declare
  b public.bookings%rowtype;
  v_form public.form_kind;
  v_today date := (now() at time zone 'Europe/Stockholm')::date;
  v_last date;
begin
  if p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'quote_not_found' using errcode = 'P0001';
  end if;
  select * into b from public.bookings where quote_token_hash = p_token_hash for update;
  if not found then
    raise exception 'quote_not_found' using errcode = 'P0001';
  end if;
  select form_kind into v_form from public.services where id = b.service_id;
  v_last := public.redo_last_day(b);
  if v_form is distinct from 'flyttstad'
     or b.status not in ('godkand', 'utford', 'betald', 'rut_rot_begard', 'avslutad')
     or v_last is null
     or coalesce(b.completed_at, b.scheduled_date) > v_today
     or v_today > v_last then
    raise exception 'redo_not_available' using errcode = 'P0001';
  end if;
  if b.redo_requested_at is not null then
    raise exception 'redo_already_requested' using errcode = 'P0001';
  end if;

  update public.bookings
  set redo_requested_at = now(), redo_message = left(nullif(trim(p_message), ''), 2000)
  where id = b.id;
  insert into public.booking_events (booking_id, actor, kind, message)
  values (b.id, 'kund', 'redo_requested', 'Kunden anmälde omstädning (besiktningsgaranti)');
  return b.booking_number;
end;
$$;

revoke execute on function public.booking_photo_list(uuid) from public, anon, authenticated;
revoke execute on function public.redo_last_day(public.bookings) from public, anon, authenticated;
revoke execute on function public.get_home_log(text) from public, anon, authenticated;
revoke execute on function public.request_redo(text, text) from public, anon, authenticated;
grant execute on function public.get_home_log(text) to anon, authenticated;
grant execute on function public.request_redo(text, text) to anon, authenticated;

-- Flyttstädning is also listed under Flytt, so movers find the whole move-out package there.
update public.services set extra_category_ids = array['flytt']
where id = 'flyttstadning' and not ('flytt' = any (extra_category_ids));
