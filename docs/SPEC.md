# Nordvra – build specification (single source for all contributors)

Nordvra is a mobile-first, Swedish-language "vi bokar åt dig" concierge for services that qualify
for RUT and ROT. Brand on the site: **Nordvra**. Nordvra is based in Stockholm, has no staff of its
own doing jobs, and covers **all of Sweden** through partner companies (subcontractors).

Value proposition (copy): "Vi hittar ett bra företag, du slipper jämföra offerter, och vi hjälper dig
med RUT/ROT-avdraget." Never call ROT/RUT a "loophole", "trick" or "kryphål". It is a legal,
mainstream tax reduction.

Positioning vs Servicefinder/Offerta (which sell leads; customer writes a description, gets 2–6
quotes and must compare/vet alone; nobody checks eligibility up front or shows a price after
deduction): our differences – click-only flow (~2 minutes), indicative price before and after
deduction shown up front, eligibility check built in, we choose and vet the company, phone support
(people over 65 make ~41 % of RUT purchases), **ingen bokningsavgift**.

---------------------------------------------------------------------------------------------------
## 0. Ground rules for every contributor

* **Read `AGENTS.md`.** This is Next.js **16.4** with **Cache Components + Partial Prefetching on**
  (`next.config.ts`). Docs for this exact version are in `node_modules/next/dist/docs/`. Read the
  relevant guide before writing route code. Key rules:
  * `params`, `searchParams`, `cookies()`, `headers()` are async (`await`).
  * Request-time data (cookies, DB reads per request, `searchParams`) must sit inside `<Suspense>` or
    the segment must `export const instant = false` (allowed to block). Use `instant = false` on
    admin layouts and on `/offert/[token]`. Public marketing pages must stay static.
  * `Date.now()`, `new Date()`, `Math.random()`, `crypto.randomUUID()` inside **server components**
    during prerender error out – call `await connection()` first (inside Suspense) or do it in
    client components after mount / in server actions.
  * `useSearchParams()` in a client component needs a `<Suspense>` boundary above it.
  * Middleware is now **`proxy.ts`** exporting `function proxy(request)`.
  * Cache invalidation after admin edits: `updateTag('catalog')` inside server actions (or
    `revalidateTag('catalog', 'max')`). Cached reads use `'use cache'` + `cacheLife()` + `cacheTag()`.
* TypeScript strict. Tailwind CSS v4 (CSS-first `@theme` in `app/globals.css`, no tailwind.config).
* **All customer-facing text in Swedish**, stored in `lib/i18n/sv/*.ts` modules (see §6) so English
  can be added later. Admin UI is Swedish too and also uses i18n modules.
* Money is **öre integers** everywhere (1 kr = 100 öre), incl. 25 % VAT. Format with `lib/format.ts`.
* Never put personnummer in URLs, logs, analytics, emails or sessionStorage. Never `console.log`
  request bodies or form data.
* Accessibility WCAG 2.1 AA: body text 18 px (`1.125rem` on a 16 px root, line-height 1.6), no text
  smaller than 16 px, all sizes in rem, tap targets ≥ 48 px,
  visible focus ring, labels on every input, errors linked with `aria-describedby`, `aria-live` on
  price updates, landmarks, skip link, `lang="sv"`. Test at **375 px** width: no horizontal scroll.
* Do **not** `npm install` new packages (shared `node_modules`), do not run `next build` / `next dev`
  in parallel phases, do not commit. Check your own files with
  `npx tsc --noEmit -p . 2>&1 | grep -E '<your paths>'` and `npx eslint <your paths>`.
* Existing, tested code you must **reuse, not duplicate**:
  * `lib/taxRules.ts` – `getTaxRules(year, overrides)`, `CURRENT_RULES`, `ratePercent`, `taxYearForDate`.
  * `lib/pricing/calculate.ts` – `calculatePrice`, `calculateRange`, `evenShares`, `sharesAreValid`.
  * `lib/pricing/estimate.ts` – `estimateForRequest`, `displayRange`, `displayRate`.
  * `lib/eligibility.ts` – `evaluateEligibility`, `eligibilityQuestions`.
  * `lib/validation/identity.ts` – personnummer, org.nr, fastighetsbeteckning, phone, postcode.
  * `lib/crypto/pii.ts` (server-only) – `encryptPII`, `decryptPII`, `createQuoteToken`, `hashToken`.
  * `lib/catalog/types.ts`, `lib/catalog/seed.ts` (seed catalogue), `lib/content/notDeductible.ts`.
  * `lib/format.ts` – `formatKr`, `formatKrRange`, `parseKrToOre`, dates, postcode.
  * Tests: `npm test` (vitest). 54 tests must keep passing.

---------------------------------------------------------------------------------------------------
## 1. Company constants (`lib/company.ts`)

```
brandName: "Nordvra"
legalName: "Nordvra"  (TODO: registered company name, e.g. "Nordvra AB")
phoneDisplay: "072-222 88 00", phoneHref: "tel:+46722228800"
email: "info@nordvra.se"
insurance: "If Skadeförsäkring"  (copy: "Försäkrade hos If")
hasFSkatt: true (copy: "Godkänd för F-skatt")
No org.nr and no postal address are shown (Nordvra works online).
hometown: "Stockholm", coverage: "Hela Sverige"
termsVersion: "2026-10-21"
```
"Hellre ringa? Ring oss på 072-222 88 00" must be visible on every customer page (header button +
in-flow card).

