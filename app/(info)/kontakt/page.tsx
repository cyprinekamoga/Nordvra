import type { Metadata } from "next";
import { CompanyFacts, ContentSection, PageIntro, TextLink } from "@/components/content";
import { Card, Container, Icon, InfoBox, LinkButton } from "@/components/ui";
import { company } from "@/lib/company";
import { fmt, t } from "@/lib/i18n";

const c = t.content.contact;

export const metadata: Metadata = {
  title: t.content.meta.contact.title,
  description: t.content.meta.contact.description,
  alternates: { canonical: "/kontakt" },
};

/**
 * Kontakt (SPEC §5): phone first and big, e-mail, hours, company facts. No contact form –
 * personnummer must never arrive by e-mail or free text.
 */
export default function ContactPage() {
  return (
    <Container width="text">
      <PageIntro title={c.title} lead={c.lead} />

      <div className="space-y-12">
        <div className="grid gap-4">
          {/* In-flow phone card ("Ring oss på 072-222 88 00", SPEC §1). */}
          <Card as="section" tone="brand" padding="lg" aria-labelledby="ring-rubrik" className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-brand text-on-brand">
                <Icon name="phone" size={28} />
              </span>
              <h2 id="ring-rubrik" className="text-2xl text-ink">
                {c.phoneTitle}
              </h2>
            </div>
            <p className="text-lg">{c.phoneBody}</p>
            {/* The visible number is part of the accessible name ("Ring oss på 072-222 88 00"). */}
            <LinkButton
              href={company.phoneHref}
              size="lg"
              icon="phone"
              aria-label={fmt(t.common.phone.callUsOn, { phone: company.phoneDisplay })}
              className="w-full sm:w-auto"
            >
              <span className="text-xl whitespace-nowrap sm:text-2xl">{company.phoneDisplay}</span>
            </LinkButton>
            <p className="font-semibold">
              {fmt(t.common.phone.ctaWithNumber, { phone: company.phoneDisplay })}
            </p>
            <p className="flex items-start gap-2">
              <Icon name="clock" className="mt-1 shrink-0 text-accent" />
              <span>
                <span className="font-bold">{c.hoursLabel}:</span> {c.hours}
              </span>
            </p>
          </Card>

          <Card as="section" padding="lg" aria-labelledby="mejl-rubrik" className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
                <Icon name="mail" size={28} />
              </span>
              <h2 id="mejl-rubrik" className="text-2xl text-ink">
                {c.emailTitle}
              </h2>
            </div>
            <p>{c.emailBody}</p>
            <LinkButton href={company.emailHref} variant="secondary" icon="mail" className="w-full sm:w-auto">
              {company.email}
            </LinkButton>
          </Card>

          <InfoBox tone="info" icon="lock">
            <p>{c.privacyNote}</p>
          </InfoBox>
        </div>

        <ContentSection id="bokning" title={c.bookingTitle}>
          <p>{c.bookingBody}</p>
        </ContentSection>

        <ContentSection id="inte-nojd" title={c.complaintTitle}>
          <p>{c.complaintBody}</p>
          <TextLink href="/villkor#reklamation">{c.complaintLink}</TextLink>
        </ContentSection>

        <ContentSection id="foretaget" title={c.companyTitle}>
          <CompanyFacts />
        </ContentSection>
      </div>
    </Container>
  );
}
