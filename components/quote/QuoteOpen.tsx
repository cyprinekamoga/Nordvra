import { Card, Icon } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import { fmt, t } from "@/lib/i18n";
import type { QuoteAction } from "@/lib/quote/form";
import type { PriceBreakdown } from "@/lib/pricing/calculate";
import { propertyKind, type QuoteData } from "@/lib/quote/quote";
import type { ResolvedTaxRules } from "@/lib/taxRules";
import { ApprovalForm } from "./ApprovalForm";
import { QuoteCounterparty } from "./QuoteCounterparty";
import { QuoteDetails } from "./QuoteDetails";
import { QuoteEligibility } from "./QuoteEligibility";
import { QuoteLegal } from "./QuoteLegal";
import { QuotePriceCard } from "./QuotePriceCard";

const h = t.quote.header;

export interface QuoteOpenProps {
  quote: QuoteData;
  breakdown: PriceBreakdown;
  rules: ResolvedTaxRules;
  ratePct: number;
  taxYear: number;
  today: string;
  waiverRequired: boolean;
  acceptAction: QuoteAction;
  declineAction: QuoteAction;
}

/** An open quote: greeting, owner's message, price, eligibility, details, avtalspart, legal, form. */
export function QuoteOpen({
  quote,
  breakdown,
  rules,
  ratePct,
  taxYear,
  today,
  waiverRequired,
  acceptAction,
  declineAction,
}: QuoteOpenProps) {
  const validUntil = quote.quoteExpiresAt ? formatDateTime(quote.quoteExpiresAt) : null;
  const firstName = quote.contactName.split(/\s+/)[0] ?? "";
  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="font-semibold text-muted">{fmt(h.eyebrow, { bookingNumber: quote.bookingNumber })}</p>
        <h1 className="text-3xl leading-tight font-bold text-ink">{h.title}</h1>
        <p className="text-lg text-ink">{firstName ? fmt(h.greeting, { name: firstName }) : h.greetingNoName}</p>
        <p className="text-lg text-ink">{fmt(h.intro, { service: quote.serviceName })}</p>
        {validUntil ? (
          <p className="flex items-start gap-2 font-semibold text-ink">
            <Icon name="clock" className="mt-1 shrink-0 text-brand" />
            <span>{fmt(h.validUntil, { date: validUntil })}</span>
          </p>
        ) : null}
      </header>

      {quote.quoteMessage ? (
        <Card as="section" tone="brand" aria-labelledby="offert-meddelande-rubrik" className="space-y-2">
          <h2 id="offert-meddelande-rubrik" className="text-lg font-bold text-ink">
            {t.quote.message.title}
          </h2>
          <p className="break-words whitespace-pre-line text-ink">{quote.quoteMessage}</p>
        </Card>
      ) : null}

      <QuotePriceCard
        quote={quote}
        breakdown={breakdown}
        ratePct={ratePct}
        headingId="offert-pris-rubrik"
        showBuyersNote={quote.buyerCount > 1}
      />

      <QuoteEligibility quote={quote} />

      <QuoteDetails quote={quote} headingId="offert-detaljer-rubrik" />

      <QuoteCounterparty quote={quote} />

      <QuoteLegal headingId="offert-juridik-rubrik" withDeduction={breakdown.eligible && breakdown.deduction > 0} />

      <ApprovalForm
        acceptAction={acceptAction}
        declineAction={declineAction}
        deductionType={quote.deductionType}
        eligible={quote.eligibility.eligible}
        propertyKind={propertyKind(quote)}
        waiverRequired={waiverRequired}
        defaultBuyerCount={quote.buyerCount}
        defaultName={quote.contactName}
        lines={breakdown.lines}
        rules={rules}
        labourShareOfTotal={quote.labourShareOfTotal}
        taxYear={taxYear}
        today={today}
      />
    </div>
  );
}
