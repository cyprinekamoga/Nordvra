import { useId, type ComponentPropsWithRef, type ReactNode } from "react";
import { t } from "@/lib/i18n";
import { cx } from "./cx";
import { FieldError } from "./FieldError";

/** Shared look of text inputs and text areas. */
export const inputClasses =
  "block w-full rounded-control border-2 border-control bg-surface px-4 py-3 text-base text-ink placeholder:text-muted " +
  "hover:border-ink disabled:cursor-not-allowed disabled:border-border disabled:bg-surface-muted disabled:text-disabled " +
  "aria-invalid:border-danger";

export interface FieldShellProps {
  /** Visible label (required for accessibility; hide visually with `hideLabel` only if context is obvious). */
  label: ReactNode;
  /** Help text under the label, linked with `aria-describedby`. */
  hint?: ReactNode;
  /** Error message; sets `aria-invalid` and is linked with `aria-describedby`. */
  error?: ReactNode;
  /** Shows "(valfritt)" after the label. Mark optional fields rather than required ones. */
  optional?: boolean;
  hideLabel?: boolean;
  /** Class for the outer wrapper. */
  className?: string;
}

export interface TextFieldProps extends Omit<ComponentPropsWithRef<"input">, "className">, FieldShellProps {
  /** Text after the input, e.g. "kr" or "m²". */
  suffix?: ReactNode;
  /** Extra classes for the `<input>` (e.g. a narrower width for postcodes). */
  inputClassName?: string;
}

export function FieldLabel({
  htmlFor,
  label,
  optional,
  hideLabel,
}: {
  htmlFor: string;
  label: ReactNode;
  optional?: boolean;
  hideLabel?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className={hideLabel ? "sr-only" : "mb-1 block font-bold text-ink"}>
      {label}
      {optional ? <span className="font-normal text-muted"> {t.common.form.optional}</span> : null}
    </label>
  );
}

/** Label + input + hint + error, all wired together. Pass any native input props. */
export function TextField({
  label,
  hint,
  error,
  optional,
  hideLabel,
  className,
  suffix,
  inputClassName,
  id: idProp,
  "aria-describedby": extraDescribedBy,
  ...inputProps
}: TextFieldProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId, extraDescribedBy].filter(Boolean).join(" ") || undefined;
  return (
    <div className={cx("min-w-0", className)}>
      <FieldLabel htmlFor={id} label={label} optional={optional} hideLabel={hideLabel} />
      {hint ? (
        <p id={hintId} className="mb-2 text-muted">
          {hint}
        </p>
      ) : null}
      <div className="flex items-center gap-2">
        <input
          id={id}
          className={cx(inputClasses, "min-h-12", inputClassName)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...inputProps}
        />
        {suffix ? <span className="shrink-0 text-muted">{suffix}</span> : null}
      </div>
      {error && errorId ? (
        <FieldError id={errorId} className="mt-2">
          {error}
        </FieldError>
      ) : null}
    </div>
  );
}