---------------------------------------------------------------------------------------------------
## 2. Business models (modelled in data and UI)

1. **RUT – "seller" model** (cleaning, moving, garden, IT, care…): Nordvra is the seller of
   record: invoices the customer, receives payment, applies to Skatteverket, liable under
   konsumenttjänstlagen; may use vetted subcontractors. Our margin is built into the labour price.
   The customer only sees one price before and after RUT. Internally we store
   `subcontractor_cost_ore` to compute our margin (price − cost). Checkout shows
   **"Avtalspart: Nordvra"** and "Du har reklamationsrätt enligt konsumenttjänstlagen i 3 år."
2. **ROT – "agent" model** (painting, bathroom, electrical, plumbing…): the partner quotes,
   invoices, receives payment and applies for ROT. We take **12 % commission on labour from the
   partner** (default, editable per partner and per booking). **Never shown to the customer.**
   Checkout shows **"Avtalspart: [Partnerföretag] (org.nr …), förmedlat av Nordvra"**.
* **There is NO booking/service fee for customers.** No "Serviceavgift" line anywhere. Market
  **"Ingen bokningsavgift"**.
* Every job is done by a partner company; Nordvra has no own staff.

---------------------------------------------------------------------------------------------------
## 3. Request → quote → booking flow (IMPORTANT: no instant booking)

1. Customer completes the click-only **request (förfrågan)** at `/boka`. Nothing is booked.
   Before sending they see an **indicative range**, e.g. "Flyttstäd 60–79 m²: vanligtvis
   2 300–3 600 kr efter RUT. Exakt pris inom 24 timmar". Wide ranges, always "vanligtvis".
   The ranges follow what Swedish firms charge (their published price lists, checked October
   2026; sources in `lib/catalog/seed.ts`) and should be rechecked about once a year.
2. Owner researches the cheapest good provider for that time, enters the price in admin
   (labour / material / travel split, hours), assigns the partner, and clicks **"Skicka offert"**.
3. The customer gets email/SMS (placeholder providers) with a link `/offert/<token>` (valid 48 h,
   editable in settings). The page shows price before/after RUT/ROT, avtalspart, all legal info and
   checkboxes, plus buyer details: **personnummer for each buyer + share %**, and ROT property
   details (house: fastighetsbeteckning; bostadsrätt: föreningens org.nr + lägenhetsnummer).
   Buttons: **"Godkänn och boka"** (binding booking) and **"Nej tack"**.
4. Only after approval is it binding. Expired link → friendly message + phone number.

Statuses (`booking_status` enum → Swedish labels):
`ny_forfragan` Ny förfrågan → `soker_utforare` Söker utförare → `offert_skickad` Offert skickad →
`godkand` Godkänd → `utford` Utförd → `betald` Betald → `rut_rot_begard` RUT/ROT begärd →
`avslutad` Avslutad / `nekad` Nekad / `avbokad` Avbokad / `offert_utgangen` Offert utgången.
("Nej tack" → `nekad`.)

---------------------------------------------------------------------------------------------------
## 4. Customer request flow `/boka` (click-only; progress bar "Steg X av 8" + back button)

Typing only in step 5 (postcode) and step 8 (contact). State saved in **sessionStorage** (key
`nordvra-request-v1`, zod-validated on read) so going back never loses answers; step number in the
URL (`/boka?steg=3`) so the browser back button works. Personnummer is NOT collected here.

* **Step 1 "Vad behöver du hjälp med?"** – 13 category tiles (icon + name + badge "RUT 50 %" /
  "ROT 30 %"): Städning, Flytt, Fönsterputs, Trädgård & snö, Hem-IT & vitvaror, Barn- & omsorg,
  Måla & tapetsera, Badrum & kök, Snickeri, El, VVS & värmepump, Tak, fasad & fönster,
  Mark & dränering. Clicking a tile advances.
* **Step 2** specific service (`servicesInCategory`). Städning lists RUT cleaning + ROT "Rengöring"
  services, each service card shows its own badge, ROT ones clearly "ROT 30 %". Tak, fasad & fönster
  includes "Murning och sotning" services. If a category has one service, auto-select and skip.
  Show warning chips from `service.warningIds` (and per category) linking to `/vad-ger-inte-avdrag`.
* **Step 3 "Om bostaden"** – type chips: Hyreslägenhet / Bostadsrätt / Villa eller radhus /
  Fritidshus / Mina föräldrars hem (**RUT only**); size chips 0–39, 40–59, 60–79, 80–99, 100–129,
  130–159, 160+ (m²); if `askHomeDetails`: floors stepper (1–5) and pets yes/no. Service-specific:
  flyttstäd add-on chips (Ugn (ingår), Kyl och frys (ingår), Balkong, Inglasad balkong, Spröjsade
  fönster); fönsterputs: number of windows stepper (1–60) + spröjs chip; hemstäd: frequency chips
  En gång / Varje vecka / Varannan vecka / Var fjärde vecka; vitvaror: appliance chips
  (Tvättmaskin, Torktumlare, Diskmaskin, Kyl, Frys, Ugn, Spis, Köksfläkt).
