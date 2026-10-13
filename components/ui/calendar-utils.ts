/**
 * Date helpers for the Calendar, working on "YYYY-MM-DD" strings. All maths uses UTC so the
 * result never depends on the device's time zone (no off-by-one days around DST or midnight).
 * Pure functions – none of them read the current time.
 */

export interface DateParts {
  year: number;
  /** 1–12 */
  month: number;
  /** 1–31 */
  day: number;
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 86_400_000;

function pad(n: number, width = 2): string {
  return String(n).padStart(width, "0");
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Parses "YYYY-MM-DD"; null for malformed or impossible dates ("2026-02-30"). */
export function parseIsoDate(iso: string | null | undefined): DateParts | null {
  if (!iso) return null;
  const m = ISO_DATE.exec(iso);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) return null;
  return { year, month, day };
}

export function isIsoDate(iso: string | null | undefined): iso is string {
  return parseIsoDate(iso) !== null;
}

export function toIsoDate(year: number, month: number, day: number): string {
  return `${pad(year, 4)}-${pad(month)}-${pad(day)}`;
}

function mustParse(iso: string): DateParts {
  const parts = parseIsoDate(iso);
  if (!parts) throw new RangeError(`Invalid date "${iso}", expected YYYY-MM-DD`);
  return parts;
}

/** Midnight UTC of the given date. */
export function isoToUtcDate(iso: string): Date {
  const { year, month, day } = mustParse(iso);
  return new Date(Date.UTC(year, month - 1, day));
}

export function utcDateToIso(date: Date): string {
  return toIsoDate(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

export function addDays(iso: string, days: number): string {
  return utcDateToIso(new Date(isoToUtcDate(iso).getTime() + days * MS_PER_DAY));
}

/** Adds months, keeping the day where possible (Jan 31 + 1 month → Feb 28/29). */
export function addMonths(iso: string, months: number): string {
  const { year, month, day } = mustParse(iso);
  const index = year * 12 + (month - 1) + months;
  const y = Math.floor(index / 12);
  const m = (index % 12) + 1;
  return toIsoDate(y, m, Math.min(day, daysInMonth(y, m)));
}

export function addYears(iso: string, years: number): string {
  return addMonths(iso, years * 12);
}

/** "2026-10-14" → "2026-10-01". */
export function startOfMonth(iso: string): string {
  const { year, month } = mustParse(iso);
  return toIsoDate(year, month, 1);
}

export function endOfMonth(iso: string): string {
  const { year, month } = mustParse(iso);
  return toIsoDate(year, month, daysInMonth(year, month));
}

/** 0 = Monday … 6 = Sunday (Swedish weeks start on Monday). */
export function weekdayIndex(iso: string): number {
  return (isoToUtcDate(iso).getUTCDay() + 6) % 7;
}

export function startOfWeek(iso: string): string {
  return addDays(iso, -weekdayIndex(iso));
}

export function endOfWeek(iso: string): string {
  return addDays(iso, 6 - weekdayIndex(iso));
}

/** "YYYY-MM" key of the month a date is in. */
export function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

export function isSameMonth(a: string, b: string): boolean {
  return monthKey(a) === monthKey(b);
}

/** ISO dates compare correctly as strings. */
export function compareIso(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function isWithinRange(iso: string, min?: string | null, max?: string | null): boolean {
  if (min && iso < min) return false;
  if (max && iso > max) return false;
  return true;
}

export function clampIso(iso: string, min?: string | null, max?: string | null): string {
  if (min && iso < min) return min;
  if (max && iso > max) return max;
  return iso;
}

/**
 * Weeks of a month, Monday first. Days outside the month are null.
 * `monthMatrix("2026-10-01")` → 5 rows of 7 cells, first row starts with 3 nulls (Oct 1 is a Thursday).
 */
export function monthMatrix(monthIso: string): (string | null)[][] {
  const first = startOfMonth(monthIso);
  const { year, month } = mustParse(first);
  const total = daysInMonth(year, month);
  const leading = weekdayIndex(first);
  const cells: (string | null)[] = Array.from({ length: leading }, () => null);
  for (let day = 1; day <= total; day++) cells.push(toIsoDate(year, month, day));
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

const stockholmParts = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Stockholm",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/**
 * The calendar date in Sweden at the instant `now`, as "YYYY-MM-DD".
 * Call it with `new Date()` in an event handler/effect or after `await connection()` –
 * never during a prerender.
 */
export function stockholmDate(now: Date): string {
  const parts = stockholmParts.formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

// ── Swedish labels (Intl, sv-SE) ───────────────────────────────────────────────────────────

const dayLabelFormat = new Intl.DateTimeFormat("sv-SE", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const monthTitleFormat = new Intl.DateTimeFormat("sv-SE", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const weekdayShortFormat = new Intl.DateTimeFormat("sv-SE", { weekday: "short", timeZone: "UTC" });
const weekdayLongFormat = new Intl.DateTimeFormat("sv-SE", { weekday: "long", timeZone: "UTC" });

function capitalize(text: string): string {
  return text.charAt(0).toLocaleUpperCase("sv-SE") + text.slice(1);
}

/** "2026-10-14" → "onsdag 14 oktober 2026" (used as each day's accessible name). */
export function formatDayLabel(iso: string): string {
  return dayLabelFormat.format(isoToUtcDate(iso));
}

/** "2026-10-01" → "Oktober 2026". */
export function formatMonthTitle(monthIso: string): string {
  return capitalize(monthTitleFormat.format(isoToUtcDate(startOfMonth(monthIso))));
}

/** Monday-first weekday names: [{ short: "mån", long: "måndag" }, …]. */
export const WEEKDAYS: ReadonlyArray<{ short: string; long: string }> = Array.from(
  { length: 7 },
  (_, i) => {
    // 2024-01-01 was a Monday.
    const date = new Date(Date.UTC(2024, 0, 1 + i));
    return { short: weekdayShortFormat.format(date), long: weekdayLongFormat.format(date) };
  },
);
