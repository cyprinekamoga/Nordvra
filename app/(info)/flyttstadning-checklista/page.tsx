import type { Metadata } from "next";
import { BookCta, CheckList, ContentSection, PageIntro } from "@/components/content";
import { PrintButton } from "@/components/quote/PrintButton";
import { Container, InfoBox } from "@/components/ui";
import { inspectionTips, moveOutChecklist } from "@/lib/content/moveOutChecklist";
import { t } from "@/lib/i18n";

const c = t.content.checklist;
const guarantee = t.common.legal.inspectionGuarantee;

export const metadata: Metadata = {
  title: t.content.meta.checklist.title,
  description: t.content.meta.checklist.description,
  alternates: { canonical: "/flyttstadning-checklista" },
};

/** What a move-out inspection usually checks, room by room, and the besiktningsgaranti. Printable. */
export default function MoveOutChecklistPage() {
  return (
    <Container width="text">
      <PageIntro title={c.title} lead={c.lead} />

      <div className="space-y-12">
        <InfoBox tone="success" title={guarantee.title} headingLevel={2} icon="shield">
          <p>{guarantee.body}</p>
        </InfoBox>

        {moveOutChecklist.map((room) => (
          <ContentSection key={room.id} id={room.id} title={room.title}>
            <CheckList items={room.items} />
          </ContentSection>
        ))}

        <ContentSection id="besiktningen" title={c.tipsTitle}>
          <CheckList items={inspectionTips} />
        </ContentSection>

        <PrintButton>{c.print}</PrintButton>

        <BookCta title={c.ctaTitle} body={c.ctaBody} headingId="checklista-boka" className="print:hidden" />
      </div>
    </Container>
  );
}
