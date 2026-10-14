import { Card, PriceLine, PriceList } from "@/components/ui";
import { formatKr } from "@/lib/format";
import { fmt, t } from "@/lib/i18n";
import type { PriceBreakdown } from "@/lib/pricing/calculate";
import { deductionLabel, deductionName } from "@/lib/quote/labels";
import type { QuoteData } from "@/lib/quote/quote";

const p = t.quote.price;

/**
 * The quote's price: labour / material / travel, the RUT or ROT deduction as a negative line,
 * "Ingen bokningsavgift" and "Att betala" (all from `calculatePrice`). Without a deduction
 * (not eligible) the deduction line is left out and the full price is shown.
 */
export function QuotePriceCard({
  quote,
  breakdown,
  ratePct,
  headingId,
  showBuyersNote = false,
}: {
  quote: QuoteData;
  breakdown: PriceBreakdown;
  ratePct: number;
  headingId: string;
  /** Explain that the deduction assumes `buyerCount` buyers sharing evenly. */
  showBuyersNote?: boolean;
}) {
  const type = quote.deductionType;
  const hasDeduction = breakdown.eligible && breakdown.deduction > 0;
  const name = deductionName(type);
  const headline = hasDeduction
    ? fmt(p.headlineAfter, { amount: formatKr(breakdown.toPay), deduction: name })
    : fmt(p.headlineNoDeduction, { amount: formatKr(breakdown.toPay) });

  const deductionHints = [
    quote.labourShareOfTotal != null
      ? fmt(p.shareOfTotalHint, { pct: Math.round(quote.labourShareOfTotal * 100) })
      : null,
    breakdown.capped ? p.cappedHint : p.deductionHint,
  ].filter(Boolean);

  return (
    <Card as="section" aria-labelledby={headingId} className="space-y-4">
      <div className="space-y-1">
        <h2 id={headingId} className="text-lg font-bold text-muted">
          {p.title} · {quote.serviceName}
        </h2>
        <p className="text-2xl leading-snug font-bold text-ink">{headline}</p>
      </div>

      <PriceList>
        <PriceLine label={p.labour} ore={breakdown.lines.labour} />
        {breakdown.lines.material > 0 ? <PriceLine label={p.material} ore={breakdown.lines.material} /> : null}
        {breakdown.lines.travel > 0 ? <PriceLine label={p.travel} ore={breakdown.lines.travel} /> : null}
        {hasDeduction ? (
          <>
            <PriceLine label={p.total} ore={breakdown.total} emphasis="strong" />
            <PriceLine
              label={deductionLabel(type, ratePct)}
              hint={deductionHints.join(" ")}
              ore={breakdown.deduction}
              negative
              accent={type}
            />
          </>
        ) : null}
        <PriceLine label={p.noBookingFee} value={p.zero} accent="brand" />
        <PriceLine label={p.toPay} ore={breakdown.toPay} emphasis="total" />
      </PriceList>

      <p className="text-muted">{p.inclVat}</p>
      {hasDeduction && showBuyersNote ? (
        <p className="text-muted">{fmt(p.buyersNote, { count: quote.buyerCount })}</p>
      ) : null}
    </Card>
  );
}
