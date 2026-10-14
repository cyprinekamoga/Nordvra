"use client";

import { startTransition, useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import { Button, ChipGroup, InfoBox, SubmitButton, TextArea } from "@/components/ui";
import { t } from "@/lib/i18n";
import {
  DECLINE_FIELD,
  DECLINE_OTHER_MAX,
  DECLINE_REASONS,
  IDLE_STATE,
  type DeclineReason,
  type QuoteAction,
} from "@/lib/quote/form";

const d = t.quote.decline;

const OPTIONS = DECLINE_REASONS.map((value) => ({ value, label: d.reasons[value] }));

export const DECLINE_PANEL_ID = "offert-nej-tack";

/**
 * Inline confirmation for "Nej tack": optional reason chips (+ free text with "Annat"),
 * "Ja, tacka nej" and "Nej, gå tillbaka". Focus moves to the heading when it opens.
 */
export function DeclinePanel({ action, onCancel }: { action: QuoteAction; onCancel: () => void }) {
  const [state, formAction] = useActionState(action, IDLE_STATE);
  const [reasons, setReasons] = useState<DeclineReason[]>([]);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  useEffect(() => {
    if (state.status === "error") errorRef.current?.focus();
  }, [state]);

  /** Runs the action in a transition so React doesn't reset the (controlled) chips afterwards. */
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  }

  return (
    <section
      id={DECLINE_PANEL_ID}
      aria-labelledby="offert-nej-tack-rubrik"
      className="space-y-5 rounded-card border-2 border-control bg-surface-muted p-4 sm:p-6"
    >
      <div className="space-y-2">
        <h3
          id="offert-nej-tack-rubrik"
          ref={headingRef}
          tabIndex={-1}
          className="text-xl font-bold text-ink"
        >
          {d.title}
        </h3>
        <p className="text-ink">{d.body}</p>
      </div>
      <form action={formAction} onSubmit={handleSubmit} className="space-y-5">
        <ChipGroup<DeclineReason>
          multiple
          name={DECLINE_FIELD.reason}
          legend={d.reasonsLegend}
          hint={d.reasonsHint}
          legendStyle="label"
          options={OPTIONS}
          value={reasons}
          onChange={setReasons}
        />
        {reasons.includes("other") ? (
          <TextArea
            name={DECLINE_FIELD.other}
            label={d.otherLabel}
            hint={d.otherHint}
            optional
            rows={3}
            maxLength={DECLINE_OTHER_MAX}
          />
        ) : null}
        {state.status === "error" ? (
          <div ref={errorRef} tabIndex={-1} className="rounded-card">
            <InfoBox tone="danger">
              <p>{state.message}</p>
            </InfoBox>
          </div>
        ) : null}
        <div className="flex flex-col gap-3 sm:flex-row">
          <SubmitButton variant="secondary" pendingText={d.confirming} className="w-full sm:w-auto">
            {d.confirm}
          </SubmitButton>
          <Button variant="ghost" onClick={onCancel} className="w-full sm:w-auto">
            {d.cancel}
          </Button>
        </div>
      </form>
    </section>
  );
}
