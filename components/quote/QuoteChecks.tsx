import { Card, Icon } from "@/components/ui";
import { formatDateLong } from "@/lib/format";
import { fmt, t } from "@/lib/i18n";
import { companyAgeYears, type QuoteData } from "@/lib/quote/quote";

const c = t.quote.checks;

function ageText(years: number): string {
  if (years < 1) return c.ageNew;
  return years === 1 ? c.ageOne : fmt(c.ageYears, { years });
}

/**
 * "Kontrollerat företag": what Nordvra checked about the company that does the job (F-skatt
 * with the date, employer registration, liability insurance, how long it has existed, our
 * agreement). Only checks that hold are listed; nothing is shown before a company is chosen.
 */
export function QuoteChecks({ quote, today }: { quote: QuoteData; today: string }) {
  const checks = quote.partnerChecks;
  if (!checks) return null;
  const items: string[] = [];
  items.push(
    checks.fSkattCheckedAt ? fmt(c.fSkatt, { date: formatDateLong(checks.fSkattCheckedAt) }) : c.fSkattMissing,
  );
  if (checks.employerRegistered) items.push(c.employer);
  if (checks.insuranceCompany && (!checks.insuranceValidTo || checks.insuranceValidTo >= today)) {
    items.push(
      checks.insuranceValidTo
        ? fmt(c.insurance, { company: checks.insuranceCompany, date: formatDateLong(checks.insuranceValidTo) })
        : fmt(c.insuranceNoDate, { company: checks.insuranceCompany }),
    );
  }
  if (checks.foundedOn) {
    items.push(
      fmt(c.founded, { year: checks.foundedOn.slice(0, 4), age: ageText(companyAgeYears(checks.foundedOn, today)) }),
    );
  }
  if (checks.agreementSigned) items.push(c.agreement);

  return (
    <Card as="section" aria-labelledby="kontrollerat-foretag" className="space-y-3">
      <div className="flex items-center gap-3">
        <Icon name="badge-check" size={32} className="shrink-0 text-accent" />
        <h2 id="kontrollerat-foretag" className="text-xl font-bold text-ink">
          {c.title}
        </h2>
      </div>
      <p className="text-ink">{quote.partnerName ? fmt(c.lead, { partner: quote.partnerName }) : c.leadNoName}</p>
      {quote.partnerOrgNr ? <p className="font-semibold text-ink">{fmt(c.orgNr, { orgNr: quote.partnerOrgNr })}</p> : null}
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-3">
            <Icon name="check-circle" size={24} className="mt-0.5 shrink-0 text-success" />
            <span className="text-ink">{item}</span>
          </li>
        ))}
      </ul>
      <p>
        <a href={c.verifyUrl} className="link font-semibold" target="_blank" rel="noopener noreferrer">
          {c.verifyLink}
        </a>
      </p>
    </Card>
  );
}
