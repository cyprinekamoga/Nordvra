import type { Metadata } from "next";
import { LegalDocumentView } from "@/components/content";
import { PhoneCard } from "@/components/layout";
import { Container } from "@/components/ui";
import { termsOfService } from "@/lib/content/legal";
import { t } from "@/lib/i18n";

export const metadata: Metadata = {
  title: t.content.meta.terms.title,
  description: t.content.meta.terms.description,
  alternates: { canonical: "/villkor" },
};

/** Villkor (SPEC §5). Draft – carries the legal review banner. */
export default function TermsPage() {
  return (
    <>
      <LegalDocumentView document={termsOfService()} />
      <Container width="text" className="pt-10">
        <PhoneCard />
      </Container>
    </>
  );
}
