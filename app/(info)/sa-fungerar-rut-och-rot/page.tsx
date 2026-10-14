import type { Metadata } from "next";
import {
  BookCta,
  CheckList,
  ContentSection,
  PageIntro,
  TableOfContents,
  TextLink,
} from "@/components/content";
import { LegalReviewBanner } from "@/components/layout";
import {
  Card,
  Container,
  DeductionBadge,
  InfoBox,
  LinkButton,
  PriceLine,
  PriceList,
} from "@/components/ui";
import { categories } from "@/lib/catalog/seed";
import { company } from "@/lib/company";
import { capSentence, paintingExample, taxFactVars, taxFacts } from "@/lib/content/facts";
import { fmt, t } from "@/lib/i18n";
import type { DeductionType } from "@/lib/taxRules";

const h = t.content.howItWorks;
const s = h.sections;
const legal = t.common.legal;

export const metadata: Metadata = {
  title: t.content.meta.howItWorks.title,
  description: fmt(t.content.meta.howItWorks.description, taxFactVars()),
  alternates: { canonical: "/sa-fungerar-rut-och-rot" },
};

function categoryNames(type: DeductionType): string[] {
  return categories
    .filter((c) => c.active && c.deductionType === type)
    .sort((a, b) => a.sort - b.sort)
    .map((c) => c.name);
}

const toc = [
  { id: "i-korthet", label: s.overview.title },
  { id: "arbetskostnad", label: s.labourOnly.title },
  { id: "tak", label: s.cap.title },
  { id: "vem-kan-fa-avdrag", label: s.who.title },
  { id: "flera-kopare", label: s.household.title },
  { id: "betalning", label: s.payment.title },
  { id: "ansokan", label: s.paperwork.title },
  { id: "om-och-tillbyggnad", label: s.rotAge.title },
  { id: "inte-avdrag", label: s.notDeductible.title },
  { id: "skatteverket", label: s.skatteverket.title },
] as const;

