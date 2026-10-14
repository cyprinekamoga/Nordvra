"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/components/ui";

export function AdminNav({ items }: { items: readonly { href: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Administration" className="mx-auto max-w-6xl overflow-x-auto px-2">
      <ul className="flex gap-1">
        {items.map((item) => {
          const current = item.href === "/admin" ? pathname === "/admin" : pathname?.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={current ? "page" : undefined}
                className={cx(
                  "inline-flex min-h-12 items-center whitespace-nowrap border-b-4 px-3 font-bold no-underline",
                  current ? "border-brand text-brand" : "border-transparent text-ink hover:border-border",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
