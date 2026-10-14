import type { Metadata } from "next";
import { BookCta, CheckList, CompanyFacts, ContentSection, PageIntro } from "@/components/content";
import { Card, Container, Icon } from "@/components/ui";
import { company } from "@/lib/company";
import { fmt, t } from "@/lib/i18n";

const c = t.content.about;

export const metadata: Metadata = {
  title: t.content.meta.about.title,
  description: t.content.meta.about.description,
  alternates: { canonical: "/om-oss" },
};

/** Om oss (SPEC §5). */
export default function AboutPage() {
  return (
    <Container width="text">
      <PageIntro
        title={c.title}
        lead={fmt(c.lead, { legalName: company.legalName, hometown: company.hometown })}
      />

      <div className="space-y-12">
        <ContentSection id="varfor" title={c.why.title}>
          {c.why.body.map((text) => (
            <p key={text}>{text}</p>
          ))}
        </ContentSection>

        <ContentSection id="sa-arbetar-vi" title={c.how.title}>
          <CheckList items={c.how.items} />
        </ContentSection>

        <ContentSection id="fakta" title={c.facts.title}>
          <CompanyFacts />
        </ContentSection>

        <ContentSection id="omdomen" title={c.reviews.title}>
          <Card tone="muted" padding="md" className="flex items-center gap-3">
            <Icon name="users" size={26} className="shrink-0 text-muted" />
            <p>{c.reviews.body}</p>
          </Card>
        </ContentSection>

        <BookCta />
      </div>
    </Container>
  );
}
