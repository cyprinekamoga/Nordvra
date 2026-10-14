import { Icon, cx } from "@/components/ui";
import type { FaqItem } from "@/lib/content/faq";
import { TextLink } from "./TextLink";

export interface FaqListProps {
  items: readonly FaqItem[];
  /** Give each question an anchor id (`#${item.id}`). Only on the FAQ page itself. */
  withAnchors?: boolean;
  className?: string;
}

/**
 * Questions and answers as native `<details>`/`<summary>`: keyboard and screen-reader support
 * come from the browser and no JavaScript is needed.
 */
export function FaqList({ items, withAnchors = false, className }: FaqListProps) {
  return (
    <div
      className={cx(
        "divide-y divide-border overflow-hidden rounded-card border border-border bg-surface shadow-card",
        className,
      )}
    >
      {items.map((item) => (
        <details key={item.id} id={withAnchors ? item.id : undefined} className="group scroll-mt-4">
          <summary
            className={cx(
              "flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-lg font-bold text-ink sm:px-6",
              "hover:bg-brand-soft group-open:bg-surface-muted [&::-webkit-details-marker]:hidden",
              "focus-visible:-outline-offset-4",
            )}
          >
            <span>{item.question}</span>
            <Icon
              name="chevron-down"
              size={24}
              className="shrink-0 text-brand transition-transform duration-150 group-open:rotate-180"
            />
          </summary>
          <div className="space-y-3 px-4 pt-3 pb-5 sm:px-6">
            {item.answer.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
            {item.links && item.links.length > 0 ? (
              <ul className="flex flex-col gap-x-6 sm:flex-row sm:flex-wrap">
                {item.links.map((link) => (
                  <li key={link.href}>
                    <TextLink href={link.href}>{link.label}</TextLink>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </details>
      ))}
    </div>
  );
}
