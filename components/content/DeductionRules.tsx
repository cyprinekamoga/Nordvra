import { InfoBox } from "@/components/ui";
import { formatKr } from "@/lib/format";
import { fmt, t } from "@/lib/i18n";
import { CURRENT_RULES, ratePercent, type TaxYearRules } from "@/lib/taxRules";

const r = t.common.rulesBox;

/**
 * "Reglerna för 2026": the deduction rules in plain Swedish, built from `lib/taxRules.ts` so the
 * numbers follow the yearly update. Shown in step 6 of the request flow and on
 * /sa-fungerar-rut-och-rot.
 */
export function DeductionRules({
  rules = CURRENT_RULES,
  headingLevel = 2,
}: {
  rules?: TaxYearRules;
  headingLevel?: 2 | 3;
}) {
  const items = [
    fmt(r.rates, { rutRate: ratePercent(rules, "rut"), rotRate: ratePercent(rules, "rot") }),
    ...(rules.year === 2026 && rules.rotRate === 0.3 ? [r.rotBack2026] : []),
    fmt(r.cap, { combined: formatKr(rules.combinedCapPerPerson), rot: formatKr(rules.rotCapPerPerson) }),
    r.paymentYear,
    r.payYourself,
    r.share,
  ];
  return (
    <InfoBox tone="legal" title={fmt(r.title, { year: rules.year })} headingLevel={headingLevel} icon="scale">
      <ul className="list-disc space-y-2 pl-5">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
        <li>
          <a href={t.common.eligibility.skatteverketUrl} className="link font-semibold" target="_blank" rel="noopener noreferrer">
            {t.common.eligibility.skatteverketLink}
          </a>
        </li>
      </ul>
    </InfoBox>
  );
}
