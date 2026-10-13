import { Suspense } from "react";
import { LinkButton } from "@/components/ui/LinkButton";
import { Icon } from "@/components/ui/Icon";
import { company } from "@/lib/company";
import { fmt, t } from "@/lib/i18n";
import { Logo } from "./Logo";
import { MobileMenu } from "./MobileMenu";
import { BOOK_HREF, mainNav } from "./nav";
import { NavLinks } from "./NavLinks";
import { NavList } from "./NavList";

/**
 * Site header. Below lg: a full-width phone strip ("Hellre ringa? Ring oss på …"), the logo and a
 * "Meny" disclosure. From lg: nav links and "Boka" (the strip stays). From xl: the phone number
 * moves into the header row as a button. Server component (menu and current-page marking are
 * small client islands).
 */
export function Header() {
  const phoneLabel = fmt(t.common.phone.headerButtonLabel, { phone: company.phoneDisplay });
  return (
    <header className="relative border-b border-border bg-surface">
      <a
        href={company.phoneHref}
        className="flex min-h-12 flex-wrap items-center justify-center gap-x-1.5 bg-brand-soft px-4 py-2 text-center font-bold text-brand-strong underline-offset-4 hover:underline xl:hidden"
      >
        <Icon name="phone" />
        <span>{t.common.phone.cardTitle}</span>
        <span className="whitespace-nowrap">
          {fmt(t.common.phone.callUsOn, { phone: company.phoneDisplay })}
        </span>
      </a>
      <div className="mx-auto flex w-full max-w-page items-center justify-between gap-3 px-4 py-2 sm:px-6">
        <Logo compact />
        <nav aria-label={t.common.nav.label} className="hidden lg:block">
          <Suspense fallback={<NavList items={mainNav} variant="desktop" />}>
            <NavLinks items={mainNav} variant="desktop" />
          </Suspense>
        </nav>
        <div className="hidden items-center gap-3 lg:flex">
          <span className="hidden xl:block">
            <LinkButton href={company.phoneHref} variant="secondary" icon="phone" aria-label={phoneLabel}>
              {company.phoneDisplay}
            </LinkButton>
          </span>
          <LinkButton href={BOOK_HREF} variant="primary" iconEnd="arrow-right">
            {t.common.nav.book}
          </LinkButton>
        </div>
        <MobileMenu className="lg:hidden" />
      </div>
    </header>
  );
}
