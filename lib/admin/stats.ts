import type { Tables } from "@/lib/supabase/database.types";
import type { BookingStatus } from "@/lib/admin/filters";

export type StatsBooking = Pick<
  Tables<"bookings">,
  | "created_at"
  | "status"
  | "model"
  | "labour_ore"
  | "material_ore"
  | "travel_ore"
  | "subcontractor_cost_ore"
  | "commission_pct"
  | "paid_amount_ore"
  | "claim_requested_ore"
>;

export interface WeekBucket {
  /** Monday of the ISO week, YYYY-MM-DD. */
  weekStart: string;
  label: string;
  count: number;
}

export interface DashboardStats {
  weeks: WeekBucket[];
  byStatus: Partial<Record<BookingStatus, number>>;
  total: number;
  /** Seller model: paid amounts. */
  sellerRevenueOre: number;
  /** Agent model: labour × commission % on approved and later jobs. */
  agentCommissionOre: number;
  /** Seller model: price − subcontractor cost on approved and later jobs with both set. */
  sellerMarginOre: number;
  requestedDeductionOre: number;
}

const CONFIRMED: BookingStatus[] = ["godkand", "utford", "betald", "rut_rot_begard", "avslutad"];

function mondayOf(date: Date): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - (day - 1));
  return d;
}

function isoWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
}

/** Aggregates bookings for the dashboard. `now` is passed in so the function stays pure. */
export function computeStats(bookings: StatsBooking[], now: Date, weekCount = 12): DashboardStats {
  const thisMonday = mondayOf(now);
  const weeks: WeekBucket[] = [];
  for (let i = weekCount - 1; i >= 0; i--) {
    const d = new Date(thisMonday);
    d.setUTCDate(d.getUTCDate() - i * 7);
    weeks.push({ weekStart: d.toISOString().slice(0, 10), label: `v. ${isoWeek(d)}`, count: 0 });
  }
  const index = new Map(weeks.map((w, i) => [w.weekStart, i]));

  const stats: DashboardStats = {
    weeks,
    byStatus: {},
    total: bookings.length,
    sellerRevenueOre: 0,
    agentCommissionOre: 0,
    sellerMarginOre: 0,
    requestedDeductionOre: 0,
  };

  for (const b of bookings) {
    const key = mondayOf(new Date(b.created_at)).toISOString().slice(0, 10);
    const i = index.get(key);
    if (i !== undefined) weeks[i].count++;
    stats.byStatus[b.status] = (stats.byStatus[b.status] ?? 0) + 1;

    const confirmed = CONFIRMED.includes(b.status);
    if (b.model === "seller") {
      stats.sellerRevenueOre += b.paid_amount_ore ?? 0;
      if (confirmed && b.labour_ore != null && b.subcontractor_cost_ore != null) {
        const price = b.labour_ore + (b.material_ore ?? 0) + (b.travel_ore ?? 0);
        stats.sellerMarginOre += price - b.subcontractor_cost_ore;
      }
    } else if (confirmed && b.labour_ore != null && b.commission_pct != null) {
      stats.agentCommissionOre += Math.round((b.labour_ore * Number(b.commission_pct)) / 100);
    }
    stats.requestedDeductionOre += b.claim_requested_ore ?? 0;
  }
  return stats;
}
