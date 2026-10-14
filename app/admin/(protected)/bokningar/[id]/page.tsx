import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { decryptPII } from "@/lib/crypto/pii";
import { getCatalog } from "@/lib/catalog/load";
import { rankPartners } from "@/lib/admin/partners";
import { BOOKING_STATUSES } from "@/lib/admin/filters";
import { calculatePrice } from "@/lib/pricing/calculate";
import { getTaxRules, taxYearForDate, type TaxRuleOverride } from "@/lib/taxRules";
import { formatDateLong, formatDateShort, formatDateTime, formatKr, formatKrRange, formatPostcode } from "@/lib/format";
import { t } from "@/lib/i18n";
import { Card } from "@/components/ui";
import { Flash, ModelBadge, PageHeader, StatusBadge, selectClasses, tableClasses, tdClasses, thClasses } from "@/components/admin/bits";
import { QuoteEditor } from "@/components/admin/QuoteEditor";
import { addNoteAction, saveClaimAction, sendConfirmationAction, setStatusAction } from "@/lib/admin/booking-actions";

export const metadata = { title: "Bokning" };

const ANSWER_LABELS: Record<string, string> = {
  age18: "Minst 18 år i år",
  taxSweden: "Betalar skatt i Sverige",
  rutResidence: "Bor i bostaden / fritidshus / föräldrars hem",
  rotOwner: "Äger bostaden",
  rotBuildingOver5: "Huset är mer än 5 år",
  buyerCount: "Antal som delar på avdraget",
  usedThisYear: "Redan använt RUT/ROT i år",
};

function answerText(v: unknown): string {
  if (v === true) return "Ja";
  if (v === false) return "Nej";
  if (v === "ja") return "Ja";
  if (v === "nej") return "Nej";
  if (v === "vet_inte") return "Vet inte";
  return v == null ? "–" : String(v);
}

