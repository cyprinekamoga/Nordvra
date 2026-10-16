import type { Metadata } from "next";
import { BookCta, FaqList, JsonLd } from "@/components/content";
import { PhoneCard } from "@/components/layout";
import { PhotoChip, PhotoFrame, RisingArrow } from "@/components/media";
import { DeductionCalculator } from "@/components/story/DeductionCalculator";
import { MovingDay } from "@/components/story/MovingDay";
import { StepsStory } from "@/components/story/StepsStory";
import { Card, Container, DeductionBadge, Icon, LinkButton, cx } from "@/components/ui";
import { company } from "@/lib/company";
import { flyttstadExample, taxFactVars } from "@/lib/content/facts";
import { faqPreview } from "@/lib/content/faq";
import type { PhotoKey } from "@/lib/content/photos";
import { formatKr } from "@/lib/format";
import { fmt, t } from "@/lib/i18n";
import { siteUrl } from "@/lib/site";

const c = t.content.home;

export const metadata: Metadata = {
  title: { absolute: t.content.meta.home.title },
  description: t.content.meta.home.description,
  alternates: { canonical: "/" },
};

function NoFeePill({ className }: { className?: string }) {
  return (
    <p
      className={cx(
        "inline-flex items-center gap-2 rounded-full bg-brand-soft px-4 py-2 font-bold text-brand",
        className,
      )}
    >
      <Icon name="check-circle" />
      {t.common.badges.noBookingFee}
    </p>
  );
}

/** "Du betalar {price}" → ["Du betalar ", "4 200 kr", ""], so the amount can be styled as a price. */
function splitPrice(template: string, ore: number): [string, string, string] {
  const [before, after = ""] = template.split("{price}");
  return [before, formatKr(ore), after];
}

function Hero() {
  const example = flyttstadExample();
  const [before, price, after] = splitPrice(c.hero.photoPrice, example.breakdown.toPay);
  return (
    <section aria-labelledby="hero-rubrik" className="border-b border-border bg-surface">
      <Container className="grid gap-10 py-10 sm:py-16 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-center">
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <DeductionBadge type="rut" />
            <DeductionBadge type="rot" />
          </div>
          <h1 id="hero-rubrik" className="text-3xl font-extrabold text-ink sm:text-5xl">
            {c.hero.title}
          </h1>
          <p className="text-xl text-ink">{t.common.brand.tagline}</p>
          <p className="text-lg text-muted">{c.hero.body}</p>
          <div className="space-y-3">
            <LinkButton href="/boka" size="lg" iconEnd="arrow-right" className="w-full sm:w-auto">
              {t.common.actions.bookInTwoMinutes}
            </LinkButton>
            <p className="text-muted">{c.hero.ctaHint}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6">
            <NoFeePill className="self-start" />
            <PhoneCard variant="compact" />
          </div>
        </div>

        <div className="relative pt-6 sm:pt-8">
          <PhotoFrame
            photo="cleaningSink"
            shape="peak"
            aspect="aspect-[4/3] lg:aspect-square"
            sizes="(min-width: 1296px) 36rem, (min-width: 1024px) 42vw, 100vw"
            eager
          >
            <PhotoChip label={example.label} className="absolute bottom-3 left-3 sm:bottom-5 sm:left-5">
              {before}
              <span className="price text-brand">{price}</span>
              {after}
            </PhotoChip>
          </PhotoFrame>
          <RisingArrow className="absolute top-0 right-0 z-10 w-2/5 max-w-56" />
        </div>
      </Container>
    </section>
  );
}

