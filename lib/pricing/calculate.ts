import { rateFor, type DeductionType, type TaxYearRules } from "@/lib/taxRules";

/**
 * Price and RUT/ROT deduction maths. Pure functions, no I/O.
 *
 * All amounts are öre (integers) including 25 % VAT. Only labour is ever deductible:
 * material, travel and any fees are always paid in full by the customer.
 */

export interface PriceLines {
  labour: number;
  material: number;
  travel: number;
}

export interface Buyer {
  /** Share of the job this buyer pays and claims, 0–100. All buyers must add up to 100. */
  sharePct: number;
  /** RUT already used by this person this year (öre). Unknown = 0. */
  usedRut?: number;
  /** ROT already used by this person this year (öre). Unknown = 0. */
  usedRot?: number;
}

export type CapReason = "rut_cap" | "rot_cap" | "combined_cap";

export interface BuyerDeduction {
  sharePct: number;
  /** What the buyer would get without the yearly caps. */
  uncapped: number;
  deduction: number;
  cappedBy: CapReason | null;
}

export interface PriceInput {
  deductionType: DeductionType;
  lines: PriceLines;
  rules: TaxYearRules;
  /** False when the eligibility answers say the customer cannot get the deduction. */
  eligible: boolean;
  buyers?: Buyer[];
  /**
   * Special rule (second-hand / auction transport): the deductible base is this share of the
   * TOTAL price instead of the labour line.
   */
  labourShareOfTotal?: number | null;
}

export interface PriceBreakdown {
  lines: PriceLines;
  total: number;
  deductibleBase: number;
  rate: number;
  deduction: number;
  toPay: number;
  buyers: BuyerDeduction[];
  capped: boolean;
  eligible: boolean;
}

export class PricingError extends Error {}

const ORE_PER_KR = 100;

/** Skatteverket works in whole kronor. We round each buyer's deduction DOWN to whole kronor. */
export function floorToKrona(ore: number): number {
  return Math.floor((ore + 1e-6) / ORE_PER_KR) * ORE_PER_KR;
}

function assertAmount(name: string, value: number) {
  if (!Number.isFinite(value) || value < 0) {
    throw new PricingError(`${name} must be a non-negative number, got ${value}`);
  }
}

export function sharesAreValid(buyers: Buyer[]): boolean {
  if (buyers.length === 0) return false;
  if (buyers.some((b) => !(b.sharePct > 0) || b.sharePct > 100)) return false;
  const sum = buyers.reduce((s, b) => s + b.sharePct, 0);
  return Math.abs(sum - 100) < 0.01;
}

/** Splits 100 % evenly between n buyers, e.g. 3 → [34, 33, 33]. */
export function evenShares(n: number): number[] {
  const count = Math.max(1, Math.floor(n));
  const base = Math.floor(100 / count);
  return Array.from({ length: count }, (_, i) => base + (i < 100 - base * count ? 1 : 0));
}

function remainingCap(type: DeductionType, buyer: Buyer, rules: TaxYearRules) {
  const usedRut = Math.max(0, buyer.usedRut ?? 0);
  const usedRot = Math.max(0, buyer.usedRot ?? 0);
  const combinedLeft = Math.max(0, rules.combinedCapPerPerson - usedRut - usedRot);
  const ownLeft =
    type === "rut"
      ? Math.max(0, rules.rutCapPerPerson - usedRut)
      : Math.max(0, rules.rotCapPerPerson - usedRot);
  if (ownLeft <= combinedLeft) {
    return { left: ownLeft, reason: (type === "rut" ? "rut_cap" : "rot_cap") as CapReason };
  }
  return { left: combinedLeft, reason: "combined_cap" as CapReason };
}

export function calculatePrice(input: PriceInput): PriceBreakdown {
  const { deductionType, rules, eligible } = input;
  const lines: PriceLines = {
    labour: Math.round(input.lines.labour),
    material: Math.round(input.lines.material),
    travel: Math.round(input.lines.travel),
  };
  assertAmount("labour", lines.labour);
  assertAmount("material", lines.material);
  assertAmount("travel", lines.travel);

  const buyers = input.buyers && input.buyers.length > 0 ? input.buyers : [{ sharePct: 100 }];
  if (!sharesAreValid(buyers)) {
    throw new PricingError("Buyer shares must be above 0 and add up to 100 %");
  }

  const total = lines.labour + lines.material + lines.travel;
  const share = input.labourShareOfTotal;
  const deductibleBase = !eligible
    ? 0
    : share != null
      ? Math.round(total * share)
      : lines.labour;
  const rate = eligible ? rateFor(rules, deductionType) : 0;

  const buyerResults: BuyerDeduction[] = buyers.map((buyer) => {
    const uncapped = floorToKrona((deductibleBase * rate * buyer.sharePct) / 100);
    if (uncapped === 0) {
      return { sharePct: buyer.sharePct, uncapped: 0, deduction: 0, cappedBy: null };
    }
    const cap = remainingCap(deductionType, buyer, rules);
    if (uncapped > cap.left) {
      return {
        sharePct: buyer.sharePct,
        uncapped,
        deduction: floorToKrona(cap.left),
        cappedBy: cap.reason,
      };
    }
    return { sharePct: buyer.sharePct, uncapped, deduction: uncapped, cappedBy: null };
  });

  const deduction = buyerResults.reduce((s, b) => s + b.deduction, 0);

  return {
    lines,
    total,
    deductibleBase,
    rate,
    deduction,
    toPay: total - deduction,
    buyers: buyerResults,
    capped: buyerResults.some((b) => b.cappedBy !== null),
    eligible,
  };
}

export type Range = [min: number, max: number];

export interface PriceRange {
  before: Range;
  deduction: Range;
  after: Range;
  labour: Range;
  extras: Range;
}

export interface RangeInput extends Omit<PriceInput, "lines"> {
  min: PriceLines;
  max: PriceLines;
}

export function calculateRange(input: RangeInput): PriceRange {
  const { min, max, ...rest } = input;
  const lo = calculatePrice({ ...rest, lines: min });
  const hi = calculatePrice({ ...rest, lines: max });
  return {
    before: [lo.total, hi.total],
    deduction: [lo.deduction, hi.deduction],
    after: [lo.toPay, hi.toPay],
    labour: [lo.lines.labour, hi.lines.labour],
    extras: [lo.lines.material + lo.lines.travel, hi.lines.material + hi.lines.travel],
  };
}

/** Widens a range outward to whole steps (default 100 kr) so we never promise false precision. */
export function roundRange([min, max]: Range, stepKr = 100): Range {
  const step = stepKr * ORE_PER_KR;
  return [Math.floor(min / step) * step, Math.ceil(max / step) * step];
}
