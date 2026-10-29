# Nordvra

Mobile-first booking concierge ("vi bokar åt dig") for RUT and ROT services. Nordvra is based in
Stockholm and covers all of Sweden through vetted partner companies.
All customer-facing text is Swedish.

Customers click through a short request flow, see an indicative price before and after the
deduction, and send a **request (förfrågan)**. The owner finds a provider, enters the real price in
the admin and sends a **quote link**. The customer approves it on the quote page (adding personnummer
and property details) and only then is it a binding booking. There is no booking fee.

The full product and legal specification is in [`docs/SPEC.md`](docs/SPEC.md).

## Tech stack

- **Next.js 16.4** (App Router, Cache Components, Partial Prefetching, Turbopack) + TypeScript + Tailwind CSS v4
- **Supabase** (Postgres, Auth for admins, Row Level Security, pg_cron), project in eu-north-1 (Stockholm)
- zod for validation, Vitest for unit tests, Playwright + axe for end-to-end and accessibility tests

> Next.js 16 differs from older versions. Version-matched docs are in `node_modules/next/dist/docs/` (see `AGENTS.md`).

## Getting started

```bash
npm install
cp .env.example .env.local     # fill in the values, see below
npm run dev                    # http://localhost:3000
```

Without Supabase variables the public site still works with the built-in seed catalogue, but
requests can't be sent and the admin is disabled.

### Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | public | Supabase publishable key (`sb_publishable_…`). No service-role key is used anywhere. |
| `PII_ENCRYPTION_KEY` | **server secret** | 32 random bytes, base64 (`openssl rand -base64 32`). Encrypts personnummer (AES-256-GCM). **Back it up** – losing it makes stored personnummer unreadable. Don't rotate without a migration. |
| `NEXT_PUBLIC_SITE_URL` | public | Public site URL without trailing slash; used in quote links in emails/SMS |
| `EMAIL_PROVIDER` | server | `console` (default, sends nothing) or `resend` |
| `RESEND_API_KEY`, `EMAIL_FROM` | server secret | Only for `EMAIL_PROVIDER=resend` (untested – enable deliberately after verifying the domain) |
| `SMS_PROVIDER` | server | `console` (default). `46elks` is a stub, not implemented yet |
| `SMS_API_USER`, `SMS_API_PASSWORD` | server secret | For the future SMS provider |

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` / `npm run build` / `npm start` | Next.js |
| `npm test` | Unit tests (Vitest): pricing and deduction maths, eligibility, personnummer/org.nr validation, encryption, catalogue, admin helpers, CSV export … |
| `npm run test:e2e` | Playwright at 375 px with axe accessibility checks (builds must exist: `npm run build` first). In containers without a Playwright browser set `PLAYWRIGHT_CHROMIUM_PATH`. |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:seed:generate` | Regenerates `supabase/seed.sql` from `lib/catalog/seed.ts` |

## Database (Supabase)

Migrations are in `supabase/migrations/`, seed data in `supabase/seed.sql`. The live project
`umyrteczoeecnrrpqnix` (eu-north-1) already has everything applied: tables, RLS on every table,
the public RPCs, cron jobs, the service catalogue and the admin allow-list.

- **Customers never touch tables.** Public actions go through `SECURITY DEFINER` functions:
  `submit_request`, `get_quote`, `accept_quote`, `decline_quote`, `public_config`.
- **Admins** are confirmed Supabase Auth users whose email is in `admin_users` (`is_admin()`).
- **Partners without verified F-skatt can't be assigned** (database trigger).
- **Cron:** quotes expire hourly (`expire_quotes`); personnummer are anonymised daily
  (`anonymise_expired_pnr`) – 7 years after the RUT/ROT claim is settled for our own jobs
  (confirmed), 90 days for cancelled/declined/partner jobs. Both periods are editable in the admin.

For a new project: run the migrations in order, then `supabase/seed.sql`.

### One-time Supabase dashboard settings (needed for admin login emails)

In Supabase → **Authentication → URL Configuration**:

- **Site URL:** your production URL (e.g. `https://nordvra.se` or the Netlify URL)
- **Redirect URLs:** add `https://<your-domain>/admin/auth/confirm` (and `http://localhost:3000/admin/auth/confirm` for local dev)

Then open `/admin/login`, choose **"Skapa konto första gången"** with `cyprinekamoga@gmail.com`,
confirm via the email, and log in. More admins can be added under **Inställningar**.

## Updating the tax rules each year

All RUT/ROT numbers live in **`lib/taxRules.ts`** (one entry per year; 2026: RUT 50 %, ROT 30 %,
max 75 000 kr per person and year combined, of which max 50 000 kr ROT).

1. When the budget bill for the next year is decided (usually announced September–November), copy the
   latest entry in `TAX_RULES`, change `year` and any changed values, and update `source`.
2. Run `npm test`. The 2026 values are pinned by tests in `lib/pricing/__tests__/`; add tests for the new year.
3. Deploy.

Until then the app uses the latest known year's rules and the admin shows a warning. For an urgent
change without a deploy, the admin can override a year under **Inställningar → Skatteregler**
(values that differ from the file are flagged).

