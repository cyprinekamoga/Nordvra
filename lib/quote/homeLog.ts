import { addYears } from "@/components/ui/calendar-utils";
import { toNullableNumber } from "@/lib/catalog/map";
import type { DeductionType } from "@/lib/taxRules";
import { parsePhotos, type QuotePhoto } from "./quote";

/**
 * "Bostadens logg": every approved job at the same home (same email, postcode and street), as
 * returned by the `get_home_log` RPC. Pure parsing and dates, so it is unit-tested.
 */

export interface HomeLogEntry {
  bookingNumber: string;
  serviceName: string;
  deductionType: DeductionType;
  scheduledDate: string | null;
  completedAt: string | null;
  partnerName: string | null;
  partnerOrgNr: string | null;
  /** Labour + material + travel before deduction, öre (null before the quote has a price). */
  totalOre: number | null;
  paidOre: number | null;
  paidAt: string | null;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  deductionApprovedOre: number | null;
  photos: QuotePhoto[];
}

/** Reklamationsrätt under konsumenttjänstlagen: 3 years from when the work was finished. */
export const COMPLAINT_YEARS = 3;

export function complaintUntil(entry: Pick<HomeLogEntry, "completedAt">): string | null {
  return entry.completedAt ? addYears(entry.completedAt, COMPLAINT_YEARS) : null;
}

const ISO = /^\d{4}-\d{2}-\d{2}$/;

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

function date(value: unknown): string | null {
  const s = text(value)?.slice(0, 10) ?? "";
  return ISO.test(s) ? s : null;
}

function ore(value: unknown): number | null {
  const n = toNullableNumber(value);
  return n !== null && n >= 0 ? Math.round(n) : null;
}

export function parseHomeLog(raw: unknown): HomeLogEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item): HomeLogEntry[] => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];
    const r = item as Record<string, unknown>;
    const bookingNumber = text(r.booking_number);
    const deductionType = r.deduction_type === "rot" ? "rot" : r.deduction_type === "rut" ? "rut" : null;
    if (!bookingNumber || !deductionType) return [];
    const labour = ore(r.labour_ore);
    return [
      {
        bookingNumber,
        serviceName: text(r.service_name) ?? "",
        deductionType,
        scheduledDate: date(r.scheduled_date),
        completedAt: date(r.completed_at),
        partnerName: text(r.partner_name),
        partnerOrgNr: text(r.partner_org_nr),
        totalOre: labour === null ? null : labour + (ore(r.material_ore) ?? 0) + (ore(r.travel_ore) ?? 0),
        paidOre: ore(r.paid_amount_ore),
        paidAt: date(r.paid_at),
        invoiceNumber: text(r.invoice_number),
        invoiceDate: date(r.invoice_date),
        deductionApprovedOre: ore(r.claim_approved_ore),
        photos: parsePhotos(r.photos),
      },
    ];
  });
}