/** How RUT and ROT work (SPEC §5). Every rate and cap comes from lib/taxRules.ts. */
export default function HowItWorksPage() {
  const vars = taxFactVars();
  const facts = taxFacts();
  const example = paintingExample();
  const b = example.breakdown;

  return (
    <Container width="text">
      <PageIntro title={h.title} lead={h.lead}>
        <LegalReviewBanner />
      </PageIntro>

      <TableOfContents label={t.content.shared.onThisPage} items={toc} />

      <div className="space-y-12">
        <ContentSection id="i-korthet" title={s.overview.title}>
          <div className="grid gap-4">
            <Card padding="md" className="space-y-3">
              <DeductionBadge type="rut" />
              <h3 className="text-xl text-ink">{fmt(s.overview.rutTitle, vars)}</h3>
              <p>{s.overview.rutBody}</p>
              <ul className="list-disc space-y-1 pl-6 marker:text-rut">
                {categoryNames("rut").map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
            </Card>
            <Card padding="md" className="space-y-3">
              <DeductionBadge type="rot" />
              <h3 className="text-xl text-ink">{fmt(s.overview.rotTitle, vars)}</h3>
              <p>{s.overview.rotBody}</p>
              <ul className="list-disc space-y-1 pl-6 marker:text-rot">
                {categoryNames("rot").map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
            </Card>
          </div>
          <InfoBox tone="legal" title={legal.rates.title}>
            <p>{fmt(legal.rates.body, { rutRate: facts.rutRateNumber, rotRate: facts.rotRateNumber })}</p>
          </InfoBox>
        </ContentSection>

        <ContentSection id="arbetskostnad" title={s.labourOnly.title}>
          <InfoBox tone="legal" title={legal.labourOnly.title}>
            <p>{legal.labourOnly.body}</p>
          </InfoBox>
          <p>{s.labourOnly.body}</p>
          <Card tone="outline" padding="md" className="space-y-2">
            <h3 className="text-xl text-ink">{fmt(s.labourOnly.exampleTitle, { label: example.label })}</h3>
            <PriceList>
              <PriceLine label={s.labourOnly.labour} ore={b.lines.labour} />
              <PriceLine label={s.labourOnly.material} ore={b.lines.material} />
              <PriceLine label={s.labourOnly.total} ore={b.total} emphasis="strong" />
              <PriceLine
                label={fmt(s.labourOnly.deduction, { rate: vars.rotRate })}
                ore={b.deduction}
                negative
                accent="rot"
              />
              <PriceLine label={s.labourOnly.youPay} ore={b.toPay} emphasis="total" />
            </PriceList>
          </Card>
        </ContentSection>

        <ContentSection id="tak" title={s.cap.title}>
          <InfoBox tone="legal" title={legal.cap.title}>
            <p>{capSentence()}</p>
          </InfoBox>
          <p>{s.cap.perPerson}</p>
          <p>{s.cap.ownTax}</p>
          <p>{s.cap.checkRemaining}</p>
          <TextLink href={t.common.eligibility.skatteverketUrl}>{t.common.eligibility.skatteverketLink}</TextLink>
        </ContentSection>

        <ContentSection id="vem-kan-fa-avdrag" title={s.who.title}>
          <p>{s.who.lead}</p>
          <CheckList items={s.who.items.map((item) => fmt(item, vars))} />
          <div className="grid gap-4">
            <Card padding="md" className="space-y-3">
              <h3 className="flex flex-wrap items-center gap-3 text-xl text-ink">
                {s.who.rutTitle} <DeductionBadge type="rut" size="sm" />
              </h3>
              <ul className="list-disc space-y-1 pl-6 marker:text-rut">
                {s.who.rutItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </Card>
            <Card padding="md" className="space-y-3">
              <h3 className="flex flex-wrap items-center gap-3 text-xl text-ink">
                {s.who.rotTitle} <DeductionBadge type="rot" size="sm" />
              </h3>
              <ul className="list-disc space-y-1 pl-6 marker:text-rot">
                {s.who.rotItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </Card>
          </div>
        </ContentSection>

        <ContentSection id="flera-kopare" title={s.household.title}>
          {s.household.body.map((text) => (
            <p key={text}>{text}</p>
          ))}
        </ContentSection>

        <ContentSection id="betalning" title={s.payment.title}>
          <InfoBox tone="legal" title={legal.payment.title}>
            <p>{legal.payment.body}</p>
          </InfoBox>
          {s.payment.extra.map((text) => (
            <p key={text}>{text}</p>
          ))}
        </ContentSection>

        <ContentSection id="ansokan" title={s.paperwork.title}>
          <p>{s.paperwork.lead}</p>
          <div className="grid gap-4">
            <Card padding="md" className="space-y-2">
              <h3 className="flex flex-wrap items-center gap-3 text-xl text-ink">
                {s.paperwork.sellerTitle} <DeductionBadge type="rut" size="sm" />
              </h3>
              <p>{fmt(s.paperwork.sellerBody, { legalName: company.legalName })}</p>
              <p className="font-semibold">{legal.counterparty.seller}</p>
              <p>{legal.counterparty.complaint}</p>
            </Card>
            <Card padding="md" className="space-y-2">
              <h3 className="flex flex-wrap items-center gap-3 text-xl text-ink">
                {s.paperwork.agentTitle} <DeductionBadge type="rot" size="sm" />
              </h3>
              <p>{s.paperwork.agentBody}</p>
            </Card>
          </div>
          <InfoBox tone="legal" title={legal.notGuaranteed.title}>
            <p>{legal.notGuaranteed.body}</p>
          </InfoBox>
          <p>{s.paperwork.after}</p>
        </ContentSection>

        <ContentSection id="om-och-tillbyggnad" title={s.rotAge.title}>
          {s.rotAge.body.map((text) => (
            <p key={text}>{fmt(text, vars)}</p>
          ))}
        </ContentSection>

        <ContentSection id="inte-avdrag" title={s.notDeductible.title}>
          <p>{s.notDeductible.body}</p>
          <LinkButton href="/vad-ger-inte-avdrag" variant="secondary" iconEnd="arrow-right" className="w-full sm:w-auto">
            {s.notDeductible.link}
          </LinkButton>
        </ContentSection>

        <ContentSection id="skatteverket" title={s.skatteverket.title}>
          <p>{s.skatteverket.body}</p>
          <LinkButton href={t.content.shared.skatteverketUrl} variant="secondary" newTab className="w-full sm:w-auto">
            {t.content.shared.skatteverketLink}
          </LinkButton>
          <p className="text-muted">
            {fmt(t.content.shared.rulesSource, { year: facts.year, source: facts.source })}
          </p>
        </ContentSection>

        <BookCta />
      </div>
    </Container>
  );
}