* **Step 4 "När?"** – accessible calendar (Swedish, weeks start Monday, roving tabindex, arrow keys,
  min tomorrow, max +6 months) + time chips Förmiddag / Eftermiddag / Flexibel; flyttstäd also
  "Besiktningsdatum" (optional date or "Vet inte än"); toggle "Jag är flexibel, välj billigaste
  tid" (internal note only, **no discount**).
* **Step 5 "Var?"** – postcode, digits only (`inputMode="numeric"`, `autoComplete="postal-code"`,
  formatted "632 20"), 5 digits. **No coverage blocking** – all of Sweden.
* **Step 6 "Har du rätt till avdraget?"** – yes/no buttons per `eligibilityQuestions()`:
  "Är du minst 18 år i år?", "Betalar du skatt i Sverige?", RUT: "Bor du i bostaden, är det ditt
  fritidshus eller dina föräldrars hem?", ROT: "Äger du bostaden (lagfart eller bostadsrätt)?",
  "Är huset mer än 5 år gammalt?" (No → only repair/maintenance qualifies, not om-/tillbyggnad),
  "Hur många ska dela på avdraget?" (1 / 2 / 3+ → stored 1/2/3), "Har du redan använt RUT/ROT i år?"
  (Ja / Nej / Vet inte) + link "Kolla hur mycket du har kvar på Skatteverkets Mina sidor"
  (https://www.skatteverket.se). If an answer means no deduction: show the price without deduction,
  explain why in plain Swedish (reason texts), and let them continue. **Never block.**
* **Step 7 price summary card** (from `estimateForRequest` + `displayRange`/`displayRate`):
  "Vanligtvis X–Y kr efter RUT-avdrag" (big), then lines: Arbetskostnad (före avdrag) range;
  Material / resor: "Tillkommer vid behov och visas i offerten" (or range if set); RUT-avdrag 50 % /
  ROT-avdrag 30 % (negative range); **"Ingen bokningsavgift"**; Att betala (range). Rate services
  show "vanligtvis X–Y kr/timme" (or kr/m²). ROT with no range: "Pris efter offert från
  partnerföretag, oftast inom 48 h". Text: "Priset är preliminärt. Vi bekräftar exakt pris och tid
  inom 24 timmar." Info boxes: Bara arbetskostnad, Tak, Avdraget är inte garanterat (info only here),
  Betalning.
* **Step 8 contact** – name, phone, email, street, postcode (prefilled), city, optional
  "Något mer vi bör veta?" (door code, parking…). Required checkbox: accept Villkor + Integritetspolicy.
  Info: "Förfrågan är gratis och inte bindande. Du får en offert som du godkänner innan något bokas."
  Submit **"Skicka förfrågan"** → server action → `submit_request` RPC → redirect
  `/boka/klart?nr=NV-2026-00012` → "Tack! … Vi återkommer med pris och tid inom 24 timmar via mejl
  och SMS." + phone. Clear sessionStorage on success.

---------------------------------------------------------------------------------------------------
## 5. Legal texts (plain-Swedish info boxes, never small print; checkboxes where noted)

1. **Avdraget är inte garanterat** (required checkbox on the quote page): "RUT/ROT-avdraget
   förutsätter att du har rätt till det. Om Skatteverket nekar helt eller delvis (t.ex. för att du
   har för lite skatt eller redan använt ditt tak) betalar du mellanskillnaden."
2. **Bara arbetskostnad**: "Avdraget gäller bara arbetskostnaden, inte material eller resor."
   (No service fee exists.)
3. **ROT är 30 %**: never write "halva priset" for ROT. For RUT write "50 % på arbetskostnaden", not
   "halva priset" without qualification.
4. **Tak**: "Max 75 000 kr per person och år för RUT och ROT tillsammans, varav max 50 000 kr för ROT."
5. **Betalning**: "Du måste betala elektroniskt (kort, Swish eller överföring) och själv vara den som
   betalar."
6. **Ångerrätt** (distansavtalslagen): "Du har 14 dagars ångerrätt." If the scheduled job is within
   14 days: required checkbox "Jag vill att arbetet påbörjas inom ångerfristen och förstår att jag
   betalar för utfört arbete om jag ångrar mig."
7. **Personnummer**: "Vi behöver ditt personnummer eftersom lagen kräver det när avdraget begärs
   från Skatteverket. Vi delar det bara med företaget som utför arbetet." + link to privacy policy.
8. **Avtalspart and reklamation**: who the customer contracts with; seller model: "Du har
   reklamationsrätt enligt konsumenttjänstlagen i 3 år."
9. **Villkor**: checkbox accepting terms + privacy policy (required).

Pages: Villkor, Integritetspolicy (GDPR), Vanliga frågor, Så fungerar RUT & ROT, Vad ger inte
avdrag?, Om oss, Kontakt. The legal texts (Villkor, Integritetspolicy, and the legal parts of Så
fungerar / Vad ger inte avdrag) were reviewed by a lawyer in October 2026 and are published without
a draft banner. Any later change to them should be reviewed again before it goes live.

---------------------------------------------------------------------------------------------------
## 6. i18n structure

`lib/i18n/index.ts` exports `sv` (merged object) and type `Messages`; `t` = `sv` for now, plus
`fmt(template, vars)` for "{name}" placeholders. Modules (each owned by one area, see §10):
`lib/i18n/sv/common.ts`, `booking.ts`, `quote.ts`, `content.ts`, `adminBookings.ts`,
`adminConfig.ts`, `email.ts`. Each module default-exports a plain `as const` object.

---------------------------------------------------------------------------------------------------
## 7. Data model (already live on Supabase project `umyrteczoeecnrrpqnix`, eu-north-1)

See `supabase/migrations/*.sql` for exact columns. Tables: `admin_users(email)`, `categories`,
`services`, `service_addons`, `price_ranges` (ranges BEFORE deduction, öre, labour/material/travel
min+max, nullable `size_band`), `settings` (single row id=1: `quote_valid_hours` 48,
`pnr_retention_years` 7, `pnr_unused_retention_days` 90, `default_commission_pct` 12,
`pets_surcharge_pct` 10, `extra_floor_surcharge_pct` 5, `notification_email`), `tax_rule_overrides`
(per year, nullable columns), `partners` (name, org_nr, contact, f_skatt_verified +
f_skatt_checked_at, employer_registered, insurance_company + insurance_valid_to, service_ids[],
regions[], postcode_prefixes[], rating, internal_price_notes, subcontractor_agreement_signed,
commission_pct (default 12), active, notes), `bookings` (snapshot of request,
quote fields, approval/consent timestamps, `rot_property` jsonb, invoice/payment/claim fields),
`booking_buyers` (full_name, `pnr_encrypted` "v1.…", `pnr_masked` "YYMMDD-XXXX", share_pct),
`booking_events` (audit log; status changes logged by trigger), `booking_notes`.

DB-enforced: partner without verified F-skatt can't be assigned (trigger, error hint
`partner_f_skatt`); booking numbers `NV-YYYY-00001` by trigger; status changes logged with actor.

