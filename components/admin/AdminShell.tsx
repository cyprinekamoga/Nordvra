import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/layout";
import { signOutAction } from "@/lib/admin/auth-actions";
import { AdminNav } from "@/components/admin/AdminNav";

export const ADMIN_NAV = [
  { href: "/admin", label: "Översikt" },
  { href: "/admin/bokningar", label: "Bokningar" },
  { href: "/admin/partners", label: "Utförare" },
  { href: "/admin/tjanster", label: "Tjänster & priser" },
  { href: "/admin/installningar", label: "Inställningar" },
  { href: "/admin/export", label: "Export" },
] as const;

export function AdminShell({ email, children }: { email: string; children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-canvas">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="no-underline" aria-label="Nordvra administration, startsida">
              <Logo link={false} />
            </Link>
            <span className="rounded-full bg-brand-soft px-3 py-1 text-sm font-bold text-brand">Admin</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="text-muted">{email}</span>
            <form action={signOutAction}>
              <button type="submit" className="link min-h-12">
                Logga ut
              </button>
            </form>
          </div>
        </div>
        <AdminNav items={ADMIN_NAV} />
      </header>
      <div className="mx-auto max-w-6xl px-4 py-6">{children}</div>
    </div>
  );
}
