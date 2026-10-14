import type { ReactNode } from "react";
import { BOOK_HREF } from "@/components/layout";
import { Icon, LinkButton, cx, type IconName } from "@/components/ui";
import { company } from "@/lib/company";
import { fmt, t } from "@/lib/i18n";

export type QuoteStateKind = "notFound" | "unavailable" | "expired" | "declined" | "cancelled" | "notReady";

const q = t.quote.states;

const content: Record<QuoteStateKind, { icon: IconName; tone: string; title: string; newRequest: boolean }> = {
  notFound: { icon: "help", tone: "bg-info-soft text-info", title: q.notFound.title, newRequest: true },
  unavailable: { icon: "alert", tone: "bg-warning-soft text-warning", title: q.unavailable.title, newRequest: false },
  expired: { icon: "clock", tone: "bg-warning-soft text-warning", title: q.expired.title, newRequest: true },
  declined: { icon: "check-circle", tone: "bg-info-soft text-info", title: q.declined.title, newRequest: true },
  cancelled: { icon: "info", tone: "bg-info-soft text-info", title: q.cancelled.title, newRequest: true },
  notReady: { icon: "clock", tone: "bg-info-soft text-info", title: q.notReady.title, newRequest: false },
};

function bodyText(kind: QuoteStateKind, expiresAt?: string | null): string {
  switch (kind) {
    case "expired":
      return expiresAt ? fmt(q.expired.body, { date: expiresAt }) : q.expired.bodyNoDate;
    default:
      return q[kind].body;
  }
}

/**
 * Every quote page state except "open" and "approved": friendly heading, plain explanation,
 * the phone number as a big button and (where useful) a link to make a new request.
 */
export function QuoteStateMessage({
  kind,
  expiresAt,
  bookingNumber,
  children,
}: {
  kind: QuoteStateKind;
  /** Already formatted, e.g. "15 okt. 2026 14:00". */
  expiresAt?: string | null;
  bookingNumber?: string | null;
  children?: ReactNode;
}) {
  const c = content[kind];
  return (
    <section aria-labelledby="offert-status-rubrik" className="space-y-6">
      <header className="space-y-4">
        <span className={cx("flex size-14 items-center justify-center rounded-full", c.tone)}>
          <Icon name={c.icon} size={32} />
        </span>
        {bookingNumber ? (
          <p className="font-semibold text-muted">{fmt(t.quote.header.eyebrow, { bookingNumber })}</p>
        ) : null}
        <h1 id="offert-status-rubrik" className="text-3xl leading-tight font-bold text-ink">
          {c.title}
        </h1>
        <p className="text-lg text-ink">{bodyText(kind, expiresAt)}</p>
      </header>
      {children}
      <div className="flex flex-col gap-3 sm:flex-row">
        <LinkButton href={company.phoneHref} icon="phone" size="lg" className="w-full sm:w-auto">
          {fmt(t.common.phone.callUsOn, { phone: company.phoneDisplay })}
        </LinkButton>
        {c.newRequest ? (
          <LinkButton href={BOOK_HREF} variant="secondary" size="lg" className="w-full sm:w-auto">
            {q.newRequest}
          </LinkButton>
        ) : null}
      </div>
    </section>
  );
}
