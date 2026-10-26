import { Promises } from "@/components/content/Promises";
import { Icon } from "@/components/ui";
import { formatDateLong, formatDateTime } from "@/lib/format";
import { fmt, t } from "@/lib/i18n";
import type { PriceBreakdown } from "@/lib/pricing/calculate";
import type { QuoteAction } from "@/lib/quote/form";
import type { HomeLogEntry } from "@/lib/quote/homeLog";
import { redoState, type QuoteData } from "@/lib/quote/quote";
import { HomeLog } from "./HomeLog";
import { QuoteChecks } from "./QuoteChecks";
import { QuoteCounterparty } from "./QuoteCounterparty";
import { QuoteDetails } from "./QuoteDetails";
import { QuoteGuarantees } from "./QuoteGuarantees";
import { QuotePhotos } from "./QuotePhotos";
import { QuotePriceCard } from "./QuotePriceCard";
import { RedoPanel } from "./RedoPanel";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import type { ReviewFormState } from "@/lib/reviews/actions";

const a = t.quote.states.approved;

/**
 * The booking page after "Godkänn och boka" (and for later statuses: utförd, betald …): the
 * booking, price, company checks, photo report, besiktningsgaranti, our promises and the home log.
 */
export function QuoteApproved({
  quote,
  breakdown,
  ratePct,
  today,
  redoAction,
  homeLog,
  review = null,
}: {
  quote: QuoteData;
  breakdown: PriceBreakdown;
  ratePct: number;
  today: string;
  redoAction: QuoteAction;
  homeLog: HomeLogEntry[];
  /** Set when the job is done and the customer hasn't reviewed it yet. */
  review?: {
    action: (prev: ReviewFormState, formData: FormData) => Promise<ReviewFormState>;
    suggestedName: string;
  } | null;
}) {
  const statusLabel = quote.status === "godkand" ? undefined : t.common.status[quote.status];
  const redo = redoState(quote, today);
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

      {review ? (
        <ReviewForm action={review.action} serviceName={quote.serviceName} suggestedName={review.suggestedName} />
      ) : null}

      <QuotePhotos photos={quote.photos} />

      {redo !== "none" ? (
        <RedoPanel
          state={redo}
          lastDay={quote.redoLastDay ? formatDateLong(quote.redoLastDay) : null}
          requestedAt={quote.redoRequestedAt ? formatDateTime(quote.redoRequestedAt) : null}
          action={redoAction}
        />
      ) : null}

      <QuoteChecks quote={quote} today={today} />

      <QuoteCounterparty quote={quote} />

      <QuoteGuarantees
        quote={{ ...quote, formKind: redo === "none" ? quote.formKind : null }}
        withDeduction={breakdown.eligible && breakdown.deduction > 0}
      />

      <Promises compact />

      <HomeLog quote={quote} entries={homeLog} />
    </div>
  );
}
