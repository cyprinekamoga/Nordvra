import Link from "next/link";
import { cx } from "@/components/ui/cx";
import { t } from "@/lib/i18n";

/** The brand mark (same as app/icon.svg). Decorative. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
      className={cx("shrink-0", className)}
    >
      <rect width="64" height="64" rx="14" fill="#0B5D4B" />
      <path
        d="M20 46V18h5.2l13.6 18.9V18H44v28h-5.2L25.2 27.1V46z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

export interface LogoProps {
  /** Link to the start page (default true). */
  link?: boolean;
  /** Hide the square brand mark on very narrow screens (< 420px) to save width. */
  compact?: boolean;
  className?: string;
}

/** Text logo "Nordvra" with "drivs av TO Städ och Flytt" underneath. */
export function Logo({ link = true, compact = false, className }: LogoProps) {
  const content = (
    <>
      <BrandMark className={cx("size-10", compact && "hidden min-[420px]:block")} />
      <span className="flex flex-col leading-tight">
        <span className="text-2xl font-extrabold tracking-tight text-brand">{t.common.brand.name}</span>
        <span className="text-xs font-semibold text-muted">{t.common.brand.operatedBy}</span>
      </span>
    </>
  );
  const classes = cx("inline-flex min-h-12 items-center gap-2 rounded-control", className);
  if (!link) return <span className={classes}>{content}</span>;
  return (
    <Link href="/" className={classes}>
      {content}
    </Link>
  );
}
