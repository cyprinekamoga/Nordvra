"use client";

import { useActionState } from "react";
import { Card, ChipGroup, Icon, InfoBox, SubmitButton, TextArea, TextField } from "@/components/ui";
import { fmt, t } from "@/lib/i18n";
import type { ReviewFormState } from "@/lib/reviews/actions";
import { REVIEW_BODY_MAX, REVIEW_NAME_MAX } from "@/lib/reviews/reviews";

const f = t.common.reviews.form;
const RATINGS = ["5", "4", "3", "2", "1"] as const;

/** "Hur blev det?": rating, text and display name. Bound to the booking link token. */
export function ReviewForm({
  action,
  serviceName,
  suggestedName,
}: {
  action: (prev: ReviewFormState, formData: FormData) => Promise<ReviewFormState>;
  serviceName: string;
  suggestedName: string;
}) {
  const [state, formAction] = useActionState(action, { status: "idle" });

  if (state.status === "sent") {
    return (
      <Card as="section" aria-labelledby="omdome-tack" className="space-y-2">
        <h2 id="omdome-tack" className="flex items-center gap-3 text-xl font-bold text-ink">
          <Icon name="check-circle" size={28} className="text-success" />
          {f.thanksTitle}
        </h2>
        <p className="text-ink">{f.thanksBody}</p>
      </Card>
    );
  }

  const errors = state.status === "error" ? state.fieldErrors : {};
  return (
    <Card as="section" aria-labelledby="omdome-rubrik" className="space-y-5">
      <div className="space-y-2">
        <h2 id="omdome-rubrik" className="text-xl font-bold text-ink">
          {f.title}
        </h2>
        <p className="text-ink">{fmt(f.lead, { service: serviceName.toLocaleLowerCase("sv-SE") })}</p>
      </div>
      <form action={formAction} className="space-y-5" noValidate>
        {state.status === "error" && state.message ? (
          <div role="alert">
            <InfoBox tone="danger">
              <p>{state.message}</p>
            </InfoBox>
          </div>
        ) : null}
        <ChipGroup<(typeof RATINGS)[number]>
          name="rating"
          legend={f.ratingLegend}
          options={RATINGS.map((value) => ({ value, label: `${"★".repeat(Number(value))} ${fmt(f.ratingOption, { rating: value })}` }))}
          error={errors.rating}
          layout="stack"
          required
        />
        <TextArea label={f.bodyLabel} hint={f.bodyHint} name="body" maxLength={REVIEW_BODY_MAX} rows={5} error={errors.body} />
        <TextField
          label={f.nameLabel}
          hint={f.nameHint}
          name="displayName"
          defaultValue={suggestedName}
          maxLength={REVIEW_NAME_MAX}
          autoComplete="off"
          error={errors.displayName}
        />
        <p className="text-muted">{f.consent}</p>
        <SubmitButton pendingText={f.submitting} icon="arrow-right">
          {f.submit}
        </SubmitButton>
      </form>
    </Card>
  );
}
