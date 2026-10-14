import { InfoBox } from "@/components/ui";
import { company } from "@/lib/company";
import { fmt, t } from "@/lib/i18n";
import { deductionName } from "@/lib/quote/labels";
import type { QuoteData } from "@/lib/quote/quote";

const el = t.common.eligibility;
const q = t.quote.eligibility;
const [callBefore, callAfter = ""] = q.callIfWrong.split("{phone}");

/**
 * The stored eligibility result from the request: why the price has no deduction (never
 * blocks booking) and "Bra att veta" warnings (e.g. the yearly cap may already be used).
 */
export function QuoteEligibility({ quote }: { quote: QuoteData }) {
  const { eligible, reasons, warnings } = quote.eligibility;
  return (
    <>
      {!eligible ? (
        <InfoBox tone="warning" title={q.notEligibleTitle} headingLevel={2}>
          <p>{fmt(q.notEligibleIntro, { deduction: deductionName(quote.deductionType) })}</p>
          {reasons.length > 0 ? (
            <ul className="list-disc space-y-2 pl-5">
              {reasons.map((reason) => (
                <li key={reason}>{el.reasons[reason]}</li>
              ))}
            </ul>
          ) : null}
          <p className="font-semibold">
            {callBefore}
            <a href={company.phoneHref} className="link whitespace-nowrap">
              {company.phoneDisplay}
            </a>
            {callAfter}
          </p>
        </InfoBox>
      ) : null}
      {eligible && warnings.length > 0 ? (
        <InfoBox tone="info" title={el.warningsTitle} headingLevel={2}>
          <ul className="list-disc space-y-2 pl-5">
            {warnings.map((warning) => (
              <li key={warning}>{el.warnings[warning]}</li>
            ))}
          </ul>
          {warnings.some((w) => w === "usedThisYear" || w === "checkRemaining") ? (
            <p>
              <a href={el.skatteverketUrl} target="_blank" rel="noopener noreferrer" className="link font-semibold">
                {el.skatteverketLink}
                <span className="sr-only"> {t.common.external.newTab}</span>
              </a>
            </p>
          ) : null}
        </InfoBox>
      ) : null}
    </>
  );
}
