import { formatKrRange } from "@/lib/format";
import { fmt, t } from "@/lib/i18n";
import type { Range } from "@/lib/pricing/calculate";
import { ratePercent, type DeductionType } from "@/lib/taxRules";
import type { DerivedRequest } from "./state";

/**
 * Turns the derived estimate into the texts of the step 7 price card (SPEC §4). Pure, so the
 * wording rules are unit-tested: always "vanligtvis", no booking fee, ROT is never "halva
 * priset", ineligible customers see the full price.
 */

/** Real minus sign (U+2212), read as "minus" by screen readers. */
const MINUS = "−";

export interface PriceViewLine {
  key: "labour" | "extras" | "deduction" | "fee" | "toPay";
  label: string;
  value: string;
  /** True when `value` is an amount (kept on one line); false for explanatory text. */
  isAmount: boolean;
  /** Small text under the label. */
  hint?: string;
  emphasis?: "normal" | "strong" | "total";
  accent?: DeductionType;
}

export interface PriceView {
  kind: "total" | "rate" | "quote";
  deductionType: DeductionType;
  /** "RUT-avdrag" / "ROT-avdrag". */
  deductionName: string;
  ratePct: number;
  eligible: boolean;
  /** Big line, e.g. "Vanligtvis 3 800–4 800 kr efter RUT-avdrag". Null when the partner quotes. */
  headline: string | null;
  /** Shown instead of a price when there is no indicative range. */
  quoteText: string | null;
  lines: PriceViewLine[];
}

function amount(range: Range, kind: "total" | "rate", unit: "hour" | "m2" | null, perVisit: boolean): string {
  const price = formatKrRange(range);
  const s = t.booking.steps.summary;
  if (kind === "rate") return fmt(unit === "m2" ? s.rateM2 : s.rateHour, { price });
  return perVisit ? fmt(s.perVisit, { price }) : price;
}

export function priceView(derived: DerivedRequest): PriceView | null {
  const { service, estimate, display, eligibility, rules } = derived;
  if (!service || !estimate) return null;

  const type = service.deductionType;
  const deductionName = type === "rut" ? t.common.deduction.rutDeduction : t.common.deduction.rotDeduction;
  const ratePct = ratePercent(rules, type);
  const eligible = eligibility?.eligible ?? true;
  const s = t.booking.steps.summary;
  const p = t.common.price;
  const fee: PriceViewLine = { key: "fee", label: p.noBookingFee, value: s.zeroKr, isAmount: true };

  if (estimate.kind === "quote" || !display) {
    return {
      kind: "quote",
      deductionType: type,
      deductionName,
      ratePct,
      eligible,
      headline: null,
      quoteText: type === "rot" ? p.quoteFromPartner : s.quoteOnlyRut,
      lines: [fee],
    };
  }

  const kind = estimate.kind;
  const unit = estimate.kind === "rate" ? estimate.unit : null;
  const perVisit = estimate.kind === "total" && estimate.perVisit;
  const show = (range: Range) => amount(range, kind, unit, perVisit);
  const hasDeduction = eligible && display.deduction[1] > 0;

  // The price list's note describes the labour range ("Per städtillfälle …", "Före ROT-avdrag …").
  // Window prices are already multiplied by the number of windows, so their "per fönster" note
  // would be misleading there.
  const labourHint = service.pricingUnit === "window" ? undefined : (estimate.note ?? undefined);
  const share = service.labourShareOfTotal;
  const deductionHint =
    hasDeduction && share != null ? fmt(s.labourShareHint, { share: Math.round(share * 100) }) : undefined;

  const lines: PriceViewLine[] = [
    { key: "labour", label: p.labourBeforeDeduction, value: show(display.labour), isAmount: true, hint: labourHint },
    display.extras[1] > 0
      ? { key: "extras", label: p.materialAndTravel, value: show(display.extras), isAmount: true }
      : { key: "extras", label: p.materialAndTravel, value: p.materialAndTravelLater, isAmount: false },
    {
      key: "deduction",
      label: fmt(p.deduction, { type: t.common.deduction[type], rate: ratePct }),
      value: hasDeduction ? `${MINUS}${show(display.deduction)}` : s.noDeduction,
      isAmount: hasDeduction,
      hint: deductionHint,
      accent: hasDeduction ? type : undefined,
    },
    fee,
    { key: "toPay", label: p.toPay, value: show(display.after), isAmount: true, emphasis: "total" },
  ];

  return {
    kind,
    deductionType: type,
    deductionName,
    ratePct,
    eligible,
    headline: hasDeduction
      ? fmt(s.headline, { price: show(display.after), deduction: deductionName })
      : fmt(s.headlineNoDeduction, { price: show(display.after) }),
    quoteText: null,
    lines,
  };
}
