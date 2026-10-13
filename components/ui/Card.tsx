import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "./cx";

type CardElement = "div" | "section" | "article" | "aside" | "li";

export interface CardProps extends HTMLAttributes<HTMLElement> {
  /** HTML element to render (default "div"). Give a `section` an `aria-labelledby`. */
  as?: CardElement;
  /** default = white with shadow; muted = warm grey; brand = soft green; outline = white with a control-coloured border. */
  tone?: "default" | "muted" | "brand" | "outline";
  padding?: "none" | "sm" | "md" | "lg";
  children?: ReactNode;
}

const tones = {
  default: "bg-surface border border-border shadow-card",
  muted: "bg-surface-muted border border-border",
  brand: "bg-brand-soft border border-brand/30",
  outline: "bg-surface border-2 border-control",
} as const;

const paddings = {
  none: "",
  sm: "p-3",
  md: "p-4 sm:p-6",
  lg: "p-6 sm:p-8",
} as const;

/** Rounded surface for grouping content. */
export function Card({ as = "div", tone = "default", padding = "md", className, children, ...rest }: CardProps) {
  const Element = as;
  return (
    <Element className={cx("rounded-card text-ink", tones[tone], paddings[padding], className)} {...rest}>
      {children}
    </Element>
  );
}
