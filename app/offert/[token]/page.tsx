import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { QuoteApproved } from "@/components/quote/QuoteApproved";
import { QuoteLoading } from "@/components/quote/QuoteLoading";
import { QuoteOpen } from "@/components/quote/QuoteOpen";
import { QuoteStateMessage } from "@/components/quote/QuoteStateMessage";
import { PhoneCard } from "@/components/layout";
import { Container, stockholmDate } from "@/components/ui";
import { getCatalog } from "@/lib/catalog/load";
import { formatDateTime } from "@/lib/format";
import { t } from "@/lib/i18n";
import { PricingError } from "@/lib/pricing/calculate";
import { acceptQuote, declineQuote, requestRedo } from "@/lib/quote/actions";
import { loadHomeLog, loadQuote } from "@/lib/quote/load";
import { submitReview } from "@/lib/reviews/actions";
import { loadReviewState } from "@/lib/reviews/load";
import {
  quotePrice,
  quoteRules,
  quoteTaxYear,
  quoteView,
  withdrawalWaiverRequired,
} from "@/lib/quote/quote";
import { ratePercent } from "@/lib/taxRules";

/** Reads the quote per request (it changes when the customer answers), so it may block. */
export const instant = false;

export const metadata: Metadata = {
  title: t.quote.meta.title,
  description: t.quote.meta.description,
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

type Params = Promise<{ token: string }>;

async function QuoteContent({ params }: { params: Params }) {
  const { token } = await params;
  await connection();

  const lookup = await loadQuote(token);
  if (lookup.kind === "notFound") return <QuoteStateMessage kind="notFound" />;
  if (lookup.kind === "unavailable") return <QuoteStateMessage kind="unavailable" />;

  const { quote } = lookup;
  const now = new Date();
  const today = stockholmDate(now);
  const view = quoteView(quote, now);

  if (view === "expired") {
    return (
      <QuoteStateMessage
        kind="expired"
        bookingNumber={quote.bookingNumber}
        expiresAt={quote.quoteExpiresAt ? formatDateTime(quote.quoteExpiresAt) : null}
      />
    );
  }
  if (view === "declined" || view === "cancelled" || view === "notReady") {
    return <QuoteStateMessage kind={view} bookingNumber={quote.bookingNumber} />;
  }

  const catalog = await getCatalog();
  const rules = quoteRules(quote, today, catalog.config.taxOverrides);
  const ratePct = ratePercent(rules, quote.deductionType);
  let breakdown;
  try {
    breakdown = quotePrice(quote, rules);
  } catch (error) {
    if (!(error instanceof PricingError)) throw error;
    console.warn("[quote] price could not be calculated");
    return <QuoteStateMessage kind="unavailable" bookingNumber={quote.bookingNumber} />;
  }

  if (view === "approved") {
    const [homeLog, reviewState] = await Promise.all([
      loadHomeLog(lookup.tokenHash),
      loadReviewState(lookup.tokenHash),
    ]);
    return (
      <QuoteApproved
        quote={quote}
        breakdown={breakdown}
        ratePct={ratePct}
        today={today}
        redoAction={requestRedo.bind(null, token)}
        homeLog={homeLog}
        review={
          reviewState?.canReview && !reviewState.reviewed
            ? { action: submitReview.bind(null, token), suggestedName: reviewState.suggestedName }
            : null
        }
      />
    );
  }

  return (
    <QuoteOpen
      quote={quote}
      breakdown={breakdown}
      rules={rules}
      ratePct={ratePct}
      taxYear={quoteTaxYear(quote, today)}
      today={today}
      waiverRequired={withdrawalWaiverRequired(quote.scheduledDate, today)}
      acceptAction={acceptQuote.bind(null, token)}
      declineAction={declineQuote.bind(null, token)}
    />
  );
}

/**
 * `/offert/[token]` – the customer's quote (SPEC §3). Shows the price before and after RUT/ROT,
 * avtalspart and the legal information, and lets the customer approve ("Godkänn och boka",
 * binding) or decline ("Nej tack"). Expired, answered and unknown links get a friendly message
 * with the phone number. Only the SHA-256 hash of the token is sent to the database.
 */
export default function QuotePage({ params }: { params: Params }) {
  return (
    <Container width="narrow" className="space-y-10 py-6 sm:py-10">
      <Suspense fallback={<QuoteLoading />}>
        <QuoteContent params={params} />
      </Suspense>
      <PhoneCard />
    </Container>
  );
}
