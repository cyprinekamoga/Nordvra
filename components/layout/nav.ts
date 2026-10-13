import { t } from "@/lib/i18n";

export interface NavItem {
  href: string;
  label: string;
}

/** Main navigation (header). "Boka" is rendered separately as a button. */
export const mainNav: readonly NavItem[] = [
  { href: "/sa-fungerar-rut-och-rot", label: t.common.nav.howItWorks },
  { href: "/vanliga-fragor", label: t.common.nav.faq },
  { href: "/kontakt", label: t.common.nav.contact },
];

/** Footer: every public page. */
export const footerPages: readonly NavItem[] = [
  { href: "/", label: t.common.footer.links.home },
  { href: "/boka", label: t.common.footer.links.book },
  { href: "/sa-fungerar-rut-och-rot", label: t.common.footer.links.howItWorks },
  { href: "/vad-ger-inte-avdrag", label: t.common.footer.links.notDeductible },
  { href: "/vanliga-fragor", label: t.common.footer.links.faq },
  { href: "/om-oss", label: t.common.footer.links.about },
  { href: "/kontakt", label: t.common.footer.links.contact },
];

export const footerLegal: readonly NavItem[] = [
  { href: "/villkor", label: t.common.footer.links.terms },
  { href: "/integritetspolicy", label: t.common.footer.links.privacy },
  { href: "/integritetspolicy#cookies", label: t.common.footer.links.cookies },
];

export const BOOK_HREF = "/boka";

/** True when `pathname` is the page `href` points to (ignores #hash). */
export function isCurrentPath(pathname: string | null | undefined, href: string): boolean {
  if (!pathname) return false;
  const path = href.split("#")[0];
  if (href.includes("#")) return false;
  return path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(`${path}/`);
}
