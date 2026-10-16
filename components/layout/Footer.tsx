import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { company } from "@/lib/company";
import { fmt, t } from "@/lib/i18n";
import { Logo } from "./Logo";
import { footerLegal, footerPages, type NavItem } from "./nav";

function LinkColumn({ heading, items }: { heading: string; items: readonly NavItem[] }) {
  return (
    <div>
      <h2 className="mb-2 text-lg font-bold text-ink">{heading}</h2>
      <ul>
        {items.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className="link inline-flex min-h-12 items-center">
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Site footer: all public pages, legal links, company facts and contact. Server component. */
export function Footer() {
  const f = t.common.footer;
  return (
    <footer className="mt-16 border-t border-border bg-surface-muted text-ink">
      <div className="mx-auto grid w-full max-w-page gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div className="space-y-4 sm:col-span-2 lg:col-span-1">
          <Logo size="footer" />
          <p className="text-muted">
            {fmt(f.companyIntro, { legalName: company.legalName, hometown: company.hometown })}
          </p>
          <p className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1 font-bold text-brand">
            <Icon name="check" />
            {f.noBookingFee}
          </p>
        </div>

        <nav aria-label={f.navLabel} className="grid gap-10 sm:col-span-2 sm:grid-cols-2">
          <LinkColumn heading={f.servicesHeading} items={footerPages} />
          <LinkColumn heading={f.legalHeading} items={footerLegal} />
        </nav>

        <div className="sm:col-span-2 lg:col-span-1">
          <h2 className="mb-2 text-lg font-bold text-ink">{f.companyHeading}</h2>
          <ul className="space-y-2">
            <li className="font-semibold">{company.legalName}</li>
            <li className="flex items-start gap-2">
              <Icon name="map-pin" className="mt-1 text-brand" />
              <span>{fmt(f.location, { hometown: company.hometown })}</span>
            </li>
            <li className="flex items-start gap-2">
              <Icon name="badge-check" className="mt-1 text-brand" />
              <span>{f.fSkatt}</span>
            </li>
            <li className="flex items-start gap-2">
              <Icon name="shield" className="mt-1 text-brand" />
              <span>{f.insured}</span>
            </li>
          </ul>
          <h2 className="mt-6 mb-2 text-lg font-bold text-ink">{f.contactHeading}</h2>
          <ul>
            <li>
              <a href={company.phoneHref} className="link inline-flex min-h-12 items-center gap-2 font-semibold">
                <Icon name="phone" />
                {company.phoneDisplay}
              </a>
            </li>
            <li>
              <a href={company.emailHref} className="link inline-flex min-h-12 items-center gap-2 font-semibold">
                <Icon name="mail" />
                {company.email}
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <p className="mx-auto w-full max-w-page px-4 py-4 text-sm text-muted sm:px-6">{f.copyright}</p>
      </div>
    </footer>
  );
}
