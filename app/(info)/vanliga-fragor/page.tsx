import type { Metadata } from "next";
import { BookCta, ContentSection, FaqList, JsonLd, PageIntro, TableOfContents } from "@/components/content";
import { Container } from "@/components/ui";
import { faqByGroup, faqJsonLd, getFaq } from "@/lib/content/faq";
import { t } from "@/lib/i18n";

const c = t.content.faqPage;

export const metadata: Metadata = {
  title: t.content.meta.faq.title,
  description: t.content.meta.faq.description,
  alternates: { canonical: "/vanliga-fragor" },
};

/** FAQ (SPEC §5): grouped native <details> plus FAQPage structured data. */
export default function FaqPage() {
  const items = getFaq();
  const groups = faqByGroup(items);

  return (
    <Container width="text">
      <JsonLd data={faqJsonLd(items)} />
      <PageIntro title={c.title} lead={c.lead} />

      <TableOfContents
        label={c.groupsNav}
        items={groups.map(({ group }) => ({ id: `amne-${group.id}`, label: group.title }))}
      />

      <div className="space-y-12">
        {groups.map(({ group, items: groupItems }) => (
          <ContentSection key={group.id} id={`amne-${group.id}`} title={group.title}>
            <FaqList items={groupItems} withAnchors />
          </ContentSection>
        ))}

        <BookCta />
      </div>
    </Container>
  );
}