**Public RPCs** (SECURITY DEFINER, callable with the publishable key; customers never touch tables):
* `public_config()` → `{pets_surcharge_pct, extra_floor_surcharge_pct, tax_overrides:[…]}`
* `submit_request(p jsonb)` → booking number. Keys: `service_id, housing_type, size_band, floors,
  pets, details{addonIds, windows, frequency, appliances}, preferred_date (YYYY-MM-DD),
  time_window, flexible, inspection_date, postcode (5 digits), street, city, contact_name,
  contact_phone (+46…), contact_email, customer_note, eligibility{answers, eligible, reasons,
  warnings}, buyer_count, estimate{…snapshot}, terms_version`. Errors (message): `unknown_service`,
  `date_in_past`, `rate_limited`.
* `get_quote(p_token_hash)` → jsonb with booking/quote/partner fields or null.
* `accept_quote(p_token_hash, p_buyers jsonb[{full_name, pnr_encrypted, pnr_masked, share_pct}],
  p_rot_property jsonb{fastighetsbeteckning | brf_org_nr, lagenhetsnummer}, p_consents
  jsonb{deduction, terms, withdrawal_waiver})` → booking number. Errors: `quote_not_found`,
  `quote_not_open`, `quote_expired`, `invalid_buyers`, `invalid_shares`, `missing_consent`,
  `missing_withdrawal_waiver`, `missing_property`.
* `decline_quote(p_token_hash, p_reason)` → booking number.
* `is_admin()`. (`admin_email_allowed` is no longer callable since October 2026.)
Token handling: app generates token with `createQuoteToken()`, stores only `hashToken(token)` in
`bookings.quote_token_hash`; the RPCs take the hash.

Cron (pg_cron): hourly `expire_quotes()`, daily `anonymise_expired_pnr()`.

Admin access: Supabase Auth (email + password). `is_admin()` = confirmed auth user whose email is in
`admin_users`. Seed admin: `cyprinekamoga@gmail.com`. Admins can add more admins in settings.
RLS: catalogue readable by everyone (active rows), everything else admin-only.

