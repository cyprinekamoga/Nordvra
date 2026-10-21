import { Card } from "@/components/ui";
import { formatDateLong, formatKr, formatPostcode } from "@/lib/format";
import { fmt, t } from "@/lib/i18n";
import { complaintUntil, type HomeLogEntry } from "@/lib/quote/homeLog";
import type { QuoteData } from "@/lib/quote/quote";
import { PrintButton } from "./PrintButton";
import { QuotePhotos } from "./QuotePhotos";

const l = t.quote.booking.log;

/**
 * "Bostadens logg": every job booked through Nordvra for this home, with the company, the
 * price, what was paid, the granted deduction, the invoice, the photo report and the last day
 * to complain. Printable, e.g. for a house sale.
 */
export function HomeLog({ quote, entries }: { quote: QuoteData; entries: HomeLogEntry[] }) {
  const address = [quote.street, [formatPostcode(quote.postcode), quote.city].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");
  return (
    <section aria-labelledby="bostadens-logg" className="space-y-4">
      <div className="space-y-2">
        <h2 id="bostadens-logg" className="text-2xl font-bold text-ink">
          {l.title}
        </h2>
        <p className="text-ink">{fmt(l.lead, { address })}</p>
      </div>
      {entries.length === 0 ? <p className="text-muted">{l.empty}</p> : null}
      <ol className="space-y-4">
        {entries.map((entry) => {
          const until = complaintUntil(entry);
          const date = entry.completedAt ?? entry.scheduledDate;
          const rows: { label: string; value: string }[] = [
            { label: l.date, value: date ? formatDateLong(date) : l.dateToBeAgreed },
          ];
          if (entry.partnerName) {
            rows.push({
              label: l.company,
              value: entry.partnerOrgNr ? `${entry.partnerName} (${entry.partnerOrgNr})` : entry.partnerName,
            });
          }
          if (entry.totalOre !== null) rows.push({ label: l.price, value: formatKr(entry.totalOre) });
          if (entry.paidOre !== null) {
            rows.push({
              label: l.paid,
              value: entry.paidAt ? `${formatKr(entry.paidOre)}, ${formatDateLong(entry.paidAt)}` : formatKr(entry.paidOre),
            });
          }
          if (entry.deductionApprovedOre !== null) rows.push({ label: l.deduction, value: formatKr(entry.deductionApprovedOre) });
          if (entry.invoiceNumber) {
            rows.push({
              label: l.invoice,
              value: entry.invoiceDate ? `${entry.invoiceNumber}, ${formatDateLong(entry.invoiceDate)}` : entry.invoiceNumber,
            });
          }
          if (until) rows.push({ label: l.complaintUntil, value: formatDateLong(until) });
          const headingId = `logg-${entry.bookingNumber}`;
          return (
            <li key={entry.bookingNumber}>
              <Card as="article" aria-labelledby={headingId} className="space-y-3 break-inside-avoid">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                  <h3 id={headingId} className="text-lg font-bold text-ink">
                    {entry.serviceName}
                  </h3>
                  <p className="text-muted tabular-nums">
                    {entry.bookingNumber}
                    {entry.bookingNumber === quote.bookingNumber ? ` · ${l.current}` : ""}
                  </p>
                </div>
                <dl className="divide-y divide-border">
                  {rows.map((row) => (
                    <div key={row.label} className="grid gap-1 py-2 sm:grid-cols-[12rem_1fr] sm:gap-4">
                      <dt className="text-muted">{row.label}</dt>
                      <dd className="font-semibold break-words text-ink">{row.value}</dd>
                    </div>
                  ))}
                </dl>
                {entry.bookingNumber !== quote.bookingNumber ? (
                  <QuotePhotos photos={entry.photos} headingId={`${headingId}-foton`} headingLevel={4} />
                ) : null}
              </Card>
            </li>
          );
        })}
      </ol>
      {entries.length > 0 ? <PrintButton>{l.print}</PrintButton> : null}
    </section>
  );
}
