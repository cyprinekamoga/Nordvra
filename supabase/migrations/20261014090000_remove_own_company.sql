-- Nordvra has no own staff: every job is done by a partner company. Removes the own-staff
-- partner row and the in-house flags that only existed for it.

delete from public.partners where is_own_company;

-- A partner without verified F-skatt can never be assigned.
create or replace function public.check_booking_partner() returns trigger
language plpgsql set search_path = '' as $$
declare
  v_partner public.partners%rowtype;
begin
  if new.partner_id is null then
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
  return new;
end;
$$;

create or replace function public.get_quote(p_token_hash text) returns jsonb
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
    'partner_name', v_partner.name,
    'partner_org_nr', v_partner.org_nr,
    'approved_at', b.approved_at,
    'declined_at', b.declined_at
  );
end;
$$;

alter table public.bookings drop column performed_in_house;
alter table public.partners drop column is_own_company;
