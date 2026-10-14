"use client";

import { useActionState, useMemo, useState } from "react";
import { saveQuoteAction, type QuoteFormState } from "@/lib/admin/booking-actions";
import { calculatePrice, evenShares } from "@/lib/pricing/calculate";
import { getTaxRules, taxYearForDate, type TaxRuleOverride } from "@/lib/taxRules";
import { formatKr, parseKrToOre } from "@/lib/format";
import { t } from "@/lib/i18n";
import { Button, InfoBox, TextArea, TextField } from "@/components/ui";
import { selectClasses } from "@/components/admin/bits";

export interface PartnerChoice {
  id: string;
  name: string;
  matches: boolean;
  blockedReason: string | null;
  commissionPct: number;
}

export interface QuoteEditorProps {
  bookingId: string;
  model: "seller" | "agent";
  deductionType: "rut" | "rot";
  eligible: boolean;
  buyerCount: number;
  labourShareOfTotal: number | null;
  preferredDate: string;
  taxOverrides: TaxRuleOverride[];
  partners: PartnerChoice[];
  initial: {
    labourKr: string;
    materialKr: string;
    travelKr: string;
    hours: string;
    scheduledDate: string;
    scheduledTimeWindow: string;
    partnerId: string;
    commissionPct: string;
    subcontractorCostKr: string;
    quoteMessage: string;
  };
  alreadySent: boolean;
}

