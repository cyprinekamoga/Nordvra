import Link from "next/link";
import type { ReactNode } from "react";
import { Icon, cx } from "@/components/ui";
import { t } from "@/lib/i18n";

export interface TextLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
}

/**
 * Underlined text link with a 48px+ tap target. Internal paths use next/link; tel:, mailto:
 * and #anchors are plain anchors; http(s) links open in a new tab and say so to screen readers.
 */
export function TextLink({ href, children, className }: TextLinkProps) {
  const classes = cx("link inline-flex min-h-12 items-center gap-2 font-semibold", className);
  if (/^https?:\/\//i.test(href)) {
    return (
      <a href={href} className={classes} target="_blank" rel="noopener noreferrer">
        <span>{children}</span>
        <Icon name="external" size="1em" />
        <span className="sr-only">{t.common.external.newTab}</span>
      </a>
    );
  }
  if (/^(tel:|mailto:|#)/i.test(href)) {
    return (
      <a href={href} className={classes}>
        {href.startsWith("tel:") ? <Icon name="phone" /> : null}
        {href.startsWith("mailto:") ? <Icon name="mail" /> : null}
        <span>{children}</span>
      </a>
    );
  }
  return (
    <Link href={href} className={classes}>
      <span>{children}</span>
      <Icon name="arrow-right" />
    </Link>
  );
}