Environment (`.env.local` exists locally, `.env.example` documents): `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `PII_ENCRYPTION_KEY`, `NEXT_PUBLIC_SITE_URL`,
`EMAIL_PROVIDER` (console|resend), `RESEND_API_KEY`, `EMAIL_FROM`, `SMS_PROVIDER` (console|46elks),
`SMS_API_USER`, `SMS_API_PASSWORD`. No service-role key is used anywhere.

---------------------------------------------------------------------------------------------------
## 8. Shared infrastructure contracts (built in phase 1 by the infra agent)

* `lib/supabase/env.ts` – `supabaseEnv()` returns `{url, key} | null`; `isSupabaseConfigured()`.
* `lib/supabase/anon.ts` – `createAnonClient()` (supabase-js, no cookies, `persistSession:false`) for
  catalogue reads and public RPCs from server code.
* `lib/supabase/server.ts` – `createServerSupabase()` (async, @supabase/ssr with `cookies()`), for
  admin pages/actions.
* `lib/supabase/browser.ts` – `createBrowserSupabase()` (only if needed by admin login UI).
* `lib/supabase/database.types.ts` – generated types; clients typed with `Database`.
* `lib/catalog/load.ts` – `getCatalog(): Promise<Catalog>` with `'use cache'`,
  `cacheLife('minutes')`, `cacheTag('catalog')`; DB rows mapped to `lib/catalog/types.ts`; falls back
  to `seedCatalog` when Supabase isn't configured or the query fails (logs a warning without data).
* `lib/auth/admin.ts` – `getAdmin()` → `{email} | null`; `requireAdmin()` redirects to
  `/admin/login`. Every admin server action calls `requireAdmin()` first.
* `lib/email/index.ts` – `EmailProvider` interface `{send({to, subject, text, html})}`;
  `ConsoleEmailProvider` (logs only recipient domain + subject, never bodies), `ResendEmailProvider`
  stub with TODO; `getEmailProvider()`. Templates in `lib/email/templates.ts`: `requestReceived`,
  `ownerNewRequest`, `quoteSent(link)`, `bookingConfirmed`, `ownerQuoteAnswered`. **Never include
  personnummer.**
* `lib/sms/index.ts` – same pattern (`ConsoleSmsProvider`, `FortySixElksSmsProvider` stub).
* `lib/payments/index.ts` – `PaymentProvider` interface (`createPaymentRequest`, `getStatus`),
  `ManualPaymentProvider` placeholder (admin marks paid), TODO Swish Handel / card.
* `proxy.ts` – refreshes Supabase auth cookies for `/admin/:path*`.
* `next.config.ts` – keep `cacheComponents`/`partialPrefetching`; add security headers (X-Frame-Options
  DENY, nosniff, Referrer-Policy strict-origin-when-cross-origin; `/offert/:path*` gets
  `Referrer-Policy: no-referrer` and `X-Robots-Tag: noindex`; `/admin/:path*` noindex).

### 8a. Exact signatures (binding – build against these even if the file isn't written yet)

ALREADY WRITTEN (do not rewrite): `lib/supabase/database.types.ts` (`Database`, `Tables<'bookings'>`,
`Enums<'booking_status'>`, `Constants`), `lib/supabase/env.ts` (`supabaseEnv()`,
`isSupabaseConfigured()`, `SupabaseNotConfiguredError`), `lib/supabase/anon.ts`
(`createAnonClient(): TypedSupabaseClient`, `type TypedSupabaseClient`), `lib/supabase/server.ts`
(`createServerSupabase(): Promise<TypedSupabaseClient>`), `lib/supabase/browser.ts`
(`createBrowserSupabase()`).

Written by the infra agent (same time as the feature agents – import them by these exact names):
```ts
// lib/catalog/load.ts
export async function getCatalog(): Promise<Catalog>            // 'use cache', cacheTag('catalog')
export const CATALOG_TAG = "catalog"
// lib/auth/admin.ts  (server-only)
export type AdminUser = { id: string; email: string }
export async function getAdmin(): Promise<AdminUser | null>
export async function requireAdmin(): Promise<AdminUser>        // redirect('/admin/login') if not admin
// lib/settings.ts  (server-only; admin pages/actions)
export type AppSettings = { quoteValidHours: number; pnrRetentionYears: number; pnrUnusedRetentionDays: number;
  defaultCommissionPct: number; petsSurchargePct: number; extraFloorSurchargePct: number; notificationEmail: string }
