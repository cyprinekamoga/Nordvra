import type { ReactNode } from "react";
import { cx } from "@/components/ui";

export interface ContentSectionProps {
  /** Anchor id ("#tak"); the heading gets `${id}-rubrik`. */
  id: string;
  title: ReactNode;
  /** Something shown next to the heading, e.g. a DeductionBadge. */
  aside?: ReactNode;
  children?: ReactNode;
  className?: string;
}

/** A `<section>` with an h2 that labels it. Anchor-linkable via `id`. */
export function ContentSection({ id, title, aside, children, className }: ContentSectionProps) {
  const headingId = `${id}-rubrik`;
  return (
    <section id={id} aria-labelledby={headingId} className={cx("scroll-mt-4 space-y-4", className)}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h2 id={headingId} className="text-2xl text-ink sm:text-3xl">
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  );
}
