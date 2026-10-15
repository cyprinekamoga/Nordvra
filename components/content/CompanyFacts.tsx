import { company } from "@/lib/company";
import { t } from "@/lib/i18n";

/** Company facts as a description list (Om oss, Kontakt). */
export function CompanyFacts() {
  const f = t.content.about.facts;
  const rows: { term: string; value: string }[] = [
    { term: f.company, value: company.legalName },
    { term: f.hometown, value: company.hometown },
    { term: f.coverage, value: company.coverage },
    { term: f.fSkatt, value: company.fSkattCopy },
    { term: f.insurance, value: company.insuranceCopy },
  ];
  return (
    <dl className="divide-y divide-border rounded-card border border-border bg-surface">
      {rows.map((row) => (
        <div key={row.term} className="grid gap-1 p-4 sm:grid-cols-[12rem_1fr] sm:gap-4">
          <dt className="font-bold">{row.term}</dt>
          <dd>{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
