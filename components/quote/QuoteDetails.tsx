import { Card } from "@/components/ui";
import { formatDateLong, formatPostcode } from "@/lib/format";
import { fmt, t } from "@/lib/i18n";
import type { QuoteData } from "@/lib/quote/quote";

const d = t.quote.details;

function hoursText(hours: number): string {
  if (hours === 1) return d.hoursOne;
  const shown = new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 1 }).format(hours);
  return fmt(d.hoursMany, { hours: shown });
}

/** "Det här bokar du": service, date, time of day, address, home and estimated hours. */
export function QuoteDetails({
  quote,
  headingId,
  showBookingNumber = false,
  statusLabel,
}: {
  quote: QuoteData;
  headingId: string;
  showBookingNumber?: boolean;
  /** Shown as "Status" when set (approved bookings that moved on, e.g. "Utförd"). */
  statusLabel?: string;
}) {
  const rows: { key: string; label: string; value: string }[] = [];
  if (showBookingNumber) rows.push({ key: "number", label: d.bookingNumber, value: quote.bookingNumber });
  if (statusLabel) rows.push({ key: "status", label: d.status, value: statusLabel });
  rows.push({ key: "service", label: d.service, value: quote.serviceName });
  rows.push({
    key: "date",
    label: d.date,
    value: quote.scheduledDate ? formatDateLong(quote.scheduledDate) : d.dateToBeAgreed,
  });
  if (quote.scheduledTimeWindow) {
    rows.push({ key: "time", label: d.time, value: t.common.timeWindows[quote.scheduledTimeWindow] });
  }
  const place = [formatPostcode(quote.postcode), quote.city].filter(Boolean).join(" ");
  const address = [quote.street, place].filter(Boolean).join(", ");
  if (address) rows.push({ key: "address", label: d.address, value: address });
  const home = [
    quote.housingType ? t.common.housing[quote.housingType] : "",
    quote.sizeBand ? t.common.sizeBands[quote.sizeBand] : "",
  ]
    .filter(Boolean)
    .join(", ");
  if (home) rows.push({ key: "home", label: d.home, value: home });
  if (quote.hours) rows.push({ key: "hours", label: d.hours, value: hoursText(quote.hours) });

  return (
    <Card as="section" aria-labelledby={headingId} className="space-y-3">
      <h2 id={headingId} className="text-xl font-bold text-ink">
        {d.title}
      </h2>
      <dl className="divide-y divide-border">
        {rows.map((row) => (
          <div key={row.key} className="grid gap-1 py-3 first:pt-0 last:pb-0 sm:grid-cols-[12rem_1fr] sm:gap-4">
            <dt className="text-muted">{row.label}</dt>
            <dd className="font-semibold break-words text-ink">{row.value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
