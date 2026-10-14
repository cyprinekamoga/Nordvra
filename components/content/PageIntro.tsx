import type { ReactNode } from "react";
import { cx } from "@/components/ui";

export interface PageIntroProps {
  /** The page's only <h1>. */
  title: ReactNode;
  /** Short introduction under the heading. */
  lead?: ReactNode;
  /** Extra content under the lead, e.g. the legal review banner or a version line. */
  children?: ReactNode;
  className?: string;
}

/** Page heading block for content pages: h1, lead paragraph and optional extras. */
export function PageIntro({ title, lead, children, className }: PageIntroProps) {
  return (
    <header className={cx("space-y-4 pt-8 pb-6 sm:pt-12", className)}>
      <h1 className="text-3xl text-ink sm:text-4xl">{title}</h1>
      {lead ? <p className="text-xl text-muted">{lead}</p> : null}
      {children}
    </header>
  );
}
