-- Customer reviews (omdömen). Only customers with a completed job can write one (one per
-- booking), through their booking link or a review link the owner emails. Nothing is shown on
-- the site until the owner publishes it in admin. Shown with the name and place the customer
-- chose, never the email, phone or address.

alter table public.bookings
  add column review_token_hash text unique;

create table public.booking_reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  body text not null check (char_length(body) between 1 and 1000),
  display_name text not null check (char_length(display_name) between 2 and 60),
  service_name text not null,
  status text not null default 'ny' check (status in ('ny', 'publicerad', 'dold')),
  created_at timestamptz not null default now(),
  published_at timestamptz
);
create index booking_reviews_status_idx on public.booking_reviews (status, published_at desc);

alter table public.booking_reviews enable row level security;
create policy "admin all" on public.booking_reviews for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
grant select, insert, update, delete on public.booking_reviews to authenticated;

-- The booking a link token belongs to: the quote link or the review link.
create function public.booking_for_token(p_token_hash text) returns uuid
language sql stable security definer set search_path = '' as $$
  select id from public.bookings
  where p_token_hash ~ '^[0-9a-f]{64}$'
    and (quote_token_hash = p_token_hash or review_token_hash = p_token_hash)
  limit 1;
$$;

-- What the review form needs: can this booking be reviewed, and has it been already?
create function public.get_review_state(p_token_hash text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  b public.bookings%rowtype;
begin
  select * into b from public.bookings where id = public.booking_for_token(p_token_hash);
  if not found then
    return null;
  end if;
  return jsonb_build_object(
    'booking_number', b.booking_number,
    'service_name', b.service_name,
    'contact_name', split_part(b.contact_name, ' ', 1),
    'city', b.city,
    'can_review', b.status in ('utford', 'betald', 'rut_rot_begard', 'avslutad'),
    'reviewed', exists (select 1 from public.booking_reviews r where r.booking_id = b.id)
  );
end;
$$;

create function public.submit_review(p_token_hash text, p_rating int, p_body text, p_display_name text)
returns text
language plpgsql security definer set search_path = '' as $$
declare
  b public.bookings%rowtype;
  v_body text := left(trim(coalesce(p_body, '')), 1000);
  v_name text := left(trim(coalesce(p_display_name, '')), 60);
begin
  select * into b from public.bookings where id = public.booking_for_token(p_token_hash) for update;
  if not found then
    raise exception 'quote_not_found' using errcode = 'P0001';
  end if;
  if b.status not in ('utford', 'betald', 'rut_rot_begard', 'avslutad') then
    raise exception 'review_not_available' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.booking_reviews where booking_id = b.id) then
    raise exception 'review_exists' using errcode = 'P0001';
  end if;
  if p_rating is null or p_rating < 1 or p_rating > 5 or v_body = '' or char_length(v_name) < 2 then
    raise exception 'invalid_review' using errcode = 'P0001';
  end if;
  insert into public.booking_reviews (booking_id, rating, body, display_name, service_name)
  values (b.id, p_rating, v_body, v_name, b.service_name);
  insert into public.booking_events (booking_id, actor, kind, message)
  values (b.id, 'kund', 'review', 'Kunden lämnade ett omdöme (' || p_rating || ' av 5)');
  return b.booking_number;
end;
$$;

-- Published reviews for the homepage: newest first, with the average and count.
create function public.get_published_reviews() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'count', (select count(*) from public.booking_reviews where status = 'publicerad'),
    'average', (select round(avg(rating)::numeric, 1) from public.booking_reviews where status = 'publicerad'),
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'rating', r.rating, 'body', r.body, 'display_name', r.display_name,
        'service_name', r.service_name, 'published_at', r.published_at
      ) order by r.published_at desc)
      from (
        select * from public.booking_reviews where status = 'publicerad'
        order by published_at desc limit 12
      ) r
    ), '[]'::jsonb)
  );
$$;

revoke execute on function public.booking_for_token(text) from public, anon, authenticated;
revoke execute on function public.get_review_state(text) from public, anon, authenticated;
revoke execute on function public.submit_review(text, int, text, text) from public, anon, authenticated;
revoke execute on function public.get_published_reviews() from public, anon, authenticated;
grant execute on function public.get_review_state(text) to anon, authenticated;
grant execute on function public.submit_review(text, int, text, text) to anon, authenticated;
grant execute on function public.get_published_reviews() to anon, authenticated;
