import type { Metadata } from "next";
import { BookCta, ContentSection, PageIntro } from "@/components/content";
import { Container, DeductionBadge, Icon, InfoBox, LinkButton } from "@/components/ui";
import { notDeductible, type NotDeductibleItem } from "@/lib/content/notDeductible";
import { fmt, t } from "@/lib/i18n";

const c = t.content.notDeductible;

export const metadata: Metadata = {
  title: t.content.meta.notDeductible.title,
  description: t.content.meta.notDeductible.description,
  alternates: { canonical: "/vad-ger-inte-avdrag" },
};

/**
 * Each item has `id={item.id}` so WarningChip links (/vad-ger-inte-avdrag#<id>) land on it;
 * the targeted item is highlighted with the `target:` variant.
 */
function ItemList({ items }: { items: NotDeductibleItem[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li
          key={item.id}
          id={item.id}
          className="flex scroll-mt-4 items-start gap-3 rounded-card border border-border bg-surface p-4 target:border-2 target:border-warning-border target:bg-warning-soft"
        >
          <Icon name="close" size={24} className="mt-0.5 shrink-0 text-danger" />
          <div className="min-w-0 space-y-1">
            <h3 className="text-lg text-ink">{item.title}</h3>
            {item.detail ? <p>{item.detail}</p> : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

/** What does NOT give RUT/ROT (SPEC §5), from lib/content/notDeductible.ts. */
export default function NotDeductiblePage() {
  const rut = notDeductible.filter((i) => i.type === "rut");
  const rot = notDeductible.filter((i) => i.type === "rot");

  return (
    <Container width="text">
      <PageIntro title={c.title} lead={c.lead} />

      <div className="space-y-12">
        <InfoBox tone="legal" title={t.common.legal.labourOnly.title}>
          <p>{t.common.legal.labourOnly.body}</p>
        </InfoBox>

        <ContentSection
          id="rut"
          title={c.rutTitle}
          aside={<DeductionBadge type="rut" size="sm" />}
        >
          <p>
            {c.rutIntro} <span className="sr-only">({fmt(c.countLabel, { count: rut.length })})</span>
          </p>
          <ItemList items={rut} />
        </ContentSection>

        <ContentSection
          id="rot"
          title={c.rotTitle}
          aside={<DeductionBadge type="rot" size="sm" />}
        >
          <p>
            {c.rotIntro} <span className="sr-only">({fmt(c.countLabel, { count: rot.length })})</span>
          </p>
          <ItemList items={rot} />
        </ContentSection>

        <ContentSection id="hittar-du-inte" title={c.notListedTitle}>
          <p>{c.notListedBody}</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <LinkButton href={t.content.shared.skatteverketUrl} variant="secondary" newTab className="w-full sm:w-auto">
              {t.content.shared.skatteverketLink}
            </LinkButton>
            <LinkButton href="/sa-fungerar-rut-och-rot" variant="ghost" iconEnd="arrow-right" className="w-full sm:w-auto">
              {t.common.footer.links.howItWorks}
            </LinkButton>
          </div>
        </ContentSection>

        <BookCta />
      </div>
    </Container>
  );
}
