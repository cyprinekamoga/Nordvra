import { InfoBox } from "@/components/ui";
import { t } from "@/lib/i18n";

const legal = t.common.legal;

/**
 * Plain-Swedish legal boxes shown before the approval form (SPEC §5, texts verbatim from
 * `t.common.legal`). "Avdraget är inte garanterat" and "Personnummer" sit in the form next to
 * their checkbox and fields. The deduction boxes are left out when the price has no deduction.
 */
export function QuoteLegal({ headingId, withDeduction }: { headingId: string; withDeduction: boolean }) {
  return (
    <section aria-labelledby={headingId} className="space-y-3">
      <h2 id={headingId} className="text-xl font-bold text-ink">
        {t.quote.legal.title}
      </h2>
      {withDeduction ? (
        <>
          <InfoBox tone="legal" title={legal.labourOnly.title} headingLevel={3}>
            <p>{legal.labourOnly.body}</p>
          </InfoBox>
          <InfoBox tone="legal" title={legal.cap.title} headingLevel={3}>
            <p>{legal.cap.body}</p>
          </InfoBox>
        </>
      ) : null}
      <InfoBox tone="legal" title={legal.payment.title} headingLevel={3}>
        <p>{legal.payment.body}</p>
      </InfoBox>
      <InfoBox tone="legal" title={legal.withdrawal.title} headingLevel={3}>
        <p>{legal.withdrawal.body}</p>
      </InfoBox>
    </section>
  );
}
