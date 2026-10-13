import { useId, type ComponentPropsWithRef } from "react";
import { cx } from "./cx";
import { FieldError } from "./FieldError";
import { FieldLabel, inputClasses, type FieldShellProps } from "./TextField";

export interface TextAreaProps extends Omit<ComponentPropsWithRef<"textarea">, "className">, FieldShellProps {
  /** Extra classes for the `<textarea>`. */
  textareaClassName?: string;
}

/** Label + textarea + hint + error. Defaults to 4 rows. Pass any native textarea props. */
export function TextArea({
  label,
  hint,
  error,
  optional,
  hideLabel,
  className,
  textareaClassName,
  id: idProp,
  rows = 4,
  "aria-describedby": extraDescribedBy,
  ...textareaProps
}: TextAreaProps) {
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
      <textarea
        id={id}
        rows={rows}
        className={cx(inputClasses, "resize-y", textareaClassName)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...textareaProps}
      />
      {error && errorId ? (
        <FieldError id={errorId} className="mt-2">
          {error}
        </FieldError>
      ) : null}
    </div>
  );
}