/** The six benefits, as a band right under the hero. */
function Benefits() {
  return (
    <section aria-labelledby="fordelar-rubrik" className="border-b border-border bg-brand-soft py-8 sm:py-10">
      <Container className="space-y-5">
        <h2 id="fordelar-rubrik" className="text-xl text-ink sm:text-2xl">
          {c.hero.benefitsTitle}
        </h2>
        <ul className="grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
          {c.hero.benefits.map((item) => (
            <li key={item} className="flex items-start gap-3 text-lg">
              <Icon name="check-circle" size={24} className="mt-0.5 shrink-0 text-brand" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

/** Photo behind each step of "Så enkelt är det". */
const STEP_PHOTOS: readonly PhotoKey[] = ["livingRoom", "kitchen", "carpenter"];

/** "Så enkelt är det" (SPEC §12: Välj tjänst → Välj tid → Vi fixar resten), told as scrollytelling. */
function Steps() {
  const example = flyttstadExample();
  const [before, price] = splitPrice(c.steps.visual.pricePay, example.breakdown.toPay);
  return (
    <section aria-labelledby="steg-rubrik" className="py-12 sm:py-16">
      <Container className="space-y-8">
        <h2 id="steg-rubrik" className="text-2xl text-ink sm:text-3xl">
          {c.steps.title}
        </h2>
        <StepsStory
          steps={c.steps.items.map((step, i) => ({ ...step, photo: STEP_PHOTOS[i] }))}
          stepLabel={c.steps.stepLabel}
          visual={{
            chips: c.steps.visual.chips,
            priceLabel: example.label,
            pricePay: [before, price],
            quote: c.steps.visual.quote,
            invoice: c.steps.visual.invoice,
          }}
        />
        <LinkButton href="/boka" variant="secondary" iconEnd="arrow-right" className="w-full sm:w-auto">
          {t.common.actions.bookInTwoMinutes}
        </LinkButton>
      </Container>
    </section>
  );
}

/** Photo for each chapter of the example moving day. */
const DAY_PHOTOS: readonly PhotoKey[] = ["movingBoxes", "cleaningBottles", "keys"];

/** An example moving day in three chapters (interactive timeline). */
function MovingDaySection() {
  const k = c.movingDay;
  return (
    <section aria-labelledby="flyttdag-rubrik" className="border-y border-border bg-surface py-12 sm:py-16">
      <Container className="space-y-8">
        <div className="max-w-text space-y-3">
          <h2 id="flyttdag-rubrik" className="text-2xl text-ink sm:text-3xl">
            {k.title}
          </h2>
          <p className="text-lg">{k.lead}</p>
        </div>
        <MovingDay
          label={k.tabsLabel}
          chapters={k.chapters.map((chapter, i) => ({ ...chapter, photo: DAY_PHOTOS[i] }))}
        />
        <p className="text-muted">{k.note}</p>
        <LinkButton href="/boka" variant="secondary" iconEnd="arrow-right" className="w-full sm:w-auto">
          {k.cta}
        </LinkButton>
      </Container>
    </section>
  );
}

function DidYouKnow() {
  const vars = taxFactVars();
  const example = flyttstadExample();
  const d = c.didYouKnow;
  return (
    <section aria-labelledby="visste-du-rubrik" className="bg-surface-muted py-12 sm:py-16">
      <Container className="space-y-8">
        <div className="max-w-text space-y-3">
          <h2 id="visste-du-rubrik" className="text-2xl text-ink sm:text-3xl">
            {d.title}
          </h2>
          <p className="text-lg">{d.lead}</p>
        </div>
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
          <Card padding="lg" className="space-y-3">
            <DeductionBadge type="rut" />
            <h3 className="text-xl text-ink">{fmt(d.rutTitle, vars)}</h3>
            <p>{d.rutBody}</p>
          </Card>
          <Card padding="lg" className="space-y-3">
            <DeductionBadge type="rot" />
            <h3 className="text-xl text-ink">{fmt(d.rotTitle, vars)}</h3>
            <p>{d.rotBody}</p>
          </Card>
        </div>
        {/* Starts on the SPEC §12 example: flyttstäd 60 m², 8 400 kr before → 4 200 kr to pay. */}
        <DeductionCalculator
          defaultType={example.type}
          defaultLabourKr={example.breakdown.lines.labour / 100}
          startHint={fmt(d.calculator.startHint, { label: example.label, price: formatKr(example.breakdown.lines.labour) })}
        />
        <LinkButton href="/sa-fungerar-rut-och-rot" variant="secondary" iconEnd="arrow-right" className="w-full sm:w-auto">
          {d.readMore}
        </LinkButton>
      </Container>
    </section>
  );
}

function YesNoCell({ yes, text }: { yes: boolean; text: string }) {
  return (
    <span className="inline-flex items-start gap-2">
      <Icon
        name={yes ? "check-circle" : "minus"}
        size={24}
        className={cx("mt-0.5 shrink-0", yes ? "text-success" : "text-muted")}
      />
      <span className={yes ? "font-bold" : undefined}>{text}</span>
    </span>
  );
}

function Comparison() {
  const k = c.compare;
  return (
    <section aria-labelledby="jamforelse-rubrik" className="py-12 sm:py-16">
      <Container className="space-y-8">
        <div className="max-w-text space-y-3">
          <h2 id="jamforelse-rubrik" className="text-2xl text-ink sm:text-3xl">
            {k.title}
          </h2>
          <p className="text-lg">{k.lead}</p>
        </div>

        {/* Mobile: one card per row. Hidden with display:none from sm, so it is never read twice. */}
        <ul className="space-y-3 sm:hidden">
          {k.rows.map((row) => (
            <Card as="li" key={row.feature} padding="md" className="space-y-3">
              <p className="font-bold">{row.feature}</p>
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2">
                <dt className="font-semibold">{k.colUs}:</dt>
                <dd>
                  <YesNoCell yes text={row.us} />
                </dd>
                <dt className="font-semibold text-muted">{k.colThem}:</dt>
                <dd>
                  <YesNoCell yes={row.themYes} text={row.them} />
                </dd>
              </dl>
            </Card>
          ))}
        </ul>

        <div className="hidden overflow-hidden rounded-card border border-border bg-surface shadow-card sm:block">
          <table className="w-full table-fixed border-collapse text-left">
            <caption className="sr-only">{k.caption}</caption>
            <thead className="bg-surface-muted">
              <tr>
                <th scope="col" className="w-2/5 p-4 font-bold">
                  {k.colFeature}
                </th>
                <th scope="col" className="p-4 font-bold text-brand">
                  {k.colUs}
                </th>
                <th scope="col" className="p-4 font-bold">
                  {k.colThem}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {k.rows.map((row) => (
                <tr key={row.feature}>
                  <th scope="row" className="p-4 align-top font-semibold">
                    {row.feature}
                  </th>
                  <td className="bg-brand-soft/50 p-4 align-top">
                    <YesNoCell yes text={row.us} />
                  </td>
                  <td className="p-4 align-top">
                    <YesNoCell yes={row.themYes} text={row.them} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Container>
    </section>
  );
}

function Trust() {
  const k = c.trust;
  return (
    <section aria-labelledby="trygghet-rubrik" className="bg-surface-muted py-12 sm:py-16">
      <Container className="space-y-8">
        <h2 id="trygghet-rubrik" className="text-2xl text-ink sm:text-3xl">
          {k.title}
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {k.items.map((item) => (
            <Card as="li" key={item.title} padding="md" className="flex items-start gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
                <Icon name={item.icon} size={26} />
              </span>
              <div className="min-w-0 space-y-1">
                <h3 className="text-lg text-ink">{item.title}</h3>
                <p>{fmt(item.body, { hometown: company.hometown, phone: company.phoneDisplay })}</p>
              </div>
            </Card>
          ))}
          <Card as="li" tone="outline" padding="md" className="flex items-start gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-surface-muted text-muted">
              <Icon name="users" size={26} />
            </span>
            <div className="min-w-0 space-y-1">
              <h3 className="text-lg text-ink">{k.reviewsTitle}</h3>
              <p className="text-muted">{k.reviewsBody}</p>
            </div>
          </Card>
        </ul>
      </Container>
    </section>
  );
}

function FaqPreview() {
  return (
    <section aria-labelledby="fragor-rubrik" className="py-12 sm:py-16">
      <Container width="text" className="space-y-6">
        <h2 id="fragor-rubrik" className="text-2xl text-ink sm:text-3xl">
          {c.faq.title}
        </h2>
        <FaqList items={faqPreview()} />
        <LinkButton href="/vanliga-fragor" variant="secondary" iconEnd="arrow-right" className="w-full sm:w-auto">
          {c.faq.all}
        </LinkButton>
      </Container>
    </section>
  );
}

function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: company.brandName,
    legalName: company.legalName,
    url: siteUrl(),
    telephone: company.phoneHref.replace(/^tel:/, ""),
    email: company.email,
    areaServed: { "@type": "Country", name: "Sverige" },
  };
}

/** Homepage (SPEC §12). Static: no request-time APIs. */
export default function HomePage() {
  return (
    <>
      <JsonLd data={organizationJsonLd()} />
      <Hero />
      <Benefits />
      <Steps />
      <MovingDaySection />
      <DidYouKnow />
      <Comparison />
      <Trust />
      <FaqPreview />
      <Container width="text" className="pb-4">
        <BookCta title={c.final.title} body={c.final.body} headingId="redo-rubrik" />
      </Container>
    </>
  );
}
