import type { Metadata } from "next";
import { LegalDocumentView } from "@/components/content";
import { PhoneCard } from "@/components/layout";
import { Container } from "@/components/ui";
import { privacyPolicy } from "@/lib/content/legal";
import { t } from "@/lib/i18n";

export const metadata: Metadata = {
  title: t.content.meta.privacy.title,
  description: t.content.meta.privacy.description,
  alternates: { canonical: "/integritetspolicy" },
};

/**
 * Integritetspolicy (SPEC §5, §13). Draft – carries the legal review banner. Has the
 * `#cookies` section the footer and cookie notice link to.
 */
export default function PrivacyPage() {
  return (
    <>
      <LegalDocumentView document={privacyPolicy()} />
      <Container width="text" className="pt-10">
        <PhoneCard />
      </Container>
    </>
  );
}
