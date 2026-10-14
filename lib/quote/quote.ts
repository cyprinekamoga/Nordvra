import { isoToUtcDate } from "@/components/ui/calendar-utils";
import { HOUSING_TYPES, SIZE_BANDS, TIME_WINDOWS } from "@/lib/catalog/types";
import type { HousingType, RotKind, SizeBand, TimeWindow } from "@/lib/catalog/types";
import { toNullableNumber } from "@/lib/catalog/map";
import type { EligibilityWarning, IneligibleReason } from "@/lib/eligibility";
import { calculatePrice, evenShares, type Buyer, type PriceBreakdown } from "@/lib/pricing/calculate";
import type { Enums } from "@/lib/supabase/database.types";
import {
  getTaxRules,
  taxYearForDate,
  type DeductionType,
  type ResolvedTaxRules,
  type TaxRuleOverride,
} from "@/lib/taxRules";

/**
 * The quote as returned by the `get_quote` RPC, mapped to a typed, validated shape, plus the
 * pure rules the quote page and the server actions share (which state to show, when the
 * ångerrätt waiver is required, which ROT property fields are needed, the price breakdown).
 * No I/O here, so everything is unit-tested.
 */

export type BookingStatus = Enums<"booking_status">;
export type ServiceModel = "seller" | "agent";

const BOOKING_STATUSES: readonly BookingStatus[] = [
  "ny_forfragan",
  "soker_utforare",
  "offert_skickad",
  "godkand",
  "utford",
  "betald",
  "rut_rot_begard",
  "avslutad",
  "nekad",
  "avbokad",
  "offert_utgangen",
];

const INELIGIBLE_REASONS: readonly IneligibleReason[] = [
  "under18",
  "noSwedishTax",
  "rutNotResidence",
  "rotRental",
  "rotParentsHome",
  "rotNotOwner",
  "rotNewBuilding",
];

const ELIGIBILITY_WARNINGS: readonly EligibilityWarning[] = ["rotRepairOnly", "usedThisYear", "checkRemaining"];

export interface StoredEligibility {
  eligible: boolean;
  reasons: IneligibleReason[];
  warnings: EligibilityWarning[];
}

export interface QuoteData {
  bookingNumber: string;
  status: BookingStatus;
  serviceName: string;
  deductionType: DeductionType;
  model: ServiceModel;
  rotKind: RotKind | null;
  /** Second-hand transport rule: this share of the TOTAL price counts as labour. */
  labourShareOfTotal: number | null;
  housingType: HousingType | null;
  sizeBand: SizeBand | null;
  preferredDate: string | null;
  scheduledDate: string | null;
  scheduledTimeWindow: TimeWindow | null;
  street: string;
  postcode: string;
  city: string;
  contactName: string;
  /** 1–4, from the request ("Hur många ska dela på avdraget?"). */
  buyerCount: number;
  eligibility: StoredEligibility;
  labourOre: number;
  materialOre: number;
  travelOre: number;
  hours: number | null;
  quoteMessage: string | null;
  quoteExpiresAt: string | null;
  performedInHouse: boolean;
  partnerName: string | null;
  partnerOrgNr: string | null;
  approvedAt: string | null;
  declinedAt: string | null;
}

export const MIN_BUYERS = 1;
export const MAX_BUYERS = 4;

/** Quote links carry 32 random bytes as base64url (43 characters). */
export const QUOTE_TOKEN_RE = /^[A-Za-z0-9_-]{20,128}$/;

export function isPlausibleToken(token: unknown): token is string {
  return typeof token === "string" && QUOTE_TOKEN_RE.test(token);
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function nullableStr(value: unknown): string | null {
  const s = str(value);
  return s === "" ? null : s;
}

function isoDate(value: unknown): string | null {
  const s = str(value).slice(0, 10);
  return ISO_DATE_RE.test(s) ? s : null;
}

function timestamp(value: unknown): string | null {
  const s = str(value);
  return s !== "" && !Number.isNaN(new Date(s).getTime()) ? s : null;
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[]): T | null {
  return typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : null;
}

function ore(value: unknown): number {
  const n = toNullableNumber(value);
  return n !== null && n > 0 ? Math.round(n) : 0;
}

function parseEligibility(raw: unknown): StoredEligibility {
  const r = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const reasons = Array.isArray(r.reasons)
    ? r.reasons.map((x) => oneOf(x, INELIGIBLE_REASONS)).filter((x): x is IneligibleReason => x !== null)
    : [];
  const warnings = Array.isArray(r.warnings)
    ? r.warnings.map((x) => oneOf(x, ELIGIBILITY_WARNINGS)).filter((x): x is EligibilityWarning => x !== null)
    : [];
  // Missing flag = eligible (same default as the accept_quote RPC); known reasons always win.
  const eligible = r.eligible === false ? false : reasons.length === 0;
  return { eligible, reasons, warnings };
}

/** `get_quote` JSON → `QuoteData`, or null when the RPC found nothing or the shape is unusable. */
export function parseQuote(raw: unknown): QuoteData | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  const status = oneOf(r.status, BOOKING_STATUSES);
  const deductionType = oneOf(r.deduction_type, ["rut", "rot"] as const);
  const model = oneOf(r.model, ["seller", "agent"] as const);
  const bookingNumber = str(r.booking_number);
  if (!status || !deductionType || !model || !bookingNumber) return null;

  const share = toNullableNumber(r.labour_share_of_total);
  const buyerCount = toNullableNumber(r.buyer_count);
  const hours = toNullableNumber(r.hours);

  return {
    bookingNumber,
    status,
    serviceName: str(r.service_name),
    deductionType,
    model,
    rotKind: oneOf(r.rot_kind, ["repair", "rebuild"] as const),
    labourShareOfTotal: share !== null && share > 0 && share <= 1 ? share : null,
    housingType: oneOf(r.housing_type, HOUSING_TYPES),
    sizeBand: oneOf(r.size_band, SIZE_BANDS),
    preferredDate: isoDate(r.preferred_date),
    scheduledDate: isoDate(r.scheduled_date),
    scheduledTimeWindow: oneOf(r.scheduled_time_window, TIME_WINDOWS),
    street: str(r.street),
    postcode: str(r.postcode),
    city: str(r.city),
    contactName: str(r.contact_name),
    buyerCount:
      buyerCount !== null && Number.isInteger(buyerCount)
        ? Math.min(MAX_BUYERS, Math.max(MIN_BUYERS, buyerCount))
        : MIN_BUYERS,
    eligibility: parseEligibility(r.eligibility),
    labourOre: ore(r.labour_ore),
    materialOre: ore(r.material_ore),
    travelOre: ore(r.travel_ore),
    hours: hours !== null && hours > 0 ? hours : null,
    quoteMessage: nullableStr(r.quote_message),
    quoteExpiresAt: timestamp(r.quote_expires_at),
    performedInHouse: r.performed_in_house === true,
    partnerName: nullableStr(r.partner_name),
    partnerOrgNr: nullableStr(r.partner_org_nr),
    approvedAt: timestamp(r.approved_at),
    declinedAt: timestamp(r.declined_at),
  };
}

