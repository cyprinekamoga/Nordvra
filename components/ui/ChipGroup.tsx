"use client";

import { useId, type ReactNode } from "react";
import { cx } from "./cx";
import { FieldError } from "./FieldError";
import { Icon } from "./Icon";

export interface ChipOption<V extends string = string> {
  value: V;
  label: ReactNode;
  /** Small text under the label, e.g. "Ingår" or "Bara RUT". Read as the option's description. */
  hint?: ReactNode;
  disabled?: boolean;
}

interface ChipGroupBaseProps<V extends string> {
  /** Form field name (also used to group the native radios/checkboxes). */
  name: string;
  /** Question or group label, rendered as the fieldset `<legend>`. */
  legend: ReactNode;
  options: readonly ChipOption<V>[];
  /** Help text under the legend. */
  hint?: ReactNode;
  /** Error message; marks the group invalid. */
  error?: ReactNode;
  /** Visually hide the legend (still read by screen readers). */
  hideLegend?: boolean;
  /** Legend styling: "question" = large bold (default), "label" = regular field label size. */
  legendStyle?: "question" | "label";
  /**
   * wrap = chips flow and wrap (default); grid = equal-width columns (see `columns`);
   * stack = one per row.
   */
  layout?: "wrap" | "grid" | "stack";
  /** Columns for `layout="grid"`: 2 = always two, 3 = always three, "auto" = 2 on mobile, 3 from sm. */
  columns?: 2 | 3 | "auto";
  /** Mark the first radio `required` for native form validation. */
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export interface SingleChipGroupProps<V extends string> extends ChipGroupBaseProps<V> {
  multiple?: false;
  /** Controlled value (`null` = nothing chosen). Omit to use `defaultValue` (uncontrolled). */
  value?: V | null;
  defaultValue?: V;
  onChange?: (value: V) => void;
}

export interface MultiChipGroupProps<V extends string> extends ChipGroupBaseProps<V> {
  multiple: true;
  /** Controlled list of chosen values. Omit to use `defaultValue` (uncontrolled). */
  value?: readonly V[];
  defaultValue?: readonly V[];
  onChange?: (value: V[]) => void;
}

export type ChipGroupProps<V extends string = string> = SingleChipGroupProps<V> | MultiChipGroupProps<V>;

const layoutClasses = {
  wrap: "flex flex-wrap gap-3",
  grid: "grid gap-3",
  stack: "grid grid-cols-1 gap-3",
} as const;

const columnClasses = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  auto: "grid-cols-2 sm:grid-cols-3",
} as const;

/**
 * Native radio buttons (single) or checkboxes (`multiple`) styled as chips, inside a
 * `<fieldset>` with a `<legend>`. Arrow keys move between radios, Space toggles checkboxes.
 */
export function ChipGroup<V extends string = string>(props: ChipGroupProps<V>) {
  const {
    name,
    legend,
    options,
    hint,
    error,
    hideLegend = false,
    legendStyle = "question",
    layout = "wrap",
    columns = "auto",
    required = false,
    disabled = false,
    className,
  } = props;
  const baseId = useId();
  const hintId = hint ? `${baseId}-hint` : undefined;
  const errorId = error ? `${baseId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  const type = props.multiple ? "checkbox" : "radio";

  function isChecked(value: V): boolean | undefined {
    if (props.multiple) {
      return props.value === undefined ? undefined : props.value.includes(value);
    }
    return props.value === undefined ? undefined : props.value === value;
  }

  function isDefaultChecked(value: V): boolean | undefined {
    if (props.value !== undefined) return undefined;
    if (props.multiple) return props.defaultValue?.includes(value) ?? false;
    return props.defaultValue === value;
  }

  function handleChange(value: V, checked: boolean) {
    if (props.multiple) {
      const current = props.value ?? [];
      const next = checked
        ? [...current.filter((v) => v !== value), value]
        : current.filter((v) => v !== value);
      // Keep the order of `options` so the stored value is stable.
      const order = options.map((o) => o.value);
      props.onChange?.(next.sort((a, b) => order.indexOf(a) - order.indexOf(b)));
    } else if (checked) {
      props.onChange?.(value);
    }
  }

  return (
    <fieldset
      className={cx("min-w-0", className)}
      role={props.multiple ? undefined : "radiogroup"}
      aria-describedby={describedBy}
      aria-invalid={error && !props.multiple ? true : undefined}
      aria-required={required && !props.multiple ? true : undefined}
      disabled={disabled}
    >
      <legend
        className={cx(
          hideLegend
            ? "sr-only"
            : legendStyle === "question"
              ? "mb-2 text-xl font-bold text-ink"
              : "mb-2 font-bold text-ink",
        )}
      >
        {legend}
      </legend>
      {hint ? (
        <p id={hintId} className="mb-3 text-muted">
          {hint}
        </p>
      ) : null}
      {error && errorId ? (
        <FieldError id={errorId} className="mb-3">
          {error}
        </FieldError>
      ) : null}
      <div className={cx(layoutClasses[layout], layout === "grid" && columnClasses[columns])}>
        {options.map((option, index) => {
          const optionHintId = option.hint ? `${baseId}-opt-${index}-hint` : undefined;
          return (
            <label
              key={option.value}
              className={cx(
                "focus-ring-within relative inline-flex min-h-12 items-center gap-2 rounded-control border-2 px-4 py-2 font-semibold transition-colors duration-150",
                "border-control bg-surface text-ink hover:border-brand hover:bg-brand-soft",
                "has-[:checked]:border-brand has-[:checked]:bg-brand has-[:checked]:text-on-brand",
                "has-[:disabled]:cursor-not-allowed has-[:disabled]:border-border has-[:disabled]:bg-surface-muted has-[:disabled]:text-disabled has-[:disabled]:hover:bg-surface-muted",
                layout !== "wrap" && "w-full",
              )}
            >
              <input
                type={type}
                name={name}
                value={option.value}
                className="peer sr-only"
                checked={isChecked(option.value)}
                defaultChecked={isDefaultChecked(option.value)}
                disabled={option.disabled}
                required={required && type === "radio" && index === 0 ? true : undefined}
                aria-describedby={optionHintId}
                aria-invalid={error && props.multiple ? true : undefined}
                onChange={(e) => handleChange(option.value, e.currentTarget.checked)}
              />
              <Icon
                name="check"
                size={20}
                className="hidden peer-checked:inline-block"
              />
              <span className="flex flex-col">
                <span>{option.label}</span>
                {option.hint ? (
                  <span
                    id={optionHintId}
                    aria-hidden="true"
                    className="text-sm font-normal opacity-90"
                  >
                    {option.hint}
                  </span>
                ) : null}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
