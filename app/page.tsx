import type { Metadata } from "next";
import Link from "next/link";
import { Promises } from "@/components/content/Promises";
import { FaqList, JsonLd, TextLink } from "@/components/content";
import { PhotoChip, PhotoFrame, PhotoSplit } from "@/components/media";
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
import type { DeductionType } from "@/lib/taxRules";

const c = t.content.home;

export const metadata: Metadata = {
  title: { absolute: t.content.meta.home.title },
  description: t.content.meta.home.description,
  alternates: { canonical: "/" },
};

/** "Du betalar {price}" → ["Du betalar ", "2 800 kr", ""], so the amount can be styled as a price. */
function splitPrice(template: string, ore: number): [string, string, string] {
  const [before, after = ""] = template.split("{price}");
  return [before, formatKr(ore), after];
}

/** "Ingen bokningsavgift" and "Hellre ringa? Ring oss på …" in white, for the deep-green sections. */
function OnDarkContact({ className }: { className?: string }) {
  return (
    <div className={cx("flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6", className)}>
      <p className="inline-flex min-h-12 items-center gap-2 font-bold">
        <Icon name="check-circle" className="text-accent" />
        {t.common.badges.noBookingFee}
      </p>
      <p className="flex flex-wrap items-center gap-x-2">
        <Icon name="phone" className="text-accent" />
        <span>{t.common.phone.cardTitle}</span>
        <a
          href={company.phoneHref}
          className="inline-flex min-h-12 items-center font-bold underline decoration-1 underline-offset-4 hover:decoration-2"
        >
          {fmt(t.common.phone.callUsOn, { phone: company.phoneDisplay })}
        </a>
      </p>
    </div>
  );
}