/** Which version of the page to show. */
export type QuoteView = "open" | "expired" | "approved" | "declined" | "cancelled" | "notReady";

const APPROVED_STATUSES: readonly BookingStatus[] = ["godkand", "utford", "betald", "rut_rot_begard", "avslutad"];

export function isExpired(quote: Pick<QuoteData, "quoteExpiresAt">, now: Date): boolean {
  if (!quote.quoteExpiresAt) return false;
  return new Date(quote.quoteExpiresAt).getTime() < now.getTime();
}

export function quoteView(quote: QuoteData, now: Date): QuoteView {
  if (APPROVED_STATUSES.includes(quote.status)) return "approved";
  switch (quote.status) {
    case "offert_skickad":
      return isExpired(quote, now) ? "expired" : "open";
    case "offert_utgangen":
      return "expired";
    case "nekad":
      return "declined";
    case "avbokad":
      return "cancelled";
    default:
      return "notReady";
  }
}

/** Whole days from `fromIso` to `toIso` (both "YYYY-MM-DD"). */
export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((isoToUtcDate(toIso).getTime() - isoToUtcDate(fromIso).getTime()) / 86_400_000);
}

/** Days in the ångerfrist (distansavtalslagen). */
export const WITHDRAWAL_DAYS = 14;

/**
 * True when the job starts within the 14-day ångerfrist, so the customer must ask for the work
 * to start early. Same rule as accept_quote: `scheduled_date < today + 14`.
 */
export function withdrawalWaiverRequired(scheduledDate: string | null, todayIso: string): boolean {
  if (!scheduledDate) return false;
  return daysBetween(todayIso, scheduledDate) < WITHDRAWAL_DAYS;
}

/** Which ROT property details Skatteverket needs: "fastighet" (house) or "brf" (bostadsrätt). */
export type PropertyKind = "fastighet" | "brf";

/** Same rule as accept_quote: only for eligible ROT jobs in an owned house or bostadsrätt. */
export function propertyKind(
  quote: Pick<QuoteData, "deductionType" | "housingType" | "eligibility">,
): PropertyKind | null {
  if (quote.deductionType !== "rot" || !quote.eligibility.eligible) return null;
  if (quote.housingType === "villa" || quote.housingType === "fritidshus") return "fastighet";
  if (quote.housingType === "bostadsratt") return "brf";
  return null;
}

/** The tax year that applies: the job date (scheduled, else preferred), else this year. */
export function quoteTaxYear(quote: Pick<QuoteData, "scheduledDate" | "preferredDate">, todayIso: string): number {
  const fallback = Number(todayIso.slice(0, 4));
  return taxYearForDate(quote.scheduledDate ?? quote.preferredDate ?? undefined, fallback);
}

export function quoteRules(
  quote: Pick<QuoteData, "scheduledDate" | "preferredDate">,
  todayIso: string,
  overrides: TaxRuleOverride[] = [],
): ResolvedTaxRules {
  return getTaxRules(quoteTaxYear(quote, todayIso), overrides);
}

/** Default buyers for the price card: `buyerCount` people sharing evenly. */
export function defaultBuyers(buyerCount: number): Buyer[] {
  return evenShares(buyerCount).map((sharePct) => ({ sharePct }));
}

/** The quote's price breakdown via `calculatePrice` (labour/material/travel, deduction, to pay). */
export function quotePrice(
  quote: Pick<
    QuoteData,
    "deductionType" | "labourOre" | "materialOre" | "travelOre" | "eligibility" | "labourShareOfTotal" | "buyerCount"
  >,
  rules: ResolvedTaxRules,
  buyers: Buyer[] = defaultBuyers(quote.buyerCount),
): PriceBreakdown {
  return calculatePrice({
    deductionType: quote.deductionType,
    lines: { labour: quote.labourOre, material: quote.materialOre, travel: quote.travelOre },
    rules,
    eligible: quote.eligibility.eligible,
    buyers,
    labourShareOfTotal: quote.labourShareOfTotal,
  });
}
