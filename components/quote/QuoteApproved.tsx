import { Icon } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import { fmt, t } from "@/lib/i18n";
import type { PriceBreakdown } from "@/lib/pricing/calculate";
import type { QuoteData } from "@/lib/quote/quote";
import { QuoteCounterparty } from "./QuoteCounterparty";
import { QuoteDetails } from "./QuoteDetails";
import { QuotePriceCard } from "./QuotePriceCard";

const a = t.quote.states.approved;

/** Confirmation after "Godkänn och boka" (and for later statuses: utförd, betald …). */
export function QuoteApproved({
  quote,
  breakdown,
  ratePct,
}: {
  quote: QuoteData;
  breakdown: PriceBreakdown;
  ratePct: number;
}) {
  const statusLabel = quote.status === "godkand" ? undefined : t.common.status[quote.status];
  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <span className="flex size-14 items-center justify-center rounded-full bg-success-soft text-success">
          <Icon name="check-circle" size={32} />
        </span>
        <p className="font-semibold text-muted">{fmt(t.quote.header.eyebrow, { bookingNumber: quote.bookingNumber })}</p>
        <h1 className="text-3xl leading-tight font-bold text-ink">{a.title}</h1>
        <p className="text-lg text-ink">{a.body}</p>
        {quote.approvedAt ? (
          <p className="text-muted">{fmt(a.approvedAt, { date: formatDateTime(quote.approvedAt) })}</p>
        ) : null}
      </header>

      <QuoteDetails
        quote={quote}
        headingId="offert-bokning-rubrik"
        showBookingNumber
        statusLabel={statusLabel}
      />

      <QuotePriceCard quote={quote} breakdown={breakdown} ratePct={ratePct} headingId="offert-pris-rubrik" />

      <QuoteCounterparty quote={quote} />
    </div>
  );
}
