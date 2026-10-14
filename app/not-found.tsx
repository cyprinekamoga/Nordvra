import type { Metadata } from "next";
import { PageIntro, TextLink } from "@/components/content";
import { PhoneCard } from "@/components/layout";
import { Container, LinkButton } from "@/components/ui";
import { t } from "@/lib/i18n";

export const metadata: Metadata = {
  title: t.content.meta.notFound.title,
};

const links = [
  { href: "/sa-fungerar-rut-och-rot", label: t.common.footer.links.howItWorks },
  { href: "/vanliga-fragor", label: t.common.footer.links.faq },
  { href: "/vad-ger-inte-avdrag", label: t.common.footer.links.notDeductible },
  { href: "/kontakt", label: t.common.footer.links.contact },
] as const;

/** 404 page: Swedish, helpful links and the phone number. Static. */
export default function NotFound() {
  const c = t.content.notFound;
  return (
    <Container width="text" className="space-y-8 pb-4">
      <PageIntro title={c.title} lead={c.body} />
      <div className="flex flex-col gap-3 sm:flex-row">
        <LinkButton href="/" icon="house" className="w-full sm:w-auto">
          {t.common.actions.toHome}
        </LinkButton>
        <LinkButton href="/boka" variant="secondary" iconEnd="arrow-right" className="w-full sm:w-auto">
          {t.common.actions.bookInTwoMinutes}
        </LinkButton>
      </div>
      <nav aria-labelledby="vidare-rubrik" className="space-y-2">
        <h2 id="vidare-rubrik" className="text-2xl text-ink">
          {c.linksTitle}
        </h2>
        <ul>
          {links.map((link) => (
            <li key={link.href}>
              <TextLink href={link.href}>{link.label}</TextLink>
            </li>
          ))}
        </ul>
      </nav>
      <PhoneCard />
    </Container>
  );
}