export async function getSettings(client: TypedSupabaseClient): Promise<AppSettings>  // falls back to defaults
// lib/email/index.ts  (server-only)
export type EmailMessage = { to: string; subject: string; text: string; html?: string }
export interface EmailProvider { send(msg: EmailMessage): Promise<{ ok: boolean; id?: string; error?: string }> }
export function getEmailProvider(): EmailProvider               // EMAIL_PROVIDER=console|resend
export async function sendEmailSafe(msg: EmailMessage): Promise<boolean>  // never throws, logs without PII
// lib/email/templates.ts – each returns { subject: string; text: string; html: string }
requestReceived(p: { name: string; bookingNumber: string; serviceName: string; preferredDate: string })
ownerNewRequest(p: { bookingNumber: string; serviceName: string; postcode: string; preferredDate: string; adminUrl: string })
quoteSent(p: { name: string; bookingNumber: string; serviceName: string; link: string; expiresAt: string })
bookingConfirmed(p: { name: string; bookingNumber: string; serviceName: string; scheduledDate: string | null; timeWindow: string | null })
ownerQuoteAnswered(p: { bookingNumber: string; accepted: boolean; adminUrl: string })
// lib/sms/index.ts  (server-only)
export interface SmsProvider { send(msg: { to: string; text: string }): Promise<{ ok: boolean; error?: string }> }
export function getSmsProvider(): SmsProvider
export async function sendSmsSafe(msg: { to: string; text: string }): Promise<boolean>
// lib/site.ts
export function siteUrl(path?: string): string                  // NEXT_PUBLIC_SITE_URL, no trailing slash
```
`accept_quote` must not contain `DELETE` (the Supabase connector asks for human confirmation on
destructive statements). The admin "Skicka offert" action deletes old `booking_buyers` rows for the
booking (via the RLS server client) before sending a new quote.

## 9. Shared UI contracts (built in phase 1 by the UI agent, `components/ui/*`, `components/layout/*`)

Design: deep green `#0B5D4B` (brand: text, links, button fills with white text) on warm off-white
`#FAF7F2`, ink `#1A2420`; emerald `#2E9E6E` from the logo only for icons and accents on canvas or
white (never text – it is below 4.5:1). Logo: `public/nordvra-logo.png` (transparent; green "N"
mountain-arrow mark above NORDVRA), 40 px tall in the mobile header, 48 px from `lg`, alt
"Nordvra – startsida"; `public/nordvra-mark.png` (mark only) is the source of `app/favicon.ico`,
`app/icon.png` and `app/apple-icon.png`. Light theme.
Font: Figtree (`next/font/google`, latin + latin-ext, `--font-sans`). Weights: headings and prices
700 (hero H1 800), body 400, buttons 600, uppercase small labels 700 with 0.06em letter-spacing
(`label-caps`). Headings in sentence case. No dashes as punctuation in customer-facing copy
(" – " or "—"): use a comma, colon or full stop. Hyphens in words (RUT-avdrag) and ranges
("2 300–3 600 kr") are fine. Prices "1 250 kr" with non-breaking spaces
(`formatKr`), shown with the `price` utility (bold, tabular figures).
ROT accent: warm amber/terracotta with AA contrast. All tokens in `app/globals.css` `@theme`.
Components (named exports, documented props, all keyboard-accessible, ≥48 px targets):
`Button` (variants primary/secondary/ghost, `asChild`-free; `LinkButton` for links), `Tile`
(button with icon, title, badge, optional description), `ChipGroup` (native radio or checkbox inputs
styled as chips; props `name, legend, options[{value,label,hint?,disabled?}], value, onChange,
multiple?`), `Stepper` (−/+ with label, min, max, aria-live), `YesNo` (radio pair "Ja"/"Nej", plus
optional third option), `Calendar` (as §4), `TextField`, `TextArea`, `Checkbox` (large, with
description and error), `InfoBox` (tone info/warning/legal, title, children), `WarningChip` (links to
/vad-ger-inte-avdrag#id), `DeductionBadge` (type rut|rot → "RUT 50 %"/"ROT 30 %" from
`CURRENT_RULES`), `ProgressBar` (step, total), `Card`, `PriceLine`, `Icon` (maps category icon keys
→ lucide-react icons). Layout: `Header` (logo, nav: Så fungerar det, Vanliga frågor, Kontakt; phone
button always visible on mobile), `Footer` (all page links, company info, F-skatt, If, org.nr TODO),
`PhoneCard` ("Hellre ringa? Ring oss…"), `CookieBanner` (only necessary cookies; acknowledges in
localStorage with try/catch), `SkipLink`.

---------------------------------------------------------------------------------------------------
## 10. File ownership (parallel phase – edit only your own files)

| Area | Owns |
|---|---|
| UI foundation | `app/globals.css`, `app/layout.tsx`, `app/icon.png`, `components/ui/**`, `components/layout/**`, `lib/company.ts`, `lib/i18n/index.ts`, `lib/i18n/sv/common.ts` (+ empty stubs of the other modules) |
| Infra + DB | `lib/supabase/**`, `lib/catalog/load.ts`, `lib/auth/**`, `lib/email/**`, `lib/i18n/sv/email.ts`, `lib/sms/**`, `lib/payments/**`, `proxy.ts`, `next.config.ts`, `.env.example`, `scripts/**`, `supabase/seed.sql`, `package.json` scripts, remote DB |
| Request flow | `app/boka/**`, `components/booking/**`, `lib/booking/**`, `lib/i18n/sv/booking.ts` |
| Quote page | `app/offert/**`, `components/quote/**`, `lib/quote/**`, `lib/i18n/sv/quote.ts` |
| Content | `app/page.tsx`, `app/(info)/**`, `app/not-found.tsx`, `app/sitemap.ts`, `app/robots.ts`, `components/content/**`, `lib/content/faq.ts`, `lib/content/legal.ts`, `lib/i18n/sv/content.ts` |
| Admin bookings | `app/admin/login/**`, `app/admin/auth/**`, `app/admin/(protected)/layout.tsx`, `app/admin/(protected)/page.tsx`, `app/admin/(protected)/bokningar/**`, `components/admin/shell/**`, `components/admin/bookings/**`, `lib/admin/bookings/**`, `lib/i18n/sv/adminBookings.ts` |
| Admin config | `app/admin/(protected)/partners/**`, `app/admin/(protected)/tjanster/**`, `app/admin/(protected)/installningar/**`, `app/admin/(protected)/export/**`, `components/admin/config/**`, `lib/admin/config/**`, `lib/i18n/sv/adminConfig.ts` |

Routes: `/`, `/boka`, `/boka/klart`, `/offert/[token]`, `/sa-fungerar-rut-och-rot`,
`/vad-ger-inte-avdrag`, `/vanliga-fragor`, `/om-oss`, `/kontakt`, `/villkor`, `/integritetspolicy`,
`/admin/login`, `/admin`, `/admin/bokningar`, `/admin/bokningar/[id]`, `/admin/partners`,
`/admin/partners/ny`, `/admin/partners/[id]`, `/admin/tjanster`, `/admin/tjanster/[id]`,
`/admin/installningar`, `/admin/export` (+ `/admin/export/csv` route handler).

---------------------------------------------------------------------------------------------------
## 11. Admin requirements

* Login (email + password). **No self sign-up**: accounts are created only by an admin in
  /admin/installningar ("Skapa konto": email + password, created already confirmed) through the
  Supabase Edge Function `admin-users` (`supabase/functions/admin-users`), which holds the
  service-role key inside Supabase and checks `is_admin()` with the caller's own token.
  Removing an admin deletes the login too. Public sign-ups are switched off in Supabase Auth.
  "Glömt lösenordet?" → reset link → `/admin/auth/confirm?next=/admin/nytt-losenord`. Logout.
* **Bookings list** with filters (status, service, date range, postcode prefix/area), masked
  personnummer (`YYMMDD-XXXX`) only if buyers exist, model badge, status badge.
* **Booking detail**: all answers, eligibility result, indicative estimate snapshot, contact,
  timeline (events), internal notes, **quote editor** (labour / material / travel in kr, hours,
  scheduled date + time window, partner select – partners without verified F-skatt shown disabled
  with reason; matching partners by service + postcode prefix highlighted; commission % for agent
  model prefilled from partner (default 12); subcontractor cost for seller model with computed
  margin; customer message), live preview of the customer price via `calculatePrice`, buttons
  "Spara", "Skicka offert" (creates token, sets `quote_expires_at` from settings, status
  `offert_skickad`, sends email+SMS via providers, shows the link once with a copy button so the
  owner can send it manually while providers are placeholders), status changes, "Skicka
  bekräftelse" email, invoice/payment/claim fields (invoice number/date, paid amount/date/method,
  claim requested amount/date, settled date, approved amount), buyers with **full personnummer
  decrypted only on this page** (server-side), ROT property details.
* **Partners register** (list + create/edit): all partner fields; link "Kontrollera F-skatt hos
  Skatteverket"; F-skatt verified requires a checked date.
* **Services & prices**: edit service fields (active, model, rot kind, name, description, warnings)
  and price ranges per size band (labour/material/travel min–max in kr; show computed after-deduction
  preview), add-ons. Invalidate `catalog` cache tag after save.
* **Settings**: quote validity hours, retention years/days (with TODO note "Bekräfta med revisor"),
  default commission, surcharges, notification email, tax-rule overrides per year (show
  `lib/taxRules.ts` values and warn when overridden), admin users (add/remove email).
* **Export**: CSV of completed **seller-model** jobs (status utford/betald/rut_rot_begard/avslutad,
  date filter): booking number, köpare namn, personnummer (decrypted), andel %, fakturanummer,
  fakturadatum, arbetskostnad, material, resor, betalt belopp, betaldatum, betalsätt, begärt belopp
  (per buyer, from `calculatePrice`), timmar, arbetstyp (`skv_work_type`), RUT/ROT, fastighets-
  beteckning / BRF org.nr / lägenhetsnummer, underleverantör (name + org.nr). UTF-8 with BOM,
  `;` separator, `Cache-Control: no-store`. Also show the same as a table preview without pnr.
* **Stats** on `/admin`: bookings per week (last 12 weeks, simple accessible SVG bar chart with a
  data table), counts by status, revenue (seller: paid amounts; agent: commission = labour ×
  commission %), our margin on seller jobs, requested deductions.

## 12. Homepage

Hero: "Vi bokar städning och hantverkare åt dig, med RUT- och ROT-avdrag" + big button "Boka på 2
minuter" (→ /boka) + "Ingen bokningsavgift" + phone. 3 steps: Välj tjänst → Välj tid → Vi fixar
resten. "Visste du att…": RUT gives 50 % off labour on cleaning, moving, garden etc.; ROT gives 30 %
off labour on repairs and renovation. Example: "Flyttstäd 60 m²: Pris före avdrag 5 600 kr → du
betalar 2 800 kr." (a typical 2026 market price, inside the catalogue's 60–79 m² band).
Comparison vs offer sites (click-only, price up front, eligibility check, we vet the company,
phone support, no booking fee). Trust: based in Stockholm, hela Sverige,
F-skatt, Försäkrade hos If, phone, reviews placeholder ("Omdömen kommer snart"). FAQ preview (5
questions from `lib/content/faq.ts`).

Design direction "Nordisk natur" (photos from `lib/content/photos.ts`, `components/media`,
interactive parts in `components/story`):
* Every photo shows the work we book (RUT/ROT): cleaning, moving, painting and building. No
  landscapes, cityscapes or empty rooms. Photos follow four rules so they read as one shoot: bright
  homes in white, grey and light wood; the only strong colour is the brand's blue-green; hands and
  people at work rather than posed faces; one colour grade (slightly cooler, softer warm tones,
  even brightness). No readable brand names or number plates. Only photos whose original is at
  least 4K (3840 × 2160).
* Hero: split in two (`PhotoSplit`): white text on solid deep green (`forest` token) with "Boka på
  2 minuter" and "Så går det till", the example price, no booking fee and phone; beside it, shown in
  full, a photo of a professional cleaner at work (on phones a strip above the text). The six benefits
  sit in a band under the hero.
* Services: four photo cards of the work (Städning, Flytthjälp, Måla & tapetsera, Snickeri)
  linking to /boka.
* The 3 steps are scrollytelling on a deep-green band: on desktop the logo's zigzag stays in view
  and draws up to the current step, with a small booking-form card for each step; on phones each
  step shows its card along a line.
* "En flyttdag med Nordvra": an example day in three chapters (tabs: 08:00 / 13:00 / 17:00:
  movers carrying furniture from the truck, steam-cleaning the bathroom, the last wipe), clearly
  labelled as an example.
* "Visste du att…" has a calculator ("Räkna själv": RUT or ROT, labour slider) built on
  `calculatePrice` and the current rules; it starts on the example above. The same calculator is on
  /sa-fungerar-rut-och-rot, starting on the painting example.
* "Från Stockholm, för hela Sverige" beside a photo of a craftsman painting a facade; the page ends on a split section
  (painting gear on one side, the booking button and phone on deep green on the other).
* All text is in the server HTML; motion is skipped with `prefers-reduced-motion`. Text never sits
  on a photo: white text is on solid deep green. People in stock photos are illustrations, never
  presented as customers or staff.

## 13. GDPR

Personnummer collected only on quote approval; encrypted in the app (AES-256-GCM) before it reaches
the DB; masked in lists; full value only on booking detail and in the CSV export; never in emails,
URLs, logs, analytics or browser storage. RLS: customers can't read data. Retention: anonymise
automatically (cron) 7 years after claim settled (editable; TODO confirm with accountant);
cancelled/declined/agent jobs after 90 days. Cookie banner: only necessary cookies.

---------------------------------------------------------------------------------------------------
## 14. Trust features (October 2026)

Built from the demand and competitor research (most RUT money goes to cleaning, then garden and
moving; 41 % of RUT buyers are over 65; the most common complaints are unchecked firms, prices
that grow and move-out cleanings that fail the inspection). Migration
`20261019090000_trust_features.sql`.

* **Flyttpaket** (`lib/booking/extras.ts`): flyttstädning ↔ bära, lasta och lossa, and packning →
  flyttstädning. Step 3 offers "Lägg till … i samma förfrågan"; the cleaning's size, floors, pets and
  inspection date are then asked too. Submitting creates **two bookings** (two `submit_request`
  calls) that share `details.package.id` (roles `main`/`extra`); each gets its own quote. Admin shows
  the other half. Flyttstädning is also listed under Flytt.
* **Besiktningsgaranti**: free re-clean up to and including the inspection date, and at least 7
  days after the cleaning (`redo_last_day()`). The customer asks on the booking page
  (`request_redo` RPC → `redo_requested_at`, event, owner email). Checklist page
  `/flyttstadning-checklista` (`lib/content/moveOutChecklist.ts`, printable).
* **Kontrollerat företag**: `get_quote` returns `partner_checks` (F-skatt check date when verified,
  employer registration, insurance + valid to, `partners.founded_on`, agreement). Shown on the quote
  and booking page; expired insurance is not shown.
* **Boka åt en anhörig**: step 8 checkbox; `bookings.resident_name` / `resident_phone`. The quote page
  explains that the buyer must pay; "Skicka bekräftelse" also texts the resident who is coming and
  that nobody may take payment or sell extra work at the door (no names in SMS).
* **Avdragsgaranti**: Nordvra pays the difference when Skatteverket denies the deduction because of
  an error by us or the partner (terms §5). Shown in step 7, on the quote page and in the FAQ.
* **Våra löften** (`components/content/Promises.tsx`): pay after the job, never in advance; the
  quote price is the whole price (travel, call-out, material); no extra work without a new approved
  quote; checked firms; avdragsgaranti. Homepage, step 7 and the quote/booking page.
* **Bostadens logg**: the booking page (`/offert/[token]` after approval) lists every approved job
  for the same email + postcode + street (`get_home_log` RPC): company, price, paid, granted
  deduction, invoice, photos, last day to complain (3 years after completion). Printable.
* **Fotorapport**: `booking_photos` + public storage bucket `fotorapporter`. Objects are named
  `<booking id>/<random uuid>.<ext>`, so a photo is only reachable through the booking link (like
  the token); only admins may list, upload or delete. Admin uploads from the booking page (browser →
  storage with the admin session, then `addPhotoAction`).
* **Säsongsabonnemang** for fönsterputs, gräsklippning and snöskottning (`details.recurring`), and
  **påminnelser**: opt-in in step 8 for jobs people repeat (`remind_on` = job date + 6 or 12 months −
  14 days). `/admin` lists reminders due within two weeks; the owner sends them ("Skicka
  påminnelse", `reminder_sent_at`).
* **Reglerna för 2026** box (`components/content/DeductionRules.tsx`), from `lib/taxRules.ts`: step 6
  and /sa-fungerar-rut-och-rot.
* Terms and privacy policy updated (version 2026-10-21): guarantees, booking for someone else,
  photo reports, reminders (consent). **These new sections must be reviewed by the lawyer before
  real customers use them.**
