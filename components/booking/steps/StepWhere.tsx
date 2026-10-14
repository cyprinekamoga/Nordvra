"use client";

import { TextField } from "@/components/ui";
import { formatPostcode } from "@/lib/format";
import { t } from "@/lib/i18n";
import type { StepProps } from "../types";

const s = t.booking.steps.where;

/** Digits only, at most five. */
export function postcodeDigits(value: string): string {
  return value.replace(/\D/g, "").slice(0, 5);
}

/** Step 5 "Var?": postcode only (shown as "632 20"). No coverage check – all of Sweden. */
export function StepWhere({ draft, errors, update }: StepProps) {
  return (
    <TextField
      label={s.postcodeLabel}
      hint={s.postcodeHint}
      name="postcode"
      inputMode="numeric"
      autoComplete="postal-code"
      enterKeyHint="next"
      maxLength={6}
      value={formatPostcode(draft.postcode ?? "")}
      onChange={(event) => {
        const digits = postcodeDigits(event.currentTarget.value);
        update((d) => ({ ...d, postcode: digits }));
      }}
      error={errors.postcode}
      inputClassName="max-w-48 text-xl tracking-wide"
    />
  );
}