/** Text on deep green beside a photo of a cleaner at work (on phones the photo is on top). */
function Hero() {
  const example = flyttstadExample();
  const [before, price, after] = splitPrice(c.hero.photoPrice, example.breakdown.toPay);
  return (
    <PhotoSplit photo="cleaningTeam" eager aria-labelledby="hero-rubrik">
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
          <DeductionBadge type="rut" />
          <DeductionBadge type="rot" />
        </div>
        <h1 id="hero-rubrik" className="text-4xl font-extrabold text-on-brand sm:text-5xl lg:text-[3rem]">
          {c.hero.title}
        </h1>
        <p className="text-xl">{t.common.brand.tagline}</p>
        <p className="text-lg text-forest-text">{c.hero.body}</p>
        <div className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <LinkButton href="/boka" variant="inverse" size="lg" iconEnd="arrow-right" className="w-full sm:w-auto">
              {t.common.actions.bookInTwoMinutes}
            </LinkButton>
            <LinkButton href="#sa-gar-det-till" variant="inverseOutline" size="lg" className="w-full sm:w-auto">
              {c.hero.howCta}
            </LinkButton>
          </div>
          <p className="text-forest-text">{c.hero.ctaHint}</p>
        </div>
        <OnDarkContact />
        <PhotoChip label={example.label} className="inline-block">
          {before}
          <span className="price text-brand">{price}</span>
          {after}
        </PhotoChip>
      </div>
    </PhotoSplit>
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

/** Photo and deduction type for each service card, in the order of `c.services.items`. */
const SERVICE_CARDS: readonly { photo: PhotoKey; type: DeductionType }[] = [
  { photo: "kitchenWipe", type: "rut" },
  { photo: "packing", type: "rut" },
  { photo: "paintRoller", type: "rot" },
  { photo: "carpenter", type: "rot" },
];

/** Four services as photo cards of the work itself; the whole card links to the booking flow. */
function Services() {
  const k = c.services;
  return (
    <section aria-labelledby="tjanster-rubrik" className="py-12 sm:py-16">
      <Container className="space-y-8">
        <div className="space-y-2">
          <p className="label-caps text-brand">{k.eyebrow}</p>
          <h2 id="tjanster-rubrik" className="text-2xl text-ink sm:text-3xl">
            {k.title}
          </h2>
        </div>
        <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {k.items.map((item, i) => (
            <li key={item.title} className="group focus-ring-within relative space-y-3 rounded-control">
              <PhotoFrame
                photo={SERVICE_CARDS[i].photo}
                shape="square"
                aspect="aspect-[4/5]"
                decorative
                reveal
                sizes="(min-width: 1024px) 18rem, (min-width: 640px) 50vw, 100vw"
                imageClassName="transition-transform duration-500 group-hover:scale-[1.03]"
              />
              <DeductionBadge type={SERVICE_CARDS[i].type} size="sm" />
              <h3 className="text-xl text-ink">
                <Link
                  href="/boka"
                  className="after:absolute after:inset-0 focus-visible:shadow-none focus-visible:outline-none"
                >
                  {item.title}
                </Link>
              </h3>
              <p className="text-muted">{item.body}</p>
              <span aria-hidden="true" className="inline-flex items-center gap-1.5 font-semibold text-brand">
                {k.cardCta}
                <Icon name="arrow-right" className="transition-transform duration-200 group-hover:translate-x-1" />
              </span>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

/** "Så enkelt är det" (SPEC §12: Välj tjänst → Välj tid → Vi fixar resten) as scrollytelling on deep green. */
function Steps() {
  const example = flyttstadExample();
  const [before, price] = splitPrice(c.steps.visual.pricePay, example.breakdown.toPay);
  return (
    <section id="sa-gar-det-till" aria-labelledby="steg-rubrik" className="scroll-mt-4 bg-forest text-on-brand">
      <Container className="space-y-10 py-14 sm:py-20">
        <div className="max-w-text space-y-3">
          <h2 id="steg-rubrik" className="text-3xl text-on-brand sm:text-4xl">
            {c.steps.title}
          </h2>
          <p className="text-xl text-forest-text">{c.steps.lead}</p>
        </div>
        <StepsStory
          steps={c.steps.items}
          stepLabel={c.steps.stepLabel}
          visual={{
            chipsTitle: c.steps.visual.chipsTitle,
            chips: c.steps.visual.chips,
            priceLabel: example.label,
            pricePay: [before, price],
            priceNote: c.steps.visual.priceNote,
            quote: c.steps.visual.quote,
            invoice: c.steps.visual.invoice,
          }}
        />
        <LinkButton href="/boka" variant="inverse" size="lg" iconEnd="arrow-right" className="w-full sm:w-auto">
          {t.common.actions.bookInTwoMinutes}
        </LinkButton>
      </Container>
    </section>
  );
}

/** Photo for each chapter of the example moving day: the movers, the cleaning, the last wipe. */
const DAY_PHOTOS: readonly PhotoKey[] = ["movers", "steamClean", "wiping"];

/** An example moving day in three chapters (interactive timeline). */
function MovingDaySection() {
  const k = c.movingDay;
  return (
    <section aria-labelledby="flyttdag-rubrik" className="border-b border-border bg-surface py-12 sm:py-16">
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

/** "Från Stockholm, för hela Sverige", beside a photo of a craftsman at work. */
function About() {
  const k = c.about;
  return (
    <section aria-labelledby="om-rubrik" className="border-b border-border bg-surface py-12 sm:py-16">
      <Container className="grid items-center gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-14">
        <PhotoFrame
          photo="windowCleaner"
          shape="square"
          aspect="aspect-[3/2]"
          reveal
          sizes="(min-width: 1296px) 40rem, (min-width: 1024px) 52vw, 100vw"
        />
        <div className="space-y-4">
          <p className="label-caps text-brand">{k.eyebrow}</p>
          <h2 id="om-rubrik" className="text-2xl text-ink sm:text-3xl">
            {k.title}
          </h2>
          <p className="text-lg">{fmt(t.common.footer.companyIntro, { hometown: company.hometown })}</p>
          <TextLink href="/om-oss">{k.link}</TextLink>
        </div>
      </Container>
    </section>
  );
}

/** Closing call to action beside a photo of painting gear (photo on the left from lg). */
function FinalCta() {
  return (
    // -mb-16 cancels the footer's top margin so the section meets the footer.
    <PhotoSplit photo="paintKit" side="start" aria-labelledby="redo-rubrik" className="-mb-16">
      <div className="space-y-5">
        <h2 id="redo-rubrik" className="text-3xl font-extrabold text-on-brand sm:text-5xl">
          {c.final.title}
        </h2>
        <p className="max-w-text text-xl text-forest-text">{c.final.body}</p>
        <LinkButton href="/boka" variant="inverse" size="lg" iconEnd="arrow-right" className="w-full sm:w-auto">
          {t.common.actions.bookInTwoMinutes}
        </LinkButton>
        <OnDarkContact />
      </div>
    </PhotoSplit>
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
        {/* Starts on the SPEC §12 example: flyttstäd 60 m², 5 600 kr before → 2 800 kr to pay. */}
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
      {yes ? <Icon name="check-circle" size={24} className="mt-0.5 shrink-0 text-success" /> : null}
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

function PromisesSection() {
  return (
    <section className="py-12 sm:py-16">
      <Container>
        <Promises />
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
      <Services />
      <Steps />
      <MovingDaySection />
      <DidYouKnow />
      <About />
      <Comparison />
      <Trust />
      <PromisesSection />
      <FaqPreview />
      <FinalCta />
    </>
  );
}
