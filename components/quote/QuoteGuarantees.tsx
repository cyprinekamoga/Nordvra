import Link from "next/link";
import { InfoBox } from "@/components/ui";
import { fmt, t } from "@/lib/i18n";
import type { QuoteData } from "@/lib/quote/quote";

const legal = t.common.legal;

/**
 * The guarantees and the booking context next to the legal texts: avdragsgaranti (when there
 * is a deduction), besiktningsgaranti (move-out cleaning), the subscription and "bokat åt".
 */
export function QuoteGuarantees({ quote, withDeduction }: { quote: QuoteData; withDeduction: boolean }) {
  return (
    <div className="space-y-3">
      {quote.residentName ? (
        <InfoBox tone="info" title={fmt(t.quote.relative.title, { name: quote.residentName })} headingLevel={2} icon="users">
          <p>{t.quote.relative.body}</p>
        </InfoBox>
      ) : null}
      {quote.recurring === "season" ? (
        <InfoBox tone="info" title={t.quote.subscription.title} headingLevel={2} icon="calendar">
          <p>{t.quote.subscription.body}</p>
        </InfoBox>
      ) : null}
      {withDeduction ? (
        <InfoBox tone="success" title={legal.deductionGuarantee.title} headingLevel={2} icon="shield">
          <p>{legal.deductionGuarantee.body}</p>
        </InfoBox>
      ) : null}
      {quote.formKind === "flyttstad" ? (
        <InfoBox tone="success" title={legal.inspectionGuarantee.title} headingLevel={2} icon="shield">
          <p>{legal.inspectionGuarantee.body}</p>
          <p>
            <Link href="/flyttstadning-checklista" className="link">
              {legal.inspectionGuarantee.checklistLink}
            </Link>
          </p>
        </InfoBox>
      ) : null}
    </div>
  );
}