function obj(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

const kr = (ore: number | null | undefined) => (ore == null ? "" : String(Math.round(ore / 100)));

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-x-4 border-b border-border py-2 sm:grid-cols-[14rem_1fr]">
      <dt className="font-bold">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

export default async function BookingDetailPage({ params, searchParams }: PageProps<"/admin/bokningar/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();

  const supabase = await createServerSupabase();
  const [{ data: b }, { data: buyers }, { data: events }, { data: notes }, { data: partners }, { data: overridesRaw }, catalog] =
    await Promise.all([
      supabase.from("bookings").select("*").eq("id", id).maybeSingle(),
      supabase.from("booking_buyers").select("*").eq("booking_id", id).order("position"),
      supabase.from("booking_events").select("*").eq("booking_id", id).order("at", { ascending: false }),
      supabase.from("booking_notes").select("*").eq("booking_id", id).order("created_at", { ascending: false }),
      supabase.from("partners").select("*").order("name"),
      supabase.from("tax_rule_overrides").select("*"),
      getCatalog(),
    ]);
  if (!b) notFound();

  const overrides: TaxRuleOverride[] = (overridesRaw ?? []).map((o) => ({
    year: o.year,
    ...(o.rut_rate != null && { rutRate: Number(o.rut_rate) }),
    ...(o.rot_rate != null && { rotRate: Number(o.rot_rate) }),
    ...(o.rut_cap_ore != null && { rutCapPerPerson: o.rut_cap_ore }),
    ...(o.rot_cap_ore != null && { rotCapPerPerson: o.rot_cap_ore }),
    ...(o.combined_cap_ore != null && { combinedCapPerPerson: o.combined_cap_ore }),
  }));

  const eligibility = obj(b.eligibility);
  const eligible = eligibility.eligible !== false;
  const answers = obj(eligibility.answers);
  const details = obj(b.details);
  const estimate = obj(b.estimate);
  const addonLabels = (Array.isArray(details.addonIds) ? details.addonIds : [])
    .map((aid) => catalog.addons.find((a) => a.id === aid)?.label ?? String(aid))
    .join(", ");
  const rotProperty = obj(b.rot_property);

  // Personnummer is decrypted only here, server-side, for the signed-in admin.
  const buyerRows = (buyers ?? []).map((x) => {
    let full = "";
    if (x.pnr_encrypted) {
      try {
        full = decryptPII(x.pnr_encrypted);
      } catch {
        full = "(kunde inte dekrypteras)";
      }
    }
    return { ...x, full };
  });
  let perBuyer: number[] = [];
  if (b.labour_ore != null && buyerRows.length > 0) {
    try {
      perBuyer = calculatePrice({
        deductionType: b.deduction_type,
        lines: { labour: b.labour_ore, material: b.material_ore, travel: b.travel_ore },
        rules: getTaxRules(taxYearForDate(b.scheduled_date ?? b.preferred_date, new Date().getFullYear()), overrides),
        eligible,
        buyers: buyerRows.map((x) => ({ sharePct: Number(x.share_pct) })),
        labourShareOfTotal: b.labour_share_of_total == null ? null : Number(b.labour_share_of_total),
      }).buyers.map((x) => x.deduction);
    } catch {
      perBuyer = [];
    }
  }

  const ranked = rankPartners(partners ?? [], b.service_id, b.postcode);
  const range = (k: string) => {
    const r = estimate[k];
    return Array.isArray(r) && r.length === 2 ? formatKrRange([Number(r[0]), Number(r[1])]) : null;
  };

  return (
    <>
      <p className="mb-2">
        <Link href="/admin/bokningar" className="link">
          ← Alla bokningar
        </Link>
      </p>
      <PageHeader title={b.booking_number}>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <StatusBadge status={b.status} />
          <ModelBadge model={b.model} deduction={b.deduction_type} />
          <span className="font-bold">{b.service_name}</span>
        </div>
      </PageHeader>
      <Flash params={sp} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card as="section" aria-labelledby="kund">
          <h2 id="kund" className="mb-3 text-xl font-bold">Kund och förfrågan</h2>
          <dl>
            <Row label="Namn">{b.contact_name}</Row>
            <Row label="Telefon">
              <a className="link" href={`tel:${b.contact_phone}`}>{b.contact_phone}</a>
            </Row>
            <Row label="E-post">
              <a className="link break-all" href={`mailto:${b.contact_email}`}>{b.contact_email}</a>
            </Row>
            <Row label="Adress">
              {b.street}, {formatPostcode(b.postcode)} {b.city}
            </Row>
            <Row label="Önskat datum">
              {formatDateLong(b.preferred_date)}, {t.common.timeWindows[b.time_window]}
              {b.flexible && <strong> · Flexibel – välj billigaste tid</strong>}
            </Row>
            {b.inspection_date && <Row label="Besiktning">{formatDateLong(b.inspection_date)}</Row>}
            <Row label="Bostad">
              {t.common.housing[b.housing_type]}
              {b.size_band && `, ${t.common.sizeBands[b.size_band]}`}
              {b.floors != null && `, ${b.floors} plan`}
              {b.pets != null && (b.pets ? ", husdjur" : ", inga husdjur")}
            </Row>
            {addonLabels && <Row label="Tillval">{addonLabels}</Row>}
            {details.windows != null && <Row label="Antal fönster">{String(details.windows)}</Row>}
            {typeof details.frequency === "string" && (
              <Row label="Hur ofta">{t.common.frequencies[details.frequency as keyof typeof t.common.frequencies] ?? details.frequency}</Row>
            )}
            {Array.isArray(details.appliances) && details.appliances.length > 0 && (
              <Row label="Vitvaror">{details.appliances.join(", ")}</Row>
            )}
            {b.customer_note && <Row label="Kundens meddelande">{b.customer_note}</Row>}
            <Row label="Skapad">{formatDateTime(b.created_at)}</Row>
          </dl>
        </Card>

        <Card as="section" aria-labelledby="avdrag">
          <h2 id="avdrag" className="mb-3 text-xl font-bold">Avdrag och uppskattning</h2>
          <p className="mb-2 font-bold">{eligible ? "Har rätt till avdrag enligt svaren" : "Har INTE rätt till avdrag enligt svaren"}</p>
          <dl className="mb-4">
            {Object.entries(answers).map(([k, v]) => (
              <Row key={k} label={ANSWER_LABELS[k] ?? k}>
                {answerText(v)}
              </Row>
            ))}
          </dl>
          {Array.isArray(eligibility.reasons) && eligibility.reasons.length > 0 && (
            <ul className="mb-4 list-disc pl-6">
              {eligibility.reasons.map((r) => (
                <li key={String(r)}>{t.common.eligibility.reasons[r as keyof typeof t.common.eligibility.reasons] ?? String(r)}</li>
              ))}
            </ul>
          )}
          <h3 className="font-bold">Uppskattning som kunden såg</h3>
          {range("after") ? (
            <p>
              {range("before")} före avdrag → <strong>{range("after")}</strong> efter avdrag
              {estimate.kind === "rate" ? ` (per ${estimate.unit === "m2" ? "m²" : "timme"})` : ""}
            </p>
          ) : (
            <p className="text-muted">Pris efter offert (ingen uppskattning).</p>
          )}
        </Card>
      </div>

      <Card as="section" aria-labelledby="offert" className="mt-6">
        <h2 id="offert" className="mb-1 text-xl font-bold">Offert</h2>
        {b.quote_sent_at && (
          <p className="mb-4 text-muted">
            Senast skickad {formatDateTime(b.quote_sent_at)}, giltig till {formatDateTime(b.quote_expires_at)}.
          </p>
        )}
        <QuoteEditor
          bookingId={b.id}
          model={b.model}
          deductionType={b.deduction_type}
          eligible={eligible}
          buyerCount={b.buyer_count}
          labourShareOfTotal={b.labour_share_of_total == null ? null : Number(b.labour_share_of_total)}
          preferredDate={b.preferred_date}
          taxOverrides={overrides}
          alreadySent={Boolean(b.quote_sent_at)}
          partners={ranked.map((r) => ({
            id: r.partner.id,
            name: r.partner.name,
            matches: r.matches,
            blockedReason: r.blockedReason,
            commissionPct: Number(r.partner.commission_pct),
          }))}
          initial={{
            labourKr: kr(b.labour_ore),
            materialKr: kr(b.material_ore || null),
            travelKr: kr(b.travel_ore || null),
            hours: b.hours == null ? "" : String(b.hours),
            scheduledDate: b.scheduled_date ?? b.preferred_date,
            scheduledTimeWindow: b.scheduled_time_window ?? b.time_window,
            partnerId: b.partner_id ?? "",
            commissionPct: b.commission_pct == null ? "" : String(b.commission_pct),
            subcontractorCostKr: kr(b.subcontractor_cost_ore),
            quoteMessage: b.quote_message ?? "",
          }}
        />
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card as="section" aria-labelledby="status">
          <h2 id="status" className="mb-3 text-xl font-bold">Status</h2>
          <form action={setStatusAction} className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="bookingId" value={b.id} />
            <label className="block grow">
              <span className="mb-1 block font-bold">Ändra status</span>
              <select name="status" defaultValue={b.status} className={selectClasses}>
                {BOOKING_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {t.common.status[s]}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className="min-h-12 rounded-control border-2 border-brand bg-brand px-5 font-bold text-on-brand">
              Spara status
            </button>
          </form>
          {b.approved_at && (
            <form action={sendConfirmationAction} className="mt-4">
              <input type="hidden" name="bookingId" value={b.id} />
              <button type="submit" className="min-h-12 rounded-control border-2 border-brand bg-surface px-5 font-bold text-brand">
                Skicka bekräftelse till kunden
              </button>
            </form>
          )}
          {b.declined_at && (
            <p className="mt-4">
              Kunden tackade nej {formatDateShort(b.declined_at)}
              {b.decline_reason ? `: ${b.decline_reason}` : "."}
            </p>
          )}
        </Card>

        <Card as="section" aria-labelledby="kopare">
          <h2 id="kopare" className="mb-3 text-xl font-bold">Köpare (efter godkännande)</h2>
          {buyerRows.length === 0 ? (
            <p className="text-muted">Inga köpare ännu – fylls i när kunden godkänner offerten.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className={tableClasses}>
                <thead>
                  <tr>
                    <th scope="col" className={thClasses}>Namn</th>
                    <th scope="col" className={thClasses}>Personnummer</th>
                    <th scope="col" className={thClasses}>Andel</th>
                    <th scope="col" className={thClasses}>Avdrag att begära</th>
                  </tr>
                </thead>
                <tbody>
                  {buyerRows.map((x, i) => (
                    <tr key={x.id}>
                      <td className={tdClasses}>{x.full_name}</td>
                      <td className={`${tdClasses} font-mono`}>{x.full || x.pnr_masked}</td>
                      <td className={tdClasses}>{Number(x.share_pct)} %</td>
                      <td className={tdClasses}>{perBuyer[i] != null ? formatKr(perBuyer[i]) : "–"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {b.deduction_type === "rot" && b.rot_property && (
            <dl className="mt-4">
              {typeof rotProperty.fastighetsbeteckning === "string" && (
                <Row label="Fastighetsbeteckning">{rotProperty.fastighetsbeteckning}</Row>
              )}
              {typeof rotProperty.brf_org_nr === "string" && <Row label="BRF org.nr">{rotProperty.brf_org_nr}</Row>}
              {typeof rotProperty.lagenhetsnummer === "string" && (
                <Row label="Lägenhetsnummer">{rotProperty.lagenhetsnummer}</Row>
              )}
            </dl>
          )}
        </Card>
      </div>

      <Card as="section" aria-labelledby="faktura" className="mt-6">
        <h2 id="faktura" className="mb-3 text-xl font-bold">Utfört, faktura, betalning och avdrag</h2>
        <form action={saveClaimAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <input type="hidden" name="bookingId" value={b.id} />
          {(
            [
              ["completedAt", "Utfört datum", "date", b.completed_at ?? ""],
              ["invoiceNumber", "Fakturanummer", "text", b.invoice_number ?? ""],
              ["invoiceDate", "Fakturadatum", "date", b.invoice_date ?? ""],
              ["paidKr", "Betalt belopp, kr", "text", kr(b.paid_amount_ore)],
              ["paidAt", "Betaldatum", "date", b.paid_at ?? ""],
              ["claimRequestedKr", "Begärt avdrag, kr", "text", kr(b.claim_requested_ore)],
              ["claimRequestedAt", "Begärt datum", "date", b.claim_requested_at ?? ""],
              ["claimSettledAt", "Beslut från Skatteverket", "date", b.claim_settled_at ?? ""],
              ["claimApprovedKr", "Beviljat belopp, kr", "text", kr(b.claim_approved_ore)],
            ] as const
          ).map(([name, label, type, value]) => (
            <label key={name} className="block">
              <span className="mb-1 block font-bold">{label}</span>
              <input
                name={name}
                type={type}
                defaultValue={value}
                inputMode={type === "text" && name.endsWith("Kr") ? "decimal" : undefined}
                className={selectClasses}
              />
            </label>
          ))}
          <label className="block">
            <span className="mb-1 block font-bold">Betalsätt</span>
            <select name="paymentMethod" defaultValue={b.payment_method ?? ""} className={selectClasses}>
              <option value="">–</option>
              <option value="swish">Swish</option>
              <option value="kort">Kort</option>
              <option value="overforing">Överföring</option>
            </select>
          </label>
          <div className="sm:col-span-2 lg:col-span-3">
            <p className="mb-3 text-sm text-muted">
              Personnumret raderas automatiskt {"när"} beslutet från Skatteverket är äldre än lagringstiden i inställningarna.
            </p>
            <button type="submit" className="min-h-12 rounded-control border-2 border-brand bg-brand px-5 font-bold text-on-brand">
              Spara
            </button>
          </div>
        </form>
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card as="section" aria-labelledby="anteckningar">
          <h2 id="anteckningar" className="mb-3 text-xl font-bold">Interna anteckningar</h2>
          <form action={addNoteAction} className="mb-4 space-y-3">
            <input type="hidden" name="bookingId" value={b.id} />
            <label className="block">
              <span className="sr-only">Ny anteckning</span>
              <textarea name="body" rows={3} required maxLength={5000} className={selectClasses} placeholder="T.ex. portkod, kontakt med utförare …" />
            </label>
            <button type="submit" className="min-h-12 rounded-control border-2 border-brand bg-surface px-5 font-bold text-brand">
              Lägg till anteckning
            </button>
          </form>
          <ul className="space-y-3">
            {(notes ?? []).map((n) => (
              <li key={n.id} className="rounded-control bg-surface-muted p-3">
                <p className="whitespace-pre-wrap">{n.body}</p>
                <p className="mt-1 text-sm text-muted">
                  {n.author_email} · {formatDateTime(n.created_at)}
                </p>
              </li>
            ))}
          </ul>
        </Card>

        <Card as="section" aria-labelledby="historik">
          <h2 id="historik" className="mb-3 text-xl font-bold">Historik</h2>
          <ol className="space-y-2">
            {(events ?? []).map((e) => (
              <li key={e.id} className="border-b border-border pb-2">
                <p>
                  {e.to_status ? (
                    <>
                      {e.from_status ? `${t.common.status[e.from_status]} → ` : ""}
                      <strong>{t.common.status[e.to_status]}</strong>
                    </>
                  ) : (
                    e.message
                  )}
                </p>
                <p className="text-sm text-muted">
                  {formatDateTime(e.at)} · {e.actor}
                </p>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </>
  );
}
