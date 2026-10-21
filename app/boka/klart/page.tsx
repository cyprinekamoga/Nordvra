import type { Metadata } from "next";
import { Suspense } from "react";
import { ClearDraftOnMount } from "@/components/booking/ClearDraftOnMount";
import { PhoneCard } from "@/components/layout";
import { Card, Container, Icon, LinkButton } from "@/components/ui";
import { BOOKING_NUMBER_RE } from "@/lib/booking/schema";
import { t } from "@/lib/i18n";

const d = t.booking.done;

export const metadata: Metadata = {
  title: d.metaTitle,
  robots: { index: false, follow: false },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function bookingNumberParam(value: string | string[] | undefined): string | null {
  const text = typeof value === "string" ? value.trim() : "";
  return BOOKING_NUMBER_RE.test(text) ? text : null;
}

/**
 * The booking number from `?nr=`, only when it has the expected shape (NV-2026-00012), and the
 * second number of a move-out package from `?nr2=`.
 */
async function BookingNumber({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const value = bookingNumberParam(params.nr);
  if (!value) return null;
  const extra = bookingNumberParam(params.nr2);
  return (
    <Card tone="outline" padding="sm" className="space-y-1">
      <p className="text-muted">{d.numberLabel}</p>
      <p className="text-2xl font-bold tracking-wide text-ink tabular-nums">{value}</p>
      {extra ? (
        <>
          <p className="pt-2 text-muted">{d.packageNumberLabel}</p>
          <p className="text-2xl font-bold tracking-wide text-ink tabular-nums">{extra}</p>
        </>
      ) : null}
      <p className="text-muted">{d.numberHint}</p>
    </Card>
  );
}

/** `/boka/klart` – thank-you page after "Skicka förfrågan". Clears the saved request draft. */
export default function RequestSentPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Container width="narrow" className="space-y-8 py-6 sm:py-10">
      <ClearDraftOnMount />
      <header className="space-y-4">
        <span className="flex size-14 items-center justify-center rounded-full bg-success-soft text-success">
          <Icon name="check-circle" size={32} />
        </span>
        <h1 className="text-3xl leading-tight font-bold text-ink">{d.title}</h1>
        <p className="text-lg text-ink">{d.body}</p>
      </header>

      <Suspense fallback={null}>
        <BookingNumber searchParams={searchParams} />
      </Suspense>

      <section aria-labelledby="sa-gar-det-till" className="space-y-4">
        <h2 id="sa-gar-det-till" className="text-2xl font-bold text-ink">
          {d.nextTitle}
        </h2>
        <ol className="space-y-4">
          {d.next.map((text, index) => (
            <li key={index} className="flex gap-4">
              <span
                aria-hidden="true"
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand text-lg font-bold text-on-brand"
              >
                {index + 1}
              </span>
              <span className="pt-1.5 text-ink">{text}</span>
            </li>
          ))}
        </ol>
      </section>

      <PhoneCard />

      <div className="flex flex-col gap-3 sm:flex-row">
        <LinkButton href="/" variant="primary" icon="house">
          {t.common.actions.toHome}
        </LinkButton>
        <LinkButton href="/boka" variant="secondary">
          {d.newRequest}
        </LinkButton>
      </div>
    </Container>
  );
}
