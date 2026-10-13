import type { ComponentPropsWithoutRef } from "react";
import { cx } from "./cx";

export interface ContainerProps extends ComponentPropsWithoutRef<"div"> {
  /** page = 72rem (site), text = 42rem (reading), narrow = 36rem (forms, booking flow). */
  width?: "page" | "text" | "narrow";
}

const widths = { page: "max-w-page", text: "max-w-text", narrow: "max-w-narrow" } as const;

/** Centred column with the standard 16px mobile gutter (24px from sm). */
export function Container({ width = "page", className, ...rest }: ContainerProps) {
  return <div className={cx("mx-auto w-full px-4 sm:px-6", widths[width], className)} {...rest} />;
}
