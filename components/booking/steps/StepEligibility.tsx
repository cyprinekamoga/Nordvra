"use client";

import { ChipGroup, InfoBox, YesNo, booleanToYesNo, yesNoToBoolean, type ChipOption } from "@/components/ui";
import { eligibilityKeys, type EligibilityKey } from "@/lib/booking/state";
import type { UsedThisYear } from "@/lib/eligibility";
import { t } from "@/lib/i18n";
import type { StepProps } from "../types";

const s = t.booking.steps.eligibility;
const el = t.common.eligibility;

type BooleanKey = Exclude<EligibilityKey, "buyerCount" | "usedThisYear">;
type BuyerCountValue = "1" | "2" | "3";

const buyerOptions: ChipOption<BuyerCountValue>[] = (["1", "2", "3"] as const).map((value) => ({
  value,
  label: t.common.buyerCount[Number(value) as 1 | 2 | 3],
}));

/**
 * Step 6 "Har du rätt till avdraget?": the questions from `eligibilityQuestions()` as yes/no
 * buttons. The result is shown live; an ineligible answer never blocks – the price is then
 * shown without deduction.
 */
export function StepEligibility({ draft, derived, errors, update }: StepProps) {
  const { service, eligibility } = derived;
  if (!service) return null;
  const keys = eligibilityKeys(service, draft.housingType);
  const answers = draft.eligibility;
  const answeredAll = keys.every((key) => answers[key] !== undefined);

  function setAnswer<K extends EligibilityKey>(key: K, value: (typeof answers)[K]) {
    update((d) => ({ ...d, eligibility: { ...d.eligibility, [key]: value } }));
  }

  function booleanQuestion(key: BooleanKey) {
    return (
      <YesNo
        key={key}
        name={key}
        legend={s.questions[key]}
        hint={s.hints[key] ?? undefined}
        value={booleanToYesNo(answers[key])}
        onChange={(value) => setAnswer(key, yesNoToBoolean(value))}
        error={errors[key]}
        required
      />
    );
  }

  return (
    <div className="space-y-8">
      {keys.map((key) => {
        if (key === "buyerCount") {
          return (
            <ChipGroup<BuyerCountValue>
              key={key}
              name={key}
              legend={s.questions.buyerCount}
              hint={s.hints.buyerCount}
              options={buyerOptions}
              value={answers.buyerCount ? (String(answers.buyerCount) as BuyerCountValue) : null}
              onChange={(value) => setAnswer("buyerCount", Number(value) as 1 | 2 | 3)}
              error={errors.buyerCount}
              layout="wrap"
              required
            />
          );
        }
        if (key === "usedThisYear") {
          return (
            <div key={key} className="space-y-3">
              <YesNo<"vet_inte">
                name={key}
                legend={s.questions.usedThisYear}
                value={answers.usedThisYear ?? null}
                onChange={(value) => setAnswer("usedThisYear", value as UsedThisYear)}
                third={{ value: "vet_inte", label: t.common.usedThisYear.vet_inte }}
                error={errors.usedThisYear}
                required
              />
              <p>
                <a href={el.skatteverketUrl} className="link font-semibold" target="_blank" rel="noopener noreferrer">
                  {el.skatteverketLink}
                  <span className="sr-only"> {t.common.external.newTab}</span>
                </a>
              </p>
            </div>
          );
        }
        return booleanQuestion(key);
      })}

      <div aria-live="polite" aria-atomic="true" className="space-y-4">
        {eligibility && eligibility.reasons.length > 0 ? (
          <InfoBox tone="warning" title={el.notEligibleTitle}>
            <ul className="list-disc space-y-2 pl-5">
              {eligibility.reasons.map((reason) => (
                <li key={reason}>{el.reasons[reason]}</li>
              ))}
            </ul>
            <p className="font-semibold">{el.notEligibleBody}</p>
          </InfoBox>
        ) : answeredAll ? (
          <InfoBox tone="success" title={el.eligibleTitle} />
        ) : null}
        {eligibility && eligibility.warnings.length > 0 ? (
          <InfoBox tone="info" title={el.warningsTitle}>
            <ul className="list-disc space-y-2 pl-5">
              {eligibility.warnings.map((warning) => (
                <li key={warning}>{el.warnings[warning]}</li>
              ))}
            </ul>
          </InfoBox>
        ) : null}
      </div>
    </div>
  );
}
