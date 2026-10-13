"use client";

import { useId, useState, type KeyboardEvent, type ReactNode } from "react";
import { fmt, t } from "@/lib/i18n";
import { cx } from "./cx";
import { FieldError } from "./FieldError";
import { Icon } from "./Icon";

export interface StepperProps {
  /** Visible label, e.g. "Antal fönster". Also used in the −/+ button names. */
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Form field name for the number input (for `<form action>` submissions). */
  name?: string;
  /** Help text under the label. */
  hint?: ReactNode;
  error?: ReactNode;
  /** Unit after the number, e.g. "st" or "våningar". */
  unit?: string;
  /** Override the button names (default "Minska antal fönster" / "Öka antal fönster"). */
  decreaseLabel?: string;
  increaseLabel?: string;
  className?: string;
}

function lowerFirst(text: string): string {
  return text.charAt(0).toLocaleLowerCase("sv-SE") + text.slice(1);
}

/**
 * Number picker with large −/+ buttons. The number can also be typed (optional); changes are
 * announced politely to screen readers. Buttons use `aria-disabled` at the limits so focus stays.
 */
export function Stepper({
  label,
  value,
  onChange,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  step = 1,
  name,
  hint,
  error,
  unit,
  decreaseLabel,
  increaseLabel,
  className,
}: StepperProps) {
  const id = useId();
  const labelId = `${id}-label`;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  /** Text being typed; null while not editing. */
  const [draft, setDraft] = useState<string | null>(null);

  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  const atMin = value <= min;
  const atMax = value >= max;
  const lower = lowerFirst(label);

  function set(next: number) {
    const clamped = clamp(next);
    if (clamped !== value) onChange(clamped);
  }

  function commitDraft() {
    if (draft === null) return;
    const parsed = Number.parseInt(draft.replace(/\D/g, ""), 10);
    if (Number.isFinite(parsed)) set(parsed);
    setDraft(null);
  }

  function onInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setDraft(null);
      set(value + step);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setDraft(null);
      set(value - step);
    } else if (event.key === "Enter") {
      event.preventDefault();
      commitDraft();
    }
  }

  const buttonClass =
    "flex size-12 shrink-0 items-center justify-center rounded-full border-2 border-brand bg-surface text-brand transition-colors duration-150 hover:bg-brand-soft " +
    "aria-disabled:border-disabled aria-disabled:text-disabled aria-disabled:hover:bg-surface";

  return (
    <div className={cx("min-w-0", className)} role="group" aria-labelledby={labelId}>
      <label id={labelId} htmlFor={`${id}-input`} className="mb-1 block font-bold text-ink">
        {label}
      </label>
      {hint ? (
        <p id={hintId} className="mb-2 text-muted">
          {hint}
        </p>
      ) : null}
      {error && errorId ? (
        <FieldError id={errorId} className="mb-2">
          {error}
        </FieldError>
      ) : null}
      <div className="flex items-center gap-3">
        <button
          type="button"
          className={buttonClass}
          aria-label={decreaseLabel ?? fmt(t.common.stepper.decrease, { label: lower })}
          aria-disabled={atMin || undefined}
          onClick={() => {
            if (!atMin) set(value - step);
          }}
        >
          <Icon name="minus" size={24} />
        </button>
        <input
          id={`${id}-input`}
          name={name}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          className="h-12 w-20 rounded-control border-2 border-control bg-surface text-center text-xl font-bold text-ink tabular-nums"
          value={draft ?? String(value)}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          onChange={(e) => setDraft(e.currentTarget.value)}
          onBlur={commitDraft}
          onKeyDown={onInputKeyDown}
        />
        <button
          type="button"
          className={buttonClass}
          aria-label={increaseLabel ?? fmt(t.common.stepper.increase, { label: lower })}
          aria-disabled={atMax || undefined}
          onClick={() => {
            if (!atMax) set(value + step);
          }}
        >
          <Icon name="plus" size={24} />
        </button>
        {unit ? <span className="text-muted">{unit}</span> : null}
      </div>
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {fmt(t.common.stepper.announce, { label, value: unit ? `${value} ${unit}` : value })}
      </span>
    </div>
  );
}
