import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { formatKr, formatKrRange } from "@/lib/format";
import { cx } from "./cx";

/** Real minus sign (U+2212), read as "minus" by screen readers. */
export const MINUS = "−";

export interface PriceListProps extends ComponentPropsWithoutRef<"dl"> {
  /** Announce changes politely (use when the numbers update as the customer answers). */
  live?: boolean;
}

/** `<dl>` wrapper for PriceLine rows. */
export function PriceList({ live = false, className, children, ...rest }: PriceListProps) {
  return (
    <dl
      className={className}
      aria-live={live ? "polite" : undefined}
      aria-atomic={live ? true : undefined}
      {...rest}
    >
      {children}
    </dl>
  );
}

export interface PriceLineProps {
  /** Left column, e.g. "Arbetskostnad (före avdrag)". */
  label: ReactNode;
  /** Small text under the label. */
  hint?: ReactNode;
  /** Amount in öre (formatted "4 200 kr") or a [min, max] range ("3 800–4 800 kr"). */
  ore?: number | readonly [number, number];
  /** Free value instead of `ore`, e.g. "Tillkommer vid behov – visas i offerten". */
  value?: ReactNode;
  /** Prefix the amount with a minus sign (deductions). */
  negative?: boolean;
  /** normal row, strong (bold), or total (large, bold, top border). */
  emphasis?: "normal" | "strong" | "total";
  /** Value colour accent, e.g. "rut"/"rot" for the deduction row. */
  accent?: "rut" | "rot" | "brand";
  className?: string;
}

const accents = { rut: "text-rut", rot: "text-rot", brand: "text-brand" } as const;

/** One row in a price breakdown. Must be inside `<PriceList>`. */
export function PriceLine({
  label,
  hint,
  ore,
  value,
  negative = false,
  emphasis = "normal",
  accent,
  className,
}: PriceLineProps) {
  let shown: ReactNode = value;
  const isAmount = ore !== undefined;
  if (isAmount) {
    const text = typeof ore === "number" ? formatKr(ore) : formatKrRange([ore[0], ore[1]]);
    shown = negative ? `${MINUS}${text}` : text;
  }
  return (
    <div
      className={cx(
        "flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3",
        emphasis === "total"
          ? "border-t-2 border-ink pt-4 text-xl"
          : "border-t border-border first:border-t-0",
        className,
      )}
    >
      <dt className={cx("min-w-0", emphasis === "normal" ? "font-normal" : "font-bold")}>
        {label}
        {hint ? <span className="block text-base font-normal text-muted">{hint}</span> : null}
      </dt>
      <dd
        className={cx(
          "ml-auto text-right",
          isAmount && "whitespace-nowrap tabular-nums",
          emphasis === "normal" ? "font-semibold" : "font-bold",
          accent && accents[accent],
        )}
      >
        {shown}
      </dd>
    </div>
  );
}
