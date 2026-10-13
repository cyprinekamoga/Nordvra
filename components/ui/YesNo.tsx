"use client";

import type { ReactNode } from "react";
import { t } from "@/lib/i18n";
import { ChipGroup, type ChipOption } from "./ChipGroup";

export type YesNoValue = "ja" | "nej";

export interface YesNoProps<T extends string = never> {
  /** Form field name. */
  name: string;
  /** The question, e.g. "Är du minst 18 år i år?". */
  legend: ReactNode;
  /** Help text under the question. */
  hint?: ReactNode;
  /** "ja", "nej", the third option's value, or null/undefined when unanswered. */
  value: YesNoValue | T | null | undefined;
  onChange: (value: YesNoValue | T) => void;
  /** Optional third answer, e.g. `{ value: "vet_inte", label: "Vet inte" }`. */
  third?: { value: T; label: ReactNode };
  /** Override the "Ja"/"Nej" labels. */
  yesLabel?: ReactNode;
  noLabel?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  className?: string;
}

/**
 * Yes/no question as two (or three) large radio buttons. Values are "ja"/"nej" so they are
 * readable in stored answers; convert with `value === "ja"` where a boolean is needed.
 */
export function YesNo<T extends string = never>({
  name,
  legend,
  hint,
  value,
  onChange,
  third,
  yesLabel = t.common.answers.yes,
  noLabel = t.common.answers.no,
  error,
  required,
  className,
}: YesNoProps<T>) {
  const options: ChipOption<YesNoValue | T>[] = [
    { value: "ja", label: yesLabel },
    { value: "nej", label: noLabel },
  ];
  if (third) options.push({ value: third.value, label: third.label });
  return (
    <ChipGroup<YesNoValue | T>
      name={name}
      legend={legend}
      hint={hint}
      error={error}
      required={required}
      layout="grid"
      columns={third ? 3 : 2}
      options={options}
      value={value ?? null}
      onChange={onChange}
      className={className}
    />
  );
}

/** Converts a YesNo answer to a boolean (undefined when unanswered or the third option). */
export function yesNoToBoolean(value: string | null | undefined): boolean | undefined {
  if (value === "ja") return true;
  if (value === "nej") return false;
  return undefined;
}

/** Converts a boolean answer to the YesNo value. */
export function booleanToYesNo(value: boolean | null | undefined): YesNoValue | null {
  if (value === true) return "ja";
  if (value === false) return "nej";
  return null;
}
