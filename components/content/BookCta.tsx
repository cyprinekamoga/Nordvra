import { PhoneCard } from "@/components/layout";
import { Card, Icon, LinkButton, cx } from "@/components/ui";
import { t } from "@/lib/i18n";

export interface BookCtaProps {
  title?: string;
  body?: string;
  /** Id for the heading (must be unique on the page). */
  headingId?: string;
  className?: string;
}

/**
 * Closing call-to-action: "Boka på 2 minuter", "Ingen bokningsavgift" and the in-flow phone
 * card that SPEC §1 requires on every customer page.
 */
export function BookCta({
  title = t.content.shared.bookCtaTitle,
  body = t.content.shared.bookCtaBody,
  headingId = "boka-rubrik",
  className,
}: BookCtaProps) {
  return (
    <section aria-labelledby={headingId} className={cx("space-y-6", className)}>
      <Card tone="default" padding="lg" className="space-y-4">
        <h2 id={headingId} className="text-2xl text-ink sm:text-3xl">
          {title}
        </h2>
        <p className="text-lg">{body}</p>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <LinkButton href="/boka" size="lg" iconEnd="arrow-right" className="w-full sm:w-auto">
            {t.common.actions.bookInTwoMinutes}
          </LinkButton>
          <p className="inline-flex items-center gap-2 font-bold text-brand">
            <Icon name="check-circle" />
            {t.common.badges.noBookingFee}
          </p>
        </div>
      </Card>
      <PhoneCard />
    </section>
  );
}
