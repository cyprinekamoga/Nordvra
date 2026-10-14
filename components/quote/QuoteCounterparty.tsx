import { InfoBox } from "@/components/ui";
import { t } from "@/lib/i18n";
import { counterpartyText } from "@/lib/quote/labels";
import type { QuoteData } from "@/lib/quote/quote";

/** "Avtalspart och reklamation" (SPEC §2, §5.8). */
export function QuoteCounterparty({ quote }: { quote: QuoteData }) {
  const text = counterpartyText(quote);
  return (
    <InfoBox tone="legal" title={t.common.legal.counterparty.title} headingLevel={2} icon="file">
      <p className="font-bold">{text.headline}</p>
      {text.lines.map((line) => (
        <p key={line}>{line}</p>
      ))}
    </InfoBox>
  );
}
