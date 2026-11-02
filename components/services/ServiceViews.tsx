import Link from "next/link";
import { BookCta, CheckList, FaqList, JsonLd, Promises } from "@/components/content";
import { PhotoFrame } from "@/components/media";
import { Card, Container, DeductionBadge, Icon, LinkButton } from "@/components/ui";
import type { Catalog, Category, Service } from "@/lib/catalog/types";
import { company } from "@/lib/company";
import { faqJsonLd } from "@/lib/content/faq";
import { taxFactVars } from "@/lib/content/facts";
import { categoryPhotos } from "@/lib/content/photos";
import { categoryCopy, serviceCopy, type PageFaq } from "@/lib/content/servicePages";
import { formatKr, formatKrRange } from "@/lib/format";
import { fmt, t } from "@/lib/i18n";
import {
  activeCategories,
  bookHref,
  categoryHref,
  serviceHref,
  servicePrice,
  soleService,
  type ServicePrice,
} from "@/lib/services/pages";
import { servicesInCategory } from "@/lib/catalog/types";
import { siteUrl } from "@/lib/site";

const sp = t.content.servicePages;

function typeLabel(service: Pick<Service, "deductionType">): "RUT" | "ROT" {
  return service.deductionType === "rut" ? "RUT" : "ROT";
}

/** "{rutRate}" etc. filled in from lib/taxRules.ts. */
function facts(text: string): string {
  return fmt(text, taxFactVars());
}

// ---------------------------------------------------------------------------------------------
// Texts for a service: hand-written where we have them, otherwise built from the catalogue

export function serviceTexts(service: Service) {
  const copy = serviceCopy[service.id];
  const vars = taxFactVars();
  const type = typeLabel(service);
  const rate = service.deductionType === "rut" ? vars.rutRate : vars.rotRate;
  const name = service.name.toLowerCase();
  const lead = copy ? facts(copy.lead) : fmt(sp.genericLead, { description: service.description, type });
  const faq: PageFaq[] = [
    ...(copy?.faq ?? []),
    {
      question: fmt(sp.deductionQuestion, { type, service: name }),
      answer: fmt(service.rotKind === "rebuild" ? sp.deductionAnswerRebuild : sp.deductionAnswer, {
        rate,
        years: vars.rotYears,
      }),
    },
    { question: fmt(sp.howQuestion, { service: name }), answer: sp.howAnswer },
  ];
  return {
    lead,
    body: (copy?.body ?? []).map(facts),
    includes: copy?.includes ?? [],
    faq,
    metaTitle: copy?.metaTitle ? facts(copy.metaTitle) : fmt(sp.genericMetaTitle, { service: service.name, type }),
    metaDescription: copy?.metaDescription
      ? facts(copy.metaDescription)
      : fmt(sp.genericMetaDescription, { service: name, rate, type }),
  };
}

export function categoryTexts(category: Category) {
  const copy = categoryCopy[category.id];
  const type = category.deductionType === "rut" ? "RUT" : "ROT";
  return {
    lead: copy ? facts(copy.lead) : fmt(sp.genericMetaTitle, { service: category.name, type }),
    body: (copy?.body ?? []).map(facts),
    metaTitle: copy ? facts(copy.metaTitle) : fmt(sp.genericMetaTitle, { service: category.name, type }),
    metaDescription: copy ? facts(copy.metaDescription) : sp.overview.metaDescription,
  };
}

// ---------------------------------------------------------------------------------------------
// Building blocks

interface Crumb {
  label: string;
  href: string;
}

