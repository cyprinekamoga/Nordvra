"use client";

import { usePathname } from "next/navigation";
import { NavList, type NavListProps } from "./NavList";

/**
 * NavList that marks the current page with `aria-current="page"`.
 * Wrap in `<Suspense fallback={<NavList … />}>`: on routes with dynamic params the pathname is
 * only known at request time.
 */
export function NavLinks(props: Omit<NavListProps, "pathname">) {
  const pathname = usePathname();
  return <NavList {...props} pathname={pathname} />;
}
