import type { Metadata } from "next";
import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/auth/admin";
import { AdminShell } from "@/components/admin/AdminShell";

// Every admin page reads the session and live data: allowed to block (no static shell).
export const instant = false;

export const metadata: Metadata = {
  title: { default: "Administration", template: "%s | Nordvra admin" },
  robots: { index: false, follow: false },
};

export default async function ProtectedAdminLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdmin();
  return <AdminShell email={admin.email}>{children}</AdminShell>;
}