/** Visible breadcrumbs plus the matching BreadcrumbList structured data. */
export function Breadcrumbs({ items }: { items: readonly Crumb[] }) {
  const all = [{ label: sp.home, href: "/" }, ...items];
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: all.map((item, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: item.label,
            item: siteUrl(item.href),
          })),
        }}
      />
      <nav aria-label={sp.breadcrumbLabel} className="pt-4 sm:pt-6">
        <ol className="flex flex-wrap items-center gap-x-1 text-base text-muted">
          {all.map((item, i) => {
            const last = i === all.length - 1;
            return (
              <li key={item.href} className="flex items-center gap-1">
                {last ? (
                  <span aria-current="page" className="font-semibold text-ink">
                    {item.label}
                  </span>
                ) : (
                  <>
                    <Link href={item.href} className="link inline-flex min-h-11 items-center">
                      {item.label}
                    </Link>
                    <Icon name="chevron-right" size={16} />
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}

/** "Från 2 100 kr" (or "250–320 kr per timme") after the deduction, for lists. */
export function shortPrice(price: ServicePrice): string | null {
  if (price.kind === "quote") return null;
  if (price.kind === "rate") return `${formatKrRange(price.after)} ${sp.unit[price.unit]}`;
  return fmt(sp.priceFrom, { price: formatKr(price.after[0]) }) + (price.perVisit ? ` ${sp.perVisit}` : "");
}

function PriceBox({ service, price }: { service: Service; price: ServicePrice }) {
  const type = typeLabel(service);
  return (
    <section aria-labelledby="pris-rubrik" className="space-y-4">
      <h2 id="pris-rubrik" className="text-2xl text-ink sm:text-3xl">
        {sp.priceTitle}
      </h2>
      {price.kind === "quote" ? (
        <Card>
          <p>{sp.quoteOnly}</p>
        </Card>
      ) : (
        <Card className="space-y-4">
          <div className="space-y-1">
            <p className="price text-2xl whitespace-normal text-brand sm:text-4xl">
              {price.kind === "rate"
                ? `${formatKrRange(price.after)} ${sp.unit[price.unit]}`
                : fmt(sp.priceFrom, { price: formatKr(price.after[0]) })}
            </p>
            <p className="font-semibold">
              {fmt(sp.priceAfter, { type })}
              {price.kind === "total" && price.perVisit ? `, ${sp.perVisit}` : ""}
            </p>
            <p className="text-muted">
              {fmt(sp.priceBefore, {
                price: price.kind === "rate" ? formatKrRange(price.before) : formatKr(price.before[0]),
              })}
            </p>
          </div>

          {price.kind === "total" && price.rows.length > 1 ? (
            <div className="overflow-hidden rounded-control border border-border">
              <table className="w-full border-collapse text-left">
                <caption className="sr-only">{fmt(sp.tableCaption, { service: service.name.toLowerCase() })}</caption>
                <thead className="bg-surface-muted">
                  <tr>
                    <th scope="col" className="p-3 font-bold">
                      {sp.sizeCol}
                    </th>
                    <th scope="col" className="hidden p-3 font-bold sm:table-cell">
                      {sp.beforeCol}
                    </th>
                    <th scope="col" className="p-3 font-bold">
                      {sp.afterCol}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {price.rows.map((row) => (
                    <tr key={row.sizeBand}>
                      <th scope="row" className="p-3 font-semibold">
                        {t.common.sizeBands[row.sizeBand]}
                      </th>
                      <td className="price hidden p-3 font-normal text-muted sm:table-cell">{formatKrRange(row.before)}</td>
                      <td className="price p-3 text-brand">{formatKrRange(row.after)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {price.note ? <p className="text-muted">{price.note}</p> : null}
          <p className="text-muted">{sp.priceNote}</p>
        </Card>
      )}
    </section>
  );
}

/** Service cards: name, description, price and a link to the service page. */
export function ServiceCards({ catalog, services }: { catalog: Catalog; services: readonly Service[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
      {services.map((service) => {
        const price = shortPrice(servicePrice(catalog, service));
        return (
          <li key={service.id} className="group focus-ring-within relative rounded-card">
            <Card className="flex h-full flex-col gap-2 transition-colors group-hover:border-brand group-hover:bg-brand-soft">
              <h3 className="text-lg text-ink">
                <Link
                  href={serviceHref(catalog, service)}
                  className="after:absolute after:inset-0 focus-visible:shadow-none focus-visible:outline-none"
                >
                  {service.name}
                </Link>
              </h3>
              <p className="text-muted max-sm:text-base">{service.description}</p>
              <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-1">
                {price ? <p className="price text-brand">{price}</p> : <span />}
                <Icon name="arrow-right" className="text-brand transition-transform group-hover:translate-x-1" />
              </div>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}

function serviceJsonLd(catalog: Catalog, service: Service, category: Category) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.name,
    description: service.description,
    serviceType: service.name,
    category: category.name,
    url: siteUrl(serviceHref(catalog, service)),
    areaServed: { "@type": "Country", name: "Sverige" },
    provider: { "@type": "Organization", name: company.brandName, url: siteUrl(), telephone: company.phoneHref.replace(/^tel:/, "") },
  };
}

// ---------------------------------------------------------------------------------------------
// Pages

export function ServicePageView({
  catalog,
  service,
  category,
}: {
  catalog: Catalog;
  service: Service;
  category: Category;
}) {
  const texts = serviceTexts(service);
  const price = servicePrice(catalog, service);
  const isSole = soleService(catalog, category)?.id === service.id;
  const others = servicesInCategory(catalog, category.id).filter((s) => s.id !== service.id);
  const name = service.name.toLowerCase();
  const crumbs: Crumb[] = [{ label: sp.allServices, href: "/tjanster" }];
  if (!isSole) crumbs.push({ label: category.name, href: categoryHref(category) });
  crumbs.push({ label: service.name, href: serviceHref(catalog, service) });

  return (
    <>
      <JsonLd data={serviceJsonLd(catalog, service, category)} />
      <JsonLd data={faqJsonLd(texts.faq.map((f) => ({ question: f.question, answer: [f.answer] })))} />
      <Container className="space-y-10 sm:space-y-14">
        <Breadcrumbs items={crumbs} />

        <header className="grid items-center gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-12">
          <div className="space-y-4">
            <DeductionBadge type={service.deductionType} />
            <h1 className="text-[2rem] leading-tight text-ink sm:text-5xl">{service.name}</h1>
            <p className="text-lg text-ink sm:text-xl">{texts.lead}</p>
            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
              <LinkButton href={bookHref(service)} size="lg" iconEnd="arrow-right" className="w-full sm:w-auto">
                {fmt(sp.book, { service: name })}
              </LinkButton>
              <p className="inline-flex items-center gap-2 font-bold text-brand">
                <Icon name="check-circle" />
                {t.common.badges.noBookingFee}
              </p>
            </div>
          </div>
          {categoryPhotos[category.id] ? (
            <PhotoFrame
              photo={categoryPhotos[category.id]}
              shape="rounded"
              aspect="aspect-[16/9] lg:aspect-[4/3]"
              decorative
              eager
              sizes="(min-width: 1024px) 34rem, 100vw"
            />
          ) : null}
        </header>

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
          <div className="min-w-0 space-y-10">
            <PriceBox service={service} price={price} />
            {texts.includes.length > 0 ? (
              <section aria-labelledby="ingar-rubrik" className="space-y-4">
                <h2 id="ingar-rubrik" className="text-2xl text-ink sm:text-3xl">
                  {sp.includesTitle}
                </h2>
                <CheckList items={texts.includes} />
              </section>
            ) : null}
            {texts.body.length > 0 ? (
              <div className="max-w-text space-y-4 text-lg">
                {texts.body.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
            ) : null}
          </div>
          <section aria-labelledby="fragor-rubrik" className="min-w-0 space-y-4">
            <h2 id="fragor-rubrik" className="text-2xl text-ink sm:text-3xl">
              {fmt(sp.faqTitle, { service: name })}
            </h2>
            <FaqList items={texts.faq.map((f, i) => ({ id: `fraga-${i + 1}`, question: f.question, answer: [f.answer] }))} />
          </section>
        </div>

        <Promises />

        {others.length > 0 ? (
          <section aria-labelledby="fler-rubrik" className="space-y-4">
            <h2 id="fler-rubrik" className="text-2xl text-ink sm:text-3xl">
              {fmt(sp.otherServices, { category: category.name.toLowerCase() })}
            </h2>
            <ServiceCards catalog={catalog} services={others} />
          </section>
        ) : null}

        <BookCta headingId="boka-rubrik" />
      </Container>
    </>
  );
}

export function CategoryPageView({ catalog, category }: { catalog: Catalog; category: Category }) {
  const texts = categoryTexts(category);
  const services = servicesInCategory(catalog, category.id);
  return (
    <Container className="space-y-10 sm:space-y-14">
      <Breadcrumbs
        items={[
          { label: sp.allServices, href: "/tjanster" },
          { label: category.name, href: categoryHref(category) },
        ]}
      />
      <header className="grid items-center gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-12">
        <div className="space-y-4">
          <DeductionBadge type={category.deductionType} />
          <h1 className="text-[2rem] leading-tight text-ink sm:text-5xl">{category.name}</h1>
          <p className="text-lg text-ink sm:text-xl">{texts.lead}</p>
        </div>
        {categoryPhotos[category.id] ? (
          <PhotoFrame
            photo={categoryPhotos[category.id]}
            shape="rounded"
            aspect="aspect-[16/9] lg:aspect-[4/3]"
            decorative
            eager
            sizes="(min-width: 1024px) 34rem, 100vw"
          />
        ) : null}
      </header>

      <section aria-labelledby="tjanster-rubrik" className="space-y-4">
        <h2 id="tjanster-rubrik" className="text-2xl text-ink sm:text-3xl">
          {fmt(sp.servicesIn, { category: category.name.toLowerCase() })}
        </h2>
        <ServiceCards catalog={catalog} services={services} />
      </section>

      {texts.body.length > 0 ? (
        <div className="max-w-text space-y-4 text-lg">
          {texts.body.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
      ) : null}

      <Promises />
      <BookCta headingId="boka-rubrik" />
    </Container>
  );
}

/** /tjanster: every category with its services. */
export function ServicesOverview({ catalog }: { catalog: Catalog }) {
  return (
    <Container className="space-y-10 sm:space-y-14">
      <Breadcrumbs items={[{ label: sp.allServices, href: "/tjanster" }]} />
      <header className="max-w-text space-y-4">
        <h1 className="text-[2rem] leading-tight text-ink sm:text-5xl">{sp.overview.title}</h1>
        <p className="text-lg text-ink sm:text-xl">{sp.overview.lead}</p>
      </header>
      {activeCategories(catalog).map((category) => {
        const sole = soleService(catalog, category);
        const headingId = `kategori-${category.id}`;
        return (
          <section key={category.id} aria-labelledby={headingId} className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <h2 id={headingId} className="text-2xl text-ink sm:text-3xl">
                <Link href={categoryHref(category)} className="hover:underline">
                  {category.name}
                </Link>
              </h2>
              <DeductionBadge type={category.deductionType} size="sm" />
            </div>
            <ServiceCards catalog={catalog} services={sole ? [sole] : servicesInCategory(catalog, category.id)} />
          </section>
        );
      })}
      <BookCta headingId="boka-rubrik" />
    </Container>
  );
}
