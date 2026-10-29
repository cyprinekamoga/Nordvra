import { Constants, type Enums } from "@/lib/supabase/database.types";

export type BookingStatus = Enums<"booking_status">;
export const BOOKING_STATUSES = Constants.public.Enums.booking_status;

export interface BookingFilters {
  status: BookingStatus | null;
  service: string | null;
  from: string | null;
  to: string | null;
  postcode: string | null;
  page: number;
}

export const PAGE_SIZE = 50;

type Params = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

const isoDate = /^\d{4}-\d{2}-\d{2}$/;

/** Turns the booking list's searchParams into safe, validated filters. */
export function parseBookingFilters(params: Params): BookingFilters {
  const status = first(params.status);
  const service = first(params.tjanst);
  const from = first(params.fran);
  const to = first(params.till);
  const postcode = first(params.postnr)?.replace(/\D/g, "").slice(0, 5);
  const page = Number.parseInt(first(params.sida) ?? "1", 10);
  return {
    status: (BOOKING_STATUSES as readonly string[]).includes(status ?? "") ? (status as BookingStatus) : null,
    service: service && /^[a-z0-9-]+$/.test(service) ? service : null,
    from: from && isoDate.test(from) ? from : null,
    to: to && isoDate.test(to) ? to : null,
    postcode: postcode ? postcode : null,
    page: Number.isFinite(page) && page > 0 ? Math.min(page, 1000) : 1,
  };
}

/** Builds a query string for links, keeping current filters and overriding some. */
export function filtersToQuery(f: BookingFilters, override: Partial<BookingFilters> = {}): string {
  const merged = { ...f, ...override };
  const q = new URLSearchParams();
  if (merged.status) q.set("status", merged.status);
  if (merged.service) q.set("tjanst", merged.service);
  if (merged.from) q.set("fran", merged.from);
  if (merged.to) q.set("till", merged.to);
  if (merged.postcode) q.set("postnr", merged.postcode);
  if (merged.page > 1) q.set("sida", String(merged.page));
  const s = q.toString();
  return s ? `?${s}` : "";
}

/** Statuses where nothing was agreed with the customer, so the request may be deleted. */
export const DELETABLE_STATUSES = [
  "ny_forfragan",
  "soker_utforare",
  "offert_skickad",
  "nekad",
  "avbokad",
  "offert_utgangen",
] as const;
