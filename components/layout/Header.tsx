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
 * Site header, sticky so the call button and the menu are always one tap away on a phone.
 * Below lg: the logo, a "Ring" button and a "Meny" disclosure, in one short row. From lg: nav
 * links, the call button and "Boka". From xl the call button shows the whole number. Server
 * component (menu and current-page marking are small client islands).
 */
export function Header() {
  const phoneLabel = fmt(t.common.phone.headerButtonLabel, { phone: company.phoneDisplay });
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/85">
      <div className="mx-auto flex w-full max-w-page items-center justify-between gap-2 px-4 py-1.5 sm:px-6 lg:py-2">
        <Logo />
        <nav aria-label={t.common.nav.label} className="hidden lg:block">
          <Suspense fallback={<NavList items={mainNav} variant="desktop" />}>
            <NavLinks items={mainNav} variant="desktop" />
          </Suspense>
        </nav>
        <div className="flex items-center gap-2 lg:gap-3">
          <a
            href={company.phoneHref}
            aria-label={phoneLabel}
            className="inline-flex min-h-12 min-w-12 items-center justify-center gap-2 rounded-control border-2 border-brand bg-surface px-3 font-semibold text-brand hover:bg-brand-soft"
          >
            <Icon name="phone" size={20} />
            <span className="xl:hidden">{t.common.phone.callShort}</span>
            <span className="hidden xl:inline">{company.phoneDisplay}</span>
          </a>
          <span className="hidden lg:block">
            <LinkButton href={BOOK_HREF} variant="primary" iconEnd="arrow-right">
              {t.common.nav.book}
            </LinkButton>
          </span>
          <MobileMenu className="lg:hidden" />
        </div>
      </div>
    </header>
  );
}
