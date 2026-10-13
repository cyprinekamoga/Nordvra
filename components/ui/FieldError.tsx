import type { ReactNode } from "react";
import { t } from "@/lib/i18n";
import { cx } from "./cx";
import { Icon } from "./Icon";

export interface FieldErrorProps {
  /** Referenced from the field's `aria-describedby`. */
  id: string;
  children: ReactNode;
  className?: string;
}

/** Error message under a field: icon + "Fel:" for screen readers + text. Not colour-only. */
export function FieldError({ id, children, className }: FieldErrorProps) {
  return (
    <p id={id} className={cx("flex items-start gap-2 font-semibold text-danger", className)}>
      <Icon name="alert" className="mt-1" />
      <span>
        <span className="sr-only">{t.common.form.errorPrefix} </span>
        {children}
      </span>
    </p>
  );
}
