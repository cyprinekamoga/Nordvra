"use client";

import { useId } from "react";
import { Button, Card, InfoBox, PriceLine, PriceList } from "@/components/ui";
import { priceView } from "@/lib/booking/price";
import {
  STEP_CATEGORY,
  STEP_ELIGIBILITY,
  STEP_HOME,
  STEP_SERVICE,
  STEP_WHEN,
  STEP_WHERE,
  serviceLabel,
  skipsServiceStep,
  type Step,
} from "@/lib/booking/state";
import { formatDateLong, formatPostcode } from "@/lib/format";
import { fmt, t } from "@/lib/i18n";
import type { StepProps } from "../types";
import { WarningChipList } from "../WarningChipList";

const s = t.booking.steps.summary;
const p = t.common.price;
const legal = t.common.legal;
const el = t.common.eligibility;

/**
 * Step 7: indicative price card (before deduction, deduction, no booking fee, to pay), the
 * reasons when the deduction doesn't apply, warnings, the plain-Swedish legal boxes and a
 * summary of the answers with "Ändra" buttons.
 */
export function StepSummary({ draft, derived, onEdit }: StepProps & { onEdit: (step: Step) => void }) {
  const priceId = useId();
  const legalId = useId();
  const choicesId = useId();
  const view = priceView(derived);
  const { service, eligibility } = derived;
  if (!service || !view) return null;


  const housing = draft.housingType ? t.common.housing[draft.housingType] : "";
  const size = draft.sizeBand && !service.usesSizeBand ? t.common.sizeBands[draft.sizeBand] : "";
  const time = draft.timeWindow ? t.common.timeWindows[draft.timeWindow].toLocaleLowerCase("sv-SE") : "";
  const choices: { key: string; label: string; value: string; step: Step }[] = [
    {
      key: "service",
      label: s.choices.service,
      value: serviceLabel(draft, derived),
      step: skipsServiceStep(derived) ? STEP_CATEGORY : STEP_SERVICE,
    },
    { key: "home", label: s.choices.home, value: [housing, size].filter(Boolean).join(", "), step: STEP_HOME },
    {
      key: "date",
      label: s.choices.date,
      value: [formatDateLong(draft.preferredDate), time, draft.flexible ? s.flexible : ""]
        .filter(Boolean)
        .join(", "),
      step: STEP_WHEN,
    },
    { key: "postcode", label: s.choices.postcode, value: formatPostcode(draft.postcode ?? ""), step: STEP_WHERE },
    {
      key: "deduction",
      label: s.choices.deduction,
      value: view.eligible ? fmt(s.deductionYes, { deduction: view.deductionName }) : s.deductionNo,
      step: STEP_ELIGIBILITY,
    },
  ];

  return (
    <div className="space-y-8">
      <Card as="section" aria-labelledby={priceId} className="space-y-4">
        <div className="space-y-2">
          <h2 id={priceId} className="text-lg font-bold text-muted">
            {serviceLabel(draft, derived)}
          </h2>
          {view.headline ? (
            <p className="text-2xl leading-snug font-bold text-ink tabular-nums">{view.headline}</p>
          ) : (
            <p className="text-xl leading-snug font-bold text-ink">{view.quoteText}</p>
          )}
          {view.headline && !view.eligible ? <p className="font-semibold text-muted">{s.noDeductionNote}</p> : null}
          {view.headline ? <p className="text-ink">{s.exactWithin24h}</p> : null}
        </div>

        <PriceList live>
          {view.lines.map((line) => (
            <PriceLine
              key={line.key}
              label={line.label}
              hint={line.hint}
              value={
                line.isAmount ? <span className="price">{line.value}</span> : line.value
              }
              emphasis={line.emphasis}
              accent={line.accent ?? (line.key === "fee" ? "brand" : undefined)}
            />
          ))}
        </PriceList>

        {view.headline ? (
          <>
            <p className="font-semibold text-ink">{p.preliminary}</p>
            <p className="text-muted">{p.inclVat}</p>
          </>
        ) : null}
      </Card>

      {eligibility && eligibility.reasons.length > 0 ? (
        <InfoBox tone="warning" title={view.headline ? s.ineligibleTitle : el.notEligibleTitle} headingLevel={2}>
          <ul className="list-disc space-y-2 pl-5">
            {eligibility.reasons.map((reason) => (
              <li key={reason}>{el.reasons[reason]}</li>
            ))}
          </ul>
          <p className="font-semibold">{t.booking.steps.eligibility.canStillSend}</p>
        </InfoBox>
      ) : null}

      {eligibility && eligibility.warnings.length > 0 ? (
        <InfoBox tone="info" title={el.warningsTitle} headingLevel={2}>
          <ul className="list-disc space-y-2 pl-5">
            {eligibility.warnings.map((warning) => (
              <li key={warning}>{el.warnings[warning]}</li>
            ))}
          </ul>
        </InfoBox>
      ) : null}

      <WarningChipList ids={service.warningIds} />

      <section aria-labelledby={legalId} className="space-y-3">
        <h2 id={legalId} className="text-xl font-bold text-ink">
          {s.legalHeading}
        </h2>
        <InfoBox tone="legal" title={legal.labourOnly.title} headingLevel={3}>
          <p>{legal.labourOnly.body}</p>
        </InfoBox>
        <InfoBox tone="legal" title={legal.cap.title} headingLevel={3}>
          <p>{legal.cap.body}</p>
        </InfoBox>
        <InfoBox tone="legal" title={legal.notGuaranteed.title} headingLevel={3}>
          <p>{legal.notGuaranteed.body}</p>
        </InfoBox>
        <InfoBox tone="legal" title={legal.payment.title} headingLevel={3}>
          <p>{legal.payment.body}</p>
        </InfoBox>
      </section>

      <section aria-labelledby={choicesId} className="space-y-3">
        <h2 id={choicesId} className="text-xl font-bold text-ink">
          {s.choicesHeading}
        </h2>
        <Card padding="sm">
          <dl>
            {choices.map((choice) => (
              <div key={choice.key} className="border-t border-border py-2 first:border-t-0">
                <dt className="text-base text-muted">{choice.label}</dt>
                <dd className="flex flex-wrap items-center justify-between gap-x-4">
                  <span className="min-w-0 flex-1 font-semibold text-ink">{choice.value || "–"}</span>
                  <Button
                    variant="ghost"
                    aria-label={fmt(s.changeLabel, { what: choice.label.toLocaleLowerCase("sv-SE") })}
                    onClick={() => onEdit(choice.step)}
                  >
                    {s.change}
                  </Button>
                </dd>
              </div>
            ))}
          </dl>
        </Card>
      </section>
    </div>
  );
}
