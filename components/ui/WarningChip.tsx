import Link from "next/link";
import type { ReactNode } from "react";
import { notDeductibleById } from "@/lib/content/notDeductible";
import { t } from "@/lib/i18n";
import { cx } from "./cx";
import { Icon } from "./Icon";

export interface WarningChipProps {
  /** Id from lib/content/notDeductible.ts, e.g. "rut-byggstadning". Unknown ids render nothing. */
  id: string;
  /** Override the text (defaults to the item's title). */
  children?: ReactNode;
  className?: string;
}

/** Path of the explanation for a not-deductible item. */
export function notDeductibleHref(id: string): string {
  return `/vad-ger-inte-avdrag#${encodeURIComponent(id)}`;
}

/**
 * "Ger inte avdrag: Byggstädning" chip linking to /vad-ger-inte-avdrag#<id>.
 * Server-component safe.
 */
export function WarningChip({ id, children, className }: WarningChipProps) {
  const item = notDeductibleById(id);
  if (!item) return null;
  return (
    <Link
      href={notDeductibleHref(id)}
      className={cx(
        "inline-flex min-h-12 items-center gap-2 rounded-full border-2 border-warning-border bg-warning-soft px-4 py-2 text-left font-semibold text-warning",
        "underline decoration-1 underline-offset-4 hover:decoration-2",
        className,
      )}
    >
      <Icon name="warning" />
      <span>
        <span>{t.common.warningChip.prefix}</span> {children ?? item.title}
      </span>
    </Link>
  );
}
