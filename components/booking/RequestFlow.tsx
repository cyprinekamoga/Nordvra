"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { Button, InfoBox, ProgressBar } from "@/components/ui";
import type { RequestDraft } from "@/lib/booking/schema";
import {
  STEP_CATEGORY,
  STEP_CONTACT,
  STEP_SERVICE,
  TOTAL_STEPS,
  deriveRequest,
  nextStep,
  parseStep,
  previousStep,
  resolveStep,
  stepErrors,
  stepHref,
  type Step,
} from "@/lib/booking/state";
import { servicesInCategory, type Catalog } from "@/lib/catalog/types";
import { fmt, t } from "@/lib/i18n";
import { updateDraft, useRequestDraft } from "./draftStore";
import { FlowLoading } from "./FlowLoading";
import { StepCategory } from "./steps/StepCategory";
import { StepContact } from "./steps/StepContact";
import { StepEligibility } from "./steps/StepEligibility";
import { StepHome } from "./steps/StepHome";
import { StepService } from "./steps/StepService";
import { StepSummary } from "./steps/StepSummary";
import { StepWhen } from "./steps/StepWhen";
import { StepWhere } from "./steps/StepWhere";
import { focusFirstError, type StepProps } from "./types";

const steps = t.booking.steps;

const titles: Record<Step, { title: string; lead: string }> = {
  1: steps.category,
  2: steps.service,
  3: steps.home,
  4: steps.when,
  5: steps.where,
  6: steps.eligibility,
  7: steps.summary,
  8: steps.contact,
};

/**
 * The click-only request flow `/boka` (SPEC §4). The step lives in the URL (`?steg=3`, so the
 * browser's back button works) and the answers in sessionStorage. Renders a loading
 * placeholder until the saved answers have been read in the browser. Needs a <Suspense>
 * boundary above it (useSearchParams).
 */
export function RequestFlow({ catalog }: { catalog: Catalog }) {
  const state = useRequestDraft();
  if (!state) return <FlowLoading />;
  return <Flow catalog={catalog} draft={state.draft} today={state.today} />;
}

function Flow({ catalog, draft, today }: { catalog: Catalog; draft: RequestDraft; today: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requested = parseStep(searchParams.get("steg"));
  const step = resolveStep(requested, draft, catalog, today);
  const derived = useMemo(() => deriveRequest(draft, catalog), [draft, catalog]);

  /** The step on which the customer last pressed "Fortsätt" with missing answers. */
  const [attempted, setAttempted] = useState<Step | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const shownStep = useRef(step);

  // A deep link or an old bookmark can point past the first unanswered step: correct the URL.
  useEffect(() => {
    if (step !== requested) router.replace(stepHref(step), { scroll: false });
  }, [step, requested, router]);

  // Move focus to the new step's heading so screen readers start at the top of the step.
  useEffect(() => {
    if (shownStep.current !== step) {
      shownStep.current = step;
      headingRef.current?.focus();
    }
  }, [step]);

  const errors = attempted === step ? stepErrors(step, draft, catalog, today) : {};
  const hasErrors = Object.keys(errors).length > 0;

  function go(target: Step) {
    setAttempted(null);
    router.push(stepHref(target));
  }

  function onContinue(event?: FormEvent) {
    event?.preventDefault();
    const missing = stepErrors(step, draft, catalog, today);
    if (Object.keys(missing).length > 0) {
      flushSync(() => setAttempted(step));
      focusFirstError(contentRef.current);
      return;
    }
    go(nextStep(step, derived));
  }

  const props: StepProps = { catalog, draft, derived, today, errors, update: updateDraft };
  const { title, lead } = titles[step];
  const showContinue =
    step !== STEP_CONTACT &&
    // Tiles move on by themselves; "Fortsätt" only appears once something is chosen.
    (step > STEP_SERVICE || (step === STEP_CATEGORY ? Boolean(derived.category) : Boolean(derived.service)));

  let content: ReactNode;
  switch (step) {
    case 1:
      content = (
        <StepCategory
          {...props}
          onPicked={(categoryId) =>
            go(servicesInCategory(catalog, categoryId).length === 1 ? 3 : STEP_SERVICE)
          }
        />
      );
      break;
    case 2:
      content = <StepService {...props} onPicked={() => go(3)} />;
      break;
    case 3:
      content = <StepHome {...props} />;
      break;
    case 4:
      content = <StepWhen {...props} />;
      break;
    case 5:
      content = <StepWhere {...props} />;
      break;
    case 6:
      content = <StepEligibility {...props} />;
      break;
    case 7:
      content = <StepSummary {...props} onEdit={go} />;
      break;
    case 8:
      content = <StepContact {...props} onEdit={go} />;
      break;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {step > STEP_CATEGORY ? (
          <Button
            variant="ghost"
            icon="arrow-left"
            className="-ml-3 px-3"
            onClick={() => go(previousStep(step, derived))}
          >
            {t.booking.nav.back}
          </Button>
        ) : null}
        <ProgressBar step={step} total={TOTAL_STEPS} />
      </div>

      <header className="space-y-2">
        <h1 ref={headingRef} tabIndex={-1} className="text-3xl leading-tight font-bold text-ink focus:outline-none">
          {title}
        </h1>
        <p className="text-lg text-muted">
          {step === STEP_SERVICE ? fmt(steps.service.lead, { category: derived.category?.name ?? "" }) : lead}
        </p>
      </header>

      {hasErrors ? (
        <div role="alert">
          <InfoBox tone="danger" title={t.booking.errorSummaryTitle} />
        </div>
      ) : null}

      {step === STEP_CONTACT ? (
        <div ref={contentRef}>{content}</div>
      ) : (
        <form noValidate onSubmit={onContinue} className="space-y-8">
          <div ref={contentRef}>{content}</div>
          {showContinue ? (
            <Button type="submit" size="lg" fullWidth iconEnd="arrow-right">
              {t.booking.nav.continue}
            </Button>
          ) : null}
        </form>
      )}
    </div>
  );
}
