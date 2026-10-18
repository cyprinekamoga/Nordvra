import Link from "next/link";
import { Container } from "@/components/ui";
import { company } from "@/lib/company";
import type { LegalBlock, LegalDocument } from "@/lib/content/legal";
import { fmt, t } from "@/lib/i18n";
import { TableOfContents } from "./TableOfContents";
import { TextLink } from "./TextLink";

const effectiveDate = new Intl.DateTimeFormat("sv-SE", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Stockholm",
});

/** "2026-10-13" → "13 oktober 2026" (fixed date, no clock read). */
export function formatEffectiveDate(isoDate: string): string {
  return effectiveDate.format(new Date(`${isoDate.slice(0, 10)}T12:00:00Z`));
}

function Block({ block }: { block: LegalBlock }) {
  switch (block.kind) {
    case "p":
      return <p>{block.text}</p>;
    case "ul":
      return (
        <ul className="list-disc space-y-2 pl-6 marker:text-accent">
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      );
    case "dl":
      return (
        <dl className="divide-y divide-border rounded-card border border-border bg-surface">
          {block.items.map((item) => (
            <div key={item.term} className="space-y-1 p-4">
              <dt className="font-bold">{item.term}</dt>
              <dd className="text-ink">{item.detail}</dd>
            </div>
          ))}
        </dl>
      );
    case "links":
      return (
        <ul className="flex flex-col">
          {block.items.map((link) => (
            <li key={link.href}>
              <TextLink href={link.href}>{link.label}</TextLink>
            </li>
          ))}
        </ul>
      );
  }
}

/**
 * Renders Villkor / Integritetspolicy: legal-review banner, h1, version and date, intro,
 * table of contents and numbered sections with anchor ids.
 */
export function LegalDocumentView({ document }: { document: LegalDocument }) {
  const l = t.content.legal;
  return (
    <Container width="text">
      <article aria-labelledby="dokument-rubrik">
        <header className="space-y-4 pt-8 pb-2 sm:pt-12">
          <h1 id="dokument-rubrik" className="text-3xl text-ink sm:text-4xl">
            {document.title}
          </h1>
          <p className="text-muted">
            {fmt(l.version, { version: document.version })}
            <span aria-hidden="true"> · </span>
            <span className="sr-only">. </span>
            {fmt(l.effective, { date: formatEffectiveDate(document.version) })}
          </p>
          {document.intro.map((text) => (
            <p key={text} className="text-lg">
              {text}
            </p>
          ))}
        </header>

        <TableOfContents
          label={l.tocTitle}
          items={document.sections.map((s) => ({ id: s.id, label: s.title }))}
        />

        <div className="space-y-10">
          {document.sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              aria-labelledby={`${section.id}-rubrik`}
              className="scroll-mt-4 space-y-4"
            >
              <h2 id={`${section.id}-rubrik`} className="text-2xl text-ink">
                {section.title}
              </h2>
              {section.blocks.map((block, i) => (
                <Block key={i} block={block} />
              ))}
              {section.subsections?.map((sub) => (
                <div key={sub.title} className="space-y-3 border-l-4 border-brand-soft pl-4">
                  <h3 className="text-xl text-ink">{sub.title}</h3>
                  {sub.blocks.map((block, i) => (
                    <Block key={i} block={block} />
                  ))}
                </div>
              ))}
            </section>
          ))}
        </div>

        <p className="mt-10 border-t border-border pt-6 text-muted">
          {fmt(l.questions, { phone: company.phoneDisplay, email: company.email })}{" "}
          <Link href="/kontakt" className="link">
            {t.common.footer.links.contact}
          </Link>
        </p>
      </article>
    </Container>
  );
}
