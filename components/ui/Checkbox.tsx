import { useId, type ComponentPropsWithRef, type ReactNode } from "react";
import { cx } from "./cx";
import { FieldError } from "./FieldError";

export interface CheckboxProps extends Omit<ComponentPropsWithRef<"input">, "type" | "className"> {
  /** Label text. May contain links (e.g. to /villkor); the whole row toggles the box. */
  label: ReactNode;
  /** Extra explanation under the label, linked with `aria-describedby`. */
  description?: ReactNode;
  /** Error message; sets `aria-invalid` and is linked with `aria-describedby`. */
  error?: ReactNode;
  /** Draw a box around the checkbox row (for consent checkboxes). */
  boxed?: boolean;
  className?: string;
}

/** Large native checkbox (27px box, ≥48px row) with label, description and error. */
export function Checkbox({
  label,
  description,
  error,
  boxed = false,
  className,
  id: idProp,
  "aria-describedby": extraDescribedBy,
  ...inputProps
}: CheckboxProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [descriptionId, errorId, extraDescribedBy].filter(Boolean).join(" ") || undefined;
  return (
    <div
      className={cx(
        "min-w-0",
        boxed && "rounded-card border-2 bg-surface p-4",
        boxed && (error ? "border-danger" : "border-control"),
        className,
      )}
    >
      <div className="flex min-h-12 items-start gap-3">
        <input
          id={id}
          type="checkbox"
          className="mt-0.5 size-7 shrink-0 accent-brand"
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...inputProps}
        />
        <label htmlFor={id} className="flex-1 pt-0.5 font-semibold text-ink">
          {label}
        </label>
      </div>
      {description ? (
        <p id={descriptionId} className="mt-1 pl-10 text-muted">
          {description}
        </p>
      ) : null}
      {error && errorId ? (
        <FieldError id={errorId} className="mt-2 pl-10">
          {error}
        </FieldError>
      ) : null}
    </div>
  );
}
