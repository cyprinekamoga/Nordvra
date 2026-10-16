import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { cx } from "@/components/ui/cx";
import { Icon } from "@/components/ui/Icon";
import { LinkButton } from "@/components/ui/LinkButton";
import { company } from "@/lib/company";
import { fmt, t } from "@/lib/i18n";

export interface PhoneCardProps {
  /** compact = one line "Hellre ringa? Ring oss på 076-113 43 84" (e.g. under the step buttons). */
  variant?: "card" | "compact";
  /** Heading level of the card title (default 2). */
  headingLevel?: 2 | 3;
  /** Override the body text. */
  body?: ReactNode;
  /** Also show the e-mail address (card variant). */
  showEmail?: boolean;
  className?: string;
}

/**
 * In-flow "Hellre ringa? Ring oss på …" call-to-action. SPEC §1 requires it on every customer
 * page (together with the header phone button). Server component.
 */
export function PhoneCard({
  variant = "card",
  headingLevel = 2,
  body,
  showEmail = false,
  className,
}: PhoneCardProps) {
  const phone = company.phoneDisplay;
  if (variant === "compact") {
    return (
      <p className={cx("flex flex-wrap items-center gap-x-2 gap-y-1 text-ink", className)}>
        <Icon name="phone" className="text-accent" />
        <span className="font-semibold">{t.common.phone.cardTitle}</span>
        <a href={company.phoneHref} className="link inline-flex min-h-12 items-center font-bold">
          {fmt(t.common.phone.callUsOn, { phone })}
        </a>
      </p>
    );
  }
  const Heading = `h${headingLevel}` as const;
  return (
    <Card tone="brand" className={cx("flex flex-col gap-4 sm:flex-row sm:items-center", className)}>
      <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-brand text-on-brand">
        <Icon name="phone" size={28} />
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        <Heading className="text-xl font-bold text-ink">{t.common.phone.cardTitle}</Heading>
        <p className="text-ink">{body ?? t.common.phone.cardBody}</p>
        {showEmail ? (
          <p className="text-muted">
            {t.common.phone.emailLead}{" "}
            <a href={company.emailHref} className="link font-semibold">
              {company.email}
            </a>
            .
          </p>
        ) : null}
      </div>
      <LinkButton href={company.phoneHref} variant="primary" icon="phone" className="sm:shrink-0">
        {fmt(t.common.phone.callUsOn, { phone })}
      </LinkButton>
    </Card>
  );
}
