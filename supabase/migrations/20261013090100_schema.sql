-- Nordvra – tables and types

-- ───────────────────────────── Types ─────────────────────────────
create type public.booking_status as enum (
  'ny_forfragan', 'soker_utforare', 'offert_skickad', 'godkand', 'utford', 'betald',
  'rut_rot_begard', 'avslutad', 'nekad', 'avbokad', 'offert_utgangen'
);
create type public.deduction_type as enum ('rut', 'rot');
create type public.service_model as enum ('seller', 'agent');
create type public.rot_kind as enum ('repair', 'rebuild');
create type public.pricing_unit as enum ('job', 'visit', 'hour', 'window', 'm2');
create type public.form_kind as enum ('flyttstad', 'hemstad', 'storstad', 'fonster', 'vitvaror', 'standard');
create type public.housing_type as enum ('hyresratt', 'bostadsratt', 'villa', 'fritidshus', 'foraldrar');
create type public.size_band as enum ('0-39', '40-59', '60-79', '80-99', '100-129', '130-159', '160+');
create type public.time_window as enum ('formiddag', 'eftermiddag', 'flexibel');

-- ───────────────────────────── Admins ─────────────────────────────
create table public.admin_users (
  email text primary key check (email = lower(email) and email like '%@%'),
  created_at timestamptz not null default now(),
  added_by text
);

-- ───────────────────────────── Catalogue ─────────────────────────────
create table public.categories (
  id text primary key check (id ~ '^[a-z0-9-]+$'),
  name text not null,
  icon text not null default 'sparkles',
  deduction_type public.deduction_type not null,
  sort int not null default 0,
  active boolean not null default true
);

create table public.services (
  id text primary key check (id ~ '^[a-z0-9-]+$'),
  category_id text not null references public.categories (id),
  extra_category_ids text[] not null default '{}',
  name text not null,
  description text not null default '',
  deduction_type public.deduction_type not null,
  model public.service_model not null,
  rot_kind public.rot_kind,
  pricing_unit public.pricing_unit not null,
  labour_share_of_total numeric(4, 3) check (labour_share_of_total > 0 and labour_share_of_total <= 1),
  form_kind public.form_kind not null default 'standard',
  ask_home_details boolean not null default false,
  uses_size_band boolean not null default false,
  skv_work_type text not null,
  warning_ids text[] not null default '{}',
  sort int not null default 0,
  active boolean not null default true,
  updated_at timestamptz not null default now(),
  constraint rot_kind_only_for_rot check ((deduction_type = 'rot') = (rot_kind is not null))
);
create index services_category_idx on public.services (category_id);

create table public.service_addons (
  id text primary key check (id ~ '^[a-z0-9-]+$'),
  service_id text not null references public.services (id) on delete cascade,
  label text not null,
  included boolean not null default false,
  per_window boolean not null default false,
  labour_min_ore int not null default 0 check (labour_min_ore >= 0),
  labour_max_ore int not null default 0,
  sort int not null default 0,
  check (labour_max_ore >= labour_min_ore)
);
create index service_addons_service_idx on public.service_addons (service_id);

-- Indicative ranges BEFORE deduction, incl. VAT, in öre, split by line.
create table public.price_ranges (
  id bigint generated always as identity primary key,
  service_id text not null references public.services (id) on delete cascade,
  size_band public.size_band,
  labour_min_ore int not null check (labour_min_ore >= 0),
  labour_max_ore int not null,
  material_min_ore int not null default 0 check (material_min_ore >= 0),
  material_max_ore int not null default 0,
  travel_min_ore int not null default 0 check (travel_min_ore >= 0),
  travel_max_ore int not null default 0,
  note text,
  updated_at timestamptz not null default now(),
  check (labour_max_ore >= labour_min_ore),
  check (material_max_ore >= material_min_ore),
  check (travel_max_ore >= travel_min_ore),
  unique nulls not distinct (service_id, size_band)
);

-- ───────────────────────────── Settings ─────────────────────────────
create table public.settings (
  id int primary key default 1 check (id = 1),
  quote_valid_hours int not null default 48 check (quote_valid_hours between 1 and 720),
  -- Personnummer is anonymised this many years after the RUT/ROT claim is settled.
  -- TODO(revisor): confirm the retention period with the accountant.
  pnr_retention_years int not null default 7 check (pnr_retention_years between 1 and 15),
  -- … and this many days after a job that never led to a claim (cancelled, agent jobs).
  pnr_unused_retention_days int not null default 90 check (pnr_unused_retention_days between 1 and 3650),
  default_commission_pct numeric(5, 2) not null default 12 check (default_commission_pct between 0 and 100),
  pets_surcharge_pct numeric(5, 2) not null default 10 check (pets_surcharge_pct between 0 and 100),
  extra_floor_surcharge_pct numeric(5, 2) not null default 5 check (extra_floor_surcharge_pct between 0 and 100),
  notification_email text not null default 'info@nordvra.se',
  updated_at timestamptz not null default now()
);

-- Admin overrides of lib/taxRules.ts for a given year. Null = use the value from the file.
create table public.tax_rule_overrides (
  year int primary key check (year between 2020 and 2100),
  rut_rate numeric(4, 3) check (rut_rate between 0 and 1),
  rot_rate numeric(4, 3) check (rot_rate between 0 and 1),
  rut_cap_ore int check (rut_cap_ore >= 0),
  rot_cap_ore int check (rot_cap_ore >= 0),
  combined_cap_ore int check (combined_cap_ore >= 0),
  note text,
  updated_at timestamptz not null default now(),
  updated_by text
);