The year that applies is the year the customer **pays**; the app approximates it with the job date.

## Project structure

```
app/                     routes (public pages, /boka, /offert/[token], /admin/**)
components/ui/           design system (buttons, chips, calendar, info boxes …)
components/booking/      request flow steps
components/quote/        quote approval
components/admin/        admin screens
lib/taxRules.ts          RUT/ROT rules per year
lib/pricing/             price and deduction maths (pure, tested)
lib/eligibility.ts       eligibility questions and evaluation
lib/catalog/             service catalogue types, seed, loader
lib/crypto/pii.ts        personnummer encryption, quote tokens
lib/email, lib/sms       provider interfaces (console placeholders)
lib/payments             payment interface (manual: invoice paid by Swish or transfer)
lib/i18n/sv/             Swedish strings (add `en/` later)
supabase/                migrations and seed
docs/SPEC.md             product, legal and data specification
```

## Photos

The photos in `public/bilder` come from [Unsplash](https://unsplash.com) under the
[Unsplash License](https://unsplash.com/license), and the hero photos from
[Pexels](https://www.pexels.com) under the [Pexels License](https://www.pexels.com/license/):
both free for commercial use, no credit required.
`lib/content/photos.ts` lists each file with its Swedish alt text, photographer and source page.
People in them are models: show them as illustrations, never as Nordvra customers or staff.
To swap a photo, replace the file and update its entry (width, height, alt).

Every photo shows the work we book (cleaning, moving, painting, building), never landscapes or
empty rooms. Only photos whose original is at least 4K (3840 × 2160) are used; the files are stored
at 3840 px on the long side and served at quality 85 in the sizes each screen needs. They share one colour grade (slightly cooler, softer warm tones, even brightness) so
the set reads as one shoot; keep that in mind when adding photos, and crop or blur readable brand
names and number plates.

| File | Shows | Photographer |
| --- | --- | --- |
| flyttare-kartonger.jpg | Hero collage: mover carrying boxes (Pexels) | RDNE Stock project |
| malare-vagg.jpg | Hero collage: painter rolling an interior wall (Pexels) | Tima Miroshnichenko |
| stadare-dammsuger.jpg | Hero collage: cleaner in work clothes vacuuming (Pexels) | Tima Miroshnichenko |
| stadteam.jpg | Two cleaners in a bright living room (Pexels, not on the homepage now) | Tima Miroshnichenko |
| stadning-kok.jpg | Wiping a kitchen sink | everdrop GmbH |
| stadning.jpg | Vacuuming | Giorgio Trovato |
| angtvatt.jpg | Steam-cleaning bathroom tiles | Aurum Gebäudereinigung Kassel |
| avtorkning.jpg | Wiping a surface in gloves | Anton |
| packning.jpg | Packing moving boxes | Vitaly Gariev |
| barhjalp.jpg | Movers carrying furniture from the truck (logos painted out) | Joseph Prospere |
| malning-roller.jpg | Painting a wall with a roller | Andrew Itaga |
| farg-och-roller.jpg | Paint, roller and brush | Annie Spratt |
| fasadmalare.jpg | A craftsman repairing and painting a facade (London) | Flow Clark |
| fonsterputsare.jpg | Window cleaner with a water-fed pole | Joshua Bowers |
| tradgardsmastare.jpg | Gardener with a wheelbarrow | FRAEM GmbH |
| it-tekniker.jpg | Technician repairing a laptop | Revendo |
| hemtjanst.jpg | Carer serving tea at home | Care Assure |
| badrum-vvs.jpg | Tradesman working in a bathroom | bhagya laxmi |
| rormokare.jpg | Plumber at a water heater | Marian Florinel Condruz |
| elektriker.jpg | Electrician fitting a light | Bermix Studio |
| takarbete.jpg | Roofers with safety harnesses | Raze Solar |
| markarbete.jpg | Mini excavator digging a trench in a garden | Annie Spratt |
| snickare-falun.jpg | A carpenter measuring a board (Falun) | Jimmy Nilsson Masth |

## Not done yet / before launch

- **Legal texts:** reviewed by a lawyer in October 2026 and published without a draft banner. Have
  later changes to Villkor, Integritetspolicy or the RUT/ROT pages reviewed again.
- **Company name:** `lib/company.ts` uses "Nordvra" as the legal name; change it to the registered
  name (e.g. "Nordvra AB") once the company is registered. Phone hours on /kontakt: "Vardagar 8–18".
- **Partners:** add partner companies under **Admin → Partners** (org.nr and verified F-skatt are required before one can be assigned).
- **Email/SMS:** both run as console placeholders. Enable Resend (domain verification) and implement 46elks.
- **Payments:** no live payments (manual placeholder). Payment must be electronic and made by the buyer.
- **Skatteverket:** no automatic submission. Use **Admin → Export** (CSV) to file claims.
- **Catalogue check:** confirm the service list and Skatteverket work types against Skatteverket's current lists.
- Admin UI strings are written inline in Swedish (internal tool); customer-facing strings are in `lib/i18n`.
