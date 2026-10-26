-- Security fixes from the October 2026 review.
--  • get_home_log: only for an approved booking, and only jobs with the same email AND phone
--    (plus postcode and street). Before, anyone could book with a neighbour's email and
--    address, receive the quote link on their own phone and read that home's job history.
--  • submit_request: a global cap of 50 requests per 10 minutes on top of the per-email limit.
--  • booking_buyers.full_name may not start like a spreadsheet formula (CSV injection).

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
  -- Abuse guards: at most 5 requests per email and hour, and at most 50 requests in total in
  -- 10 minutes (the email is whatever the caller sends, so the first limit alone is easy to dodge).
  if (select count(*) from public.bookings where created_at > now() - interval '10 minutes') >= 50 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
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

create or replace function public.get_home_log(p_token_hash text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  b public.bookings%rowtype;
begin
  if p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$' then
    return null;
  end if;
  select * into b from public.bookings where quote_token_hash = p_token_hash;
  -- Only for a booking that is itself approved, so an unanswered request can't be used to look.
  if not found or b.status not in ('godkand', 'utford', 'betald', 'rut_rot_begard', 'avslutad') then
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
        -- The phone too: the quote link goes to it, so someone who books with another
        -- household's email and address but their own phone can't see that household's jobs.
        and x.contact_phone = b.contact_phone
        and x.postcode = b.postcode
        and lower(regexp_replace(trim(x.street), '\s+', ' ', 'g')) = lower(regexp_replace(trim(b.street), '\s+', ' ', 'g'))
        and x.status in ('godkand', 'utford', 'betald', 'rut_rot_begard', 'avslutad')
      limit 100
    ) rows
  ), '[]'::jsonb);
end;
$$;

alter table public.booking_buyers
  add constraint full_name_not_formula check (full_name !~ '^[=+@\-]');
