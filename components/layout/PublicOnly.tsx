"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** True for admin routes, which have their own shell. */
export function isAdminPath(pathname: string | null | undefined): boolean {
  return pathname === "/admin" || Boolean(pathname?.startsWith("/admin/"));
}

/** Hides its children under /admin. Use through `PublicChrome` (which adds the Suspense boundary). */
export function PublicOnly({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (isAdminPath(pathname)) return null;
  return <>{children}</>;
}