-- ───────────────────────────── Partners ─────────────────────────────
create table public.partners (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 200),
  org_nr text not null,
  contact_name text,
  phone text,
  email text,
  f_skatt_verified boolean not null default false,
  f_skatt_checked_at date,
  employer_registered boolean not null default false,
  insurance_company text,
  insurance_valid_to date,
  service_ids text[] not null default '{}',
  regions text[] not null default '{}',
  postcode_prefixes text[] not null default '{}',
  rating numeric(2, 1) check (rating between 1 and 5),
  internal_price_notes text,
  subcontractor_agreement_signed boolean not null default false,
  commission_pct numeric(5, 2) not null default 12 check (commission_pct between 0 and 100),
  -- TO Städ och Flytt's own staff. Assigning this "partner" triggers the conflict-of-interest notice.
  is_own_company boolean not null default false,
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (not f_skatt_verified or f_skatt_checked_at is not null)
);

-- ───────────────────────────── Bookings ─────────────────────────────
create sequence public.booking_number_seq;

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  booking_number text not null unique default '',
  status public.booking_status not null default 'ny_forfragan',

  -- What and where (snapshot at request time)
  service_id text not null references public.services (id),
  service_name text not null,
  deduction_type public.deduction_type not null,
  model public.service_model not null,
  rot_kind public.rot_kind,
  labour_share_of_total numeric(4, 3),
  skv_work_type text not null,
  housing_type public.housing_type not null,
  size_band public.size_band,
  floors smallint check (floors between 1 and 10),
  pets boolean,
  details jsonb not null default '{}',
  preferred_date date not null,
  time_window public.time_window not null,
  flexible boolean not null default false,
  inspection_date date,
  postcode text not null check (postcode ~ '^\d{5}$'),
  street text not null check (char_length(street) between 2 and 200),
  city text not null check (char_length(city) between 2 and 100),
  contact_name text not null check (char_length(contact_name) between 2 and 200),
  contact_phone text not null check (contact_phone ~ '^\+46\d{7,10}$'),
  contact_email text not null check (contact_email = lower(contact_email) and contact_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  customer_note text check (char_length(customer_note) <= 2000),
  eligibility jsonb not null default '{}',
  buyer_count smallint not null default 1 check (buyer_count between 1 and 4),
  estimate jsonb,
  terms_version text not null,
  consent_terms_at timestamptz not null,

  -- Quote (entered by admin)
  partner_id uuid references public.partners (id),
  performed_in_house boolean not null default false,
  scheduled_date date,
  scheduled_time_window public.time_window,
  labour_ore int check (labour_ore >= 0),
  material_ore int not null default 0 check (material_ore >= 0),
  travel_ore int not null default 0 check (travel_ore >= 0),
  hours numeric(6, 2) check (hours >= 0),
  -- RUT (seller model): what we pay the subcontractor. Our margin = price − this.
  subcontractor_cost_ore int check (subcontractor_cost_ore >= 0),
  -- ROT (agent model): our commission on the partner's labour price. Never shown to customers.
  commission_pct numeric(5, 2) check (commission_pct between 0 and 100),
  quote_message text check (char_length(quote_message) <= 2000),
  quote_token_hash text unique,
  quote_sent_at timestamptz,
  quote_expires_at timestamptz,

  -- Approval (by customer)
  approved_at timestamptz,
  consent_deduction_at timestamptz,
  consent_withdrawal_waiver_at timestamptz,
  consent_terms_quote_at timestamptz,
  rot_property jsonb,
  declined_at timestamptz,
  decline_reason text check (char_length(decline_reason) <= 500),

  -- Work, invoice and RUT/ROT claim
  completed_at date,
  invoice_number text,
  invoice_date date,
  paid_amount_ore int check (paid_amount_ore >= 0),
  paid_at date,
  payment_method text check (payment_method in ('kort', 'swish', 'overforing')),
  claim_requested_ore int check (claim_requested_ore >= 0),
  claim_requested_at date,
  claim_settled_at date,
  claim_approved_ore int check (claim_approved_ore >= 0),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index bookings_status_idx on public.bookings (status);
create index bookings_created_idx on public.bookings (created_at desc);
create index bookings_service_idx on public.bookings (service_id);
create index bookings_partner_idx on public.bookings (partner_id);
create index bookings_email_created_idx on public.bookings (contact_email, created_at);

create table public.booking_buyers (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  position smallint not null check (position between 1 and 4),
  full_name text not null check (char_length(full_name) between 2 and 200),
  -- AES-256-GCM ciphertext produced by the app (lib/crypto/pii.ts). Null after anonymisation.
  pnr_encrypted text check (pnr_encrypted like 'v1.%'),
  -- YYMMDD-XXXX, safe for lists.
  pnr_masked text not null check (pnr_masked ~ '^(\d{6}|XXXXXX)-XXXX$'),
  share_pct numeric(5, 2) not null check (share_pct > 0 and share_pct <= 100),
  anonymised_at timestamptz,
  created_at timestamptz not null default now(),
  unique (booking_id, position)
);

create table public.booking_events (
  id bigint generated always as identity primary key,
  booking_id uuid not null references public.bookings (id) on delete cascade,
  at timestamptz not null default now(),
  actor text not null,
  kind text not null,
  from_status public.booking_status,
  to_status public.booking_status,
  message text
);
create index booking_events_booking_idx on public.booking_events (booking_id, at);

create table public.booking_notes (
  id bigint generated always as identity primary key,
  booking_id uuid not null references public.bookings (id) on delete cascade,
  author_email text not null,
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now()
);
create index booking_notes_booking_idx on public.booking_notes (booking_id, created_at);

