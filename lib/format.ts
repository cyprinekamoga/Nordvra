const kr = new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 0 });

/** 420000 öre → "4 200 kr" (regular spaces so screen readers and copy/paste behave). */
export function formatKr(ore: number): string {
  return `${kr.format(Math.round(ore / 100)).replace(/\s/g, " ")} kr`;
}

export function formatNumber(n: number): string {
  return kr.format(n).replace(/\s/g, " ");
}

/** [380000, 480000] → "3 800–4 800 kr"; equal ends collapse to one amount. */
export function formatKrRange([min, max]: [number, number]): string {
  if (Math.round(min / 100) === Math.round(max / 100)) return formatKr(min);
  return `${formatNumber(Math.round(min / 100))}–${formatKr(max)}`;
}

/** Kronor typed by an admin ("4 200", "4200,50") → öre. Returns null when not a number. */
export function parseKrToOre(input: string | null | undefined): number | null {
  if (input == null) return null;
  const cleaned = String(input).replace(/\s/g, "").replace(",", ".");
  if (cleaned === "") return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

const longDate = new Intl.DateTimeFormat("sv-SE", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Stockholm",
});
const shortDate = new Intl.DateTimeFormat("sv-SE", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Europe/Stockholm",
});
const dateTime = new Intl.DateTimeFormat("sv-SE", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Stockholm",
});

/** "2026-10-14" → "onsdag 14 oktober 2026". */
export function formatDateLong(isoDate: string | null | undefined): string {
  if (!isoDate) return "";
  return longDate.format(new Date(`${isoDate.slice(0, 10)}T12:00:00Z`));
}

export function formatDateShort(isoDate: string | null | undefined): string {
  if (!isoDate) return "";
  return shortDate.format(new Date(isoDate.length <= 10 ? `${isoDate}T12:00:00Z` : isoDate));
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "";
  return dateTime.format(new Date(iso));
}

/** "63220" → "632 20". */
export function formatPostcode(digits: string): string {
  const d = digits.replace(/\D/g, "");
  return d.length === 5 ? `${d.slice(0, 3)} ${d.slice(3)}` : d;
}
