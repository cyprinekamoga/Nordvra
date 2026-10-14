import type { RequestDraft } from "@/lib/booking/schema";
import type { DerivedRequest, StepErrors } from "@/lib/booking/state";
import type { Catalog } from "@/lib/catalog/types";

/** Props every step component receives from `RequestFlow`. */
export interface StepProps {
  catalog: Catalog;
  draft: RequestDraft;
  derived: DerivedRequest;
  /** Today's date in Swedish time, "YYYY-MM-DD". */
  today: string;
  /** Errors to show (only after the customer tried to continue). */
  errors: StepErrors;
  update: (fn: (draft: RequestDraft) => RequestDraft) => void;
}

/**
 * Moves focus to the first invalid control inside `root`: an element with aria-invalid, or the
 * first input inside an invalid fieldset/radiogroup. Falls back to the first focusable control.
 */
export function focusFirstError(root: HTMLElement | null) {
  if (!root) return;
  const invalid = root.querySelector<HTMLElement>('[aria-invalid="true"], [data-invalid="true"]');
  const focusable = "input:not([disabled]):not([type=hidden]), textarea, select, button:not([disabled])";
  const scope = invalid ?? root;
  const target = scope.matches(focusable)
    ? scope
    : // A calendar: the day that is in the tab order (roving tabindex).
      (scope.querySelector<HTMLElement>('[role="grid"] [tabindex="0"]') ??
      scope.querySelector<HTMLElement>(focusable));
  target?.focus();
}
