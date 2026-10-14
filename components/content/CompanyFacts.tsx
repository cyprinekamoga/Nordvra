import { company, displayValue } from "@/lib/company";
import { t } from "@/lib/i18n";

/** Company facts as a description list (Om oss, Kontakt). Pending values show "(fylls i före lansering)". */
export function CompanyFacts() {
  const f = t.content.about.facts;
  // TODO(före lansering): org.nr och adress fylls i i lib/company.ts.
  const rows: { term: string; value: string }[] = [
    { term: f.company, value: company.legalName },
    { term: f.hometown, value: company.hometown },
    { term: f.coverage, value: company.coverage },
    { term: f.fSkatt, value: company.fSkattCopy },
    { term: f.insurance, value: company.insuranceCopy },
    { term: f.orgNr, value: displayValue(company.orgNr) },
    { term: f.address, value: displayValue(company.address) },
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