export function QuoteEditor(props: QuoteEditorProps) {
  const [state, formAction, pending] = useActionState<QuoteFormState, FormData>(saveQuoteAction, {});
  const [v, setV] = useState(props.initial);
  const set = (key: keyof typeof v) => (e: { target: { value: string } }) => setV((s) => ({ ...s, [key]: e.target.value }));

  const preview = useMemo(() => {
    const labour = parseKrToOre(v.labourKr);
    if (labour === null) return null;
    const lines = { labour, material: parseKrToOre(v.materialKr) ?? 0, travel: parseKrToOre(v.travelKr) ?? 0 };
    const year = taxYearForDate(v.scheduledDate || props.preferredDate, new Date().getFullYear());
    try {
      return calculatePrice({
        deductionType: props.deductionType,
        lines,
        rules: getTaxRules(year, props.taxOverrides),
        eligible: props.eligible,
        buyers: evenShares(props.buyerCount).map((sharePct) => ({ sharePct })),
        labourShareOfTotal: props.labourShareOfTotal,
      });
    } catch {
      return null;
    }
  }, [v.labourKr, v.materialKr, v.travelKr, v.scheduledDate, props]);

  const commission = props.model === "agent" ? Number(v.commissionPct.replace(",", ".")) : NaN;
  const subCost = parseKrToOre(v.subcontractorCostKr);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="bookingId" value={props.bookingId} />

      <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <legend className="mb-2 text-lg font-bold">Pris (inkl. moms, före avdrag)</legend>
        <TextField label="Arbetskostnad, kr" name="labourKr" inputMode="decimal" value={v.labourKr} onChange={set("labourKr")} />
        <TextField label="Timmar" name="hours" inputMode="decimal" value={v.hours} onChange={set("hours")} hint="Behövs för Skatteverket." />
        <TextField label="Material, kr" name="materialKr" inputMode="decimal" value={v.materialKr} onChange={set("materialKr")} />
        <TextField label="Resor, kr" name="travelKr" inputMode="decimal" value={v.travelKr} onChange={set("travelKr")} />
      </fieldset>

      <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <legend className="mb-2 text-lg font-bold">Tid och utförare</legend>
        <label className="block">
          <span className="mb-1 block font-bold">Datum för arbetet</span>
          <input type="date" name="scheduledDate" value={v.scheduledDate} onChange={set("scheduledDate")} className={selectClasses} />
        </label>
        <label className="block">
          <span className="mb-1 block font-bold">Tid på dagen</span>
          <select name="scheduledTimeWindow" value={v.scheduledTimeWindow} onChange={set("scheduledTimeWindow")} className={selectClasses}>
            <option value="">Välj</option>
            {(["formiddag", "eftermiddag", "flexibel"] as const).map((w) => (
              <option key={w} value={w}>
                {t.common.timeWindows[w]}
              </option>
            ))}
          </select>
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block font-bold">Utförare</span>
          <select
            name="partnerId"
            value={v.partnerId}
            onChange={(e) => {
              const p = props.partners.find((x) => x.id === e.target.value);
              setV((s) => ({
                ...s,
                partnerId: e.target.value,
                commissionPct: p && props.model === "agent" ? String(p.commissionPct) : s.commissionPct,
              }));
            }}
            className={selectClasses}
          >
            <option value="">Ingen vald</option>
            {props.partners.map((p) => (
              <option key={p.id} value={p.id} disabled={Boolean(p.blockedReason)}>
                {p.matches ? "★ " : ""}
                {p.name}
                {p.blockedReason ? ` – ${p.blockedReason}` : ""}
              </option>
            ))}
          </select>
          <span className="mt-1 block text-sm text-muted">★ = erbjuder tjänsten och täcker postnumret. Utförare utan verifierad F-skatt kan inte väljas.</span>
        </label>
        {props.model === "agent" ? (
          <TextField
            label="Provision från partnern, %"
            name="commissionPct"
            inputMode="decimal"
            value={v.commissionPct}
            onChange={set("commissionPct")}
            hint="Visas aldrig för kunden."
          />
        ) : (
          <TextField
            label="Vår kostnad till underleverantör, kr"
            name="subcontractorCostKr"
            inputMode="decimal"
            value={v.subcontractorCostKr}
            onChange={set("subcontractorCostKr")}
            hint="Internt. Används för att räkna vår marginal."
          />
        )}
      </fieldset>

      <TextArea
        label="Meddelande till kunden (valfritt)"
        name="quoteMessage"
        rows={3}
        value={v.quoteMessage}
        onChange={set("quoteMessage")}
      />

      <section aria-live="polite" className="rounded-card border border-border bg-surface-muted p-4">
        <h3 className="mb-2 font-bold">Kunden ser</h3>
        {preview ? (
          <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 tabular-nums">
            <dt>Pris före avdrag</dt>
            <dd className="text-right">{formatKr(preview.total)}</dd>
            <dt>
              {props.deductionType.toUpperCase()}-avdrag {Math.round(preview.rate * 100)} %
            </dt>
            <dd className="text-right">−{formatKr(preview.deduction)}</dd>
            <dt className="font-bold">Att betala</dt>
            <dd className="text-right font-bold">{formatKr(preview.toPay)}</dd>
            {!props.eligible && (
              <dd className="col-span-2 text-sm text-warning">Kunden har inte rätt till avdrag enligt sina svar.</dd>
            )}
            {props.model === "agent" && Number.isFinite(commission) && (
              <>
                <dt className="text-muted">Vår provision (internt)</dt>
                <dd className="text-right text-muted">{formatKr(Math.round((preview.lines.labour * commission) / 100))}</dd>
              </>
            )}
            {props.model === "seller" && subCost !== null && (
              <>
                <dt className="text-muted">Vår marginal (internt)</dt>
                <dd className="text-right text-muted">{formatKr(preview.total - subCost)}</dd>
              </>
            )}
          </dl>
        ) : (
          <p className="text-muted">Ange arbetskostnad för att se priset.</p>
        )}
      </section>

      {state.message && (
        <div aria-live="polite">
          <InfoBox tone={state.ok ? "success" : "danger"}>{state.message}</InfoBox>
        </div>
      )}
      {state.link && <QuoteLink link={state.link} />}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" name="intent" value="save" variant="secondary" disabled={pending}>
          Spara
        </Button>
        <Button type="submit" name="intent" value="send" disabled={pending}>
          {props.alreadySent ? "Skicka ny offert" : "Skicka offert"}
        </Button>
      </div>
      {props.alreadySent && (
        <p className="text-sm text-muted">En ny offert ersätter den förra länken (den slutar fungera).</p>
      )}
    </form>
  );
}

function QuoteLink({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-card border-2 border-brand bg-brand-soft p-4">
      <p className="mb-2 font-bold">Länk till kunden (visas bara nu)</p>
      <p className="mb-3 break-all font-mono text-sm">{link}</p>
      <Button
        type="button"
        variant="secondary"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(link);
            setCopied(true);
          } catch {
            setCopied(false);
          }
        }}
      >
        {copied ? "Kopierad" : "Kopiera länk"}
      </Button>
    </div>
  );
}
