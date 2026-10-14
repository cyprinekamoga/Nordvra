import { calculatePrice } from "@/lib/pricing/calculate";
import { getTaxRules, taxYearForDate, type TaxRuleOverride } from "@/lib/taxRules";
import type { Tables } from "@/lib/supabase/database.types";

/**
 * RUT/ROT export for completed seller-model jobs (one row per buyer), to help file the claim
 * ("Begäran om utbetalning") with Skatteverket. Pure functions; the route handler decrypts
 * personnummer and passes them in. Amounts are whole kronor (Skatteverket works in kronor).
 */

export type ExportBooking = Pick<
  Tables<"bookings">,
  | "booking_number"
  | "deduction_type"
  | "skv_work_type"
  | "labour_ore"
  | "material_ore"
  | "travel_ore"
  | "hours"
  | "invoice_number"
  | "invoice_date"
  | "paid_amount_ore"
  | "paid_at"
  | "payment_method"
  | "scheduled_date"
  | "created_at"
  | "eligibility"
  | "labour_share_of_total"
  | "rot_property"
> & {
  partner: { name: string; org_nr: string } | null;
  buyers: { full_name: string; personnummer: string; share_pct: number }[];
};

export const CSV_COLUMNS = [
  "Bokningsnummer",
  "Köpare",
  "Personnummer",
  "Andel %",
  "Fakturanummer",
  "Fakturadatum",
  "Arbetskostnad kr",
  "Material kr",
  "Resor kr",
  "Betalt belopp kr",
  "Betaldatum",
  "Betalsätt",
  "Begärt belopp kr",
  "Timmar",
  "Arbetstyp",
  "Avdrag",
  "Fastighetsbeteckning",
  "BRF org.nr",
  "Lägenhetsnummer",
  "Underleverantör",
  "Underleverantör org.nr",
] as const;

const PAYMENT_LABELS: Record<string, string> = { kort: "Kort", swish: "Swish", overforing: "Överföring" };

export function csvEscape(value: string | number | null | undefined): string {
  const s = value == null ? "" : String(value);
  return /[";\r\n]/.test(s) || /^\s|\s$/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const kr = (ore: number | null | undefined) => (ore == null ? "" : String(Math.round(ore / 100)));
const decimal = (n: number | null | undefined) => (n == null ? "" : String(n).replace(".", ","));

function prop(json: unknown, key: string): string {
  if (json && typeof json === "object" && key in json) {
    const v = (json as Record<string, unknown>)[key];
    return typeof v === "string" ? v : "";
  }
  return "";
}

function eligible(json: unknown): boolean {
  if (json && typeof json === "object" && "eligible" in json) {
    return (json as Record<string, unknown>).eligible !== false;
  }
  return true;
}

/** Requested deduction per buyer (whole kronor), using the rules of the payment year. */
export function requestedPerBuyer(b: ExportBooking, overrides: TaxRuleOverride[] = []): number[] {
  if (b.labour_ore == null || b.buyers.length === 0) return b.buyers.map(() => 0);
  const year = taxYearForDate(b.paid_at ?? b.scheduled_date ?? b.created_at.slice(0, 10), new Date().getFullYear());
  try {
    const price = calculatePrice({
      deductionType: b.deduction_type,
      lines: { labour: b.labour_ore, material: b.material_ore ?? 0, travel: b.travel_ore ?? 0 },
      rules: getTaxRules(year, overrides),
      eligible: eligible(b.eligibility),
      buyers: b.buyers.map((x) => ({ sharePct: Number(x.share_pct) })),
      labourShareOfTotal: b.labour_share_of_total == null ? null : Number(b.labour_share_of_total),
    });
    return price.buyers.map((x) => x.deduction);
  } catch {
    return b.buyers.map(() => 0);
  }
}

export function buildRows(bookings: ExportBooking[], overrides: TaxRuleOverride[] = []): string[][] {
  const rows: string[][] = [];
  for (const b of bookings) {
    const requested = requestedPerBuyer(b, overrides);
    b.buyers.forEach((buyer, i) => {
      rows.push([
        b.booking_number,
        buyer.full_name,
        buyer.personnummer,
        decimal(Number(buyer.share_pct)),
        b.invoice_number ?? "",
        b.invoice_date ?? "",
        kr(b.labour_ore),
        kr(b.material_ore),
        kr(b.travel_ore),
        kr(b.paid_amount_ore),
        b.paid_at ?? "",
        b.payment_method ? (PAYMENT_LABELS[b.payment_method] ?? b.payment_method) : "",
        kr(requested[i]),
        decimal(b.hours),
        b.skv_work_type,
        b.deduction_type.toUpperCase(),
        prop(b.rot_property, "fastighetsbeteckning"),
        prop(b.rot_property, "brf_org_nr"),
        prop(b.rot_property, "lagenhetsnummer"),
        b.partner?.name ?? "",
        b.partner?.org_nr ?? "",
      ]);
    });
  }
  return rows;
}

/** UTF-8 with BOM (so Excel opens Swedish characters correctly), ";" separated, CRLF lines. */
export function toCsv(rows: string[][]): string {
  const lines = [CSV_COLUMNS.map(csvEscape).join(";"), ...rows.map((r) => r.map(csvEscape).join(";"))];
  return `﻿${lines.join("\r\n")}\r\n`;
}
