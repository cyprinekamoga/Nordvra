import "server-only";
import type { TypedSupabaseClient } from "@/lib/supabase/anon";
import type { TaxRuleOverride } from "@/lib/taxRules";
import type { ExportBooking } from "@/lib/admin/csv";

export const EXPORT_STATUSES = ["utford", "betald", "rut_rot_begard", "avslutad"] as const;

export interface ExportRange {
  from: string | null;
  to: string | null;
}

/**
 * Completed seller-model jobs (we file the claim). Agent-model (ROT via partner) jobs are excluded
 * because the partner files those. Personnummer stays encrypted here; callers decrypt.
 */
export async function loadExportBookings(supabase: TypedSupabaseClient, range: ExportRange) {
  let q = supabase
    .from("bookings")
    .select(
      "booking_number,deduction_type,skv_work_type,labour_ore,material_ore,travel_ore,hours,invoice_number,invoice_date,paid_amount_ore,paid_at,payment_method,scheduled_date,created_at,eligibility,labour_share_of_total,rot_property,completed_at,partners(name,org_nr),booking_buyers(full_name,pnr_encrypted,pnr_masked,share_pct,position)",
    )
    .eq("model", "seller")
    .in("status", [...EXPORT_STATUSES])
    .order("paid_at", { ascending: true, nullsFirst: false });
  if (range.from) q = q.gte("completed_at", range.from);
  if (range.to) q = q.lte("completed_at", range.to);
  const { data, error } = await q.limit(5000);
  if (error) throw new Error(`export query failed: ${error.code}`);

  const { data: o } = await supabase.from("tax_rule_overrides").select("*");
  const overrides: TaxRuleOverride[] = (o ?? []).map((x) => ({
    year: x.year,
    ...(x.rut_rate != null && { rutRate: Number(x.rut_rate) }),
    ...(x.rot_rate != null && { rotRate: Number(x.rot_rate) }),
    ...(x.rut_cap_ore != null && { rutCapPerPerson: x.rut_cap_ore }),
    ...(x.rot_cap_ore != null && { rotCapPerPerson: x.rot_cap_ore }),
    ...(x.combined_cap_ore != null && { combinedCapPerPerson: x.combined_cap_ore }),
  }));
  return { rows: data ?? [], overrides };
}

type Row = Awaited<ReturnType<typeof loadExportBookings>>["rows"][number];

/** Maps a row to the CSV input, with a function deciding how each buyer's personnummer is shown. */
export function toExportBooking(row: Row, pnr: (b: { pnr_encrypted: string | null; pnr_masked: string }) => string): ExportBooking {
  const partner = Array.isArray(row.partners) ? row.partners[0] : row.partners;
  return {
    ...row,
    partner: partner ? { name: partner.name, org_nr: partner.org_nr } : null,
    buyers: [...(row.booking_buyers ?? [])]
      .sort((a, b) => a.position - b.position)
      .map((b) => ({ full_name: b.full_name, personnummer: pnr(b), share_pct: Number(b.share_pct) })),
  };
}
