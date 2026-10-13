import Link from "next/link";
import { cx } from "@/components/ui/cx";
import { isCurrentPath, type NavItem } from "./nav";

export interface NavListProps {
  items: readonly NavItem[];
  /** desktop = horizontal row; mobile = large stacked rows. */
  variant: "desktop" | "mobile";
  /** Current pathname, used for `aria-current="page"`. Unknown (null) during static fallback. */
  pathname?: string | null;
  /** Called when a link is followed (closes the mobile menu). */
  onNavigate?: () => void;
}

/** Plain list of nav links. Hook-free so it can render in the static fallback. */
export function NavList({ items, variant, pathname, onNavigate }: NavListProps) {
  return (
    <ul className={variant === "desktop" ? "flex items-center gap-1" : "flex flex-col"}>
      {items.map((item) => {
        const current = isCurrentPath(pathname, item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={current ? "page" : undefined}
              onClick={onNavigate}
              className={cx(
                "flex min-h-12 items-center font-semibold text-ink decoration-brand decoration-2 underline-offset-8 hover:text-brand hover:underline",
                variant === "desktop"
                  ? "rounded-control px-3"
                  : "border-b border-border px-1 py-2 text-lg",
                "aria-[current=page]:text-brand aria-[current=page]:underline",
              )}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
