import Image from "next/image";
import Link from "next/link";
import { cx } from "@/components/ui/cx";
import { t } from "@/lib/i18n";

/** public/nordvra-logo.png: green "N" mountain-arrow mark above the word NORDVRA, transparent. */
const LOGO_SRC = "/nordvra-logo.png";
const LOGO_RATIO = 828 / 500;

const sizes = {
  /** 40px tall on mobile, 48px from lg. */
  header: { px: 48, className: "h-[2.5rem] lg:h-[3rem]" },
  /** 64px tall. */
  footer: { px: 64, className: "h-[4rem]" },
} as const;

export interface LogoProps {
  /** Link to the start page (default true). */
  link?: boolean;
  size?: keyof typeof sizes;
  className?: string;
}

/** The Nordvra logo image. As a link its alt text names the destination ("Nordvra – startsida"). */
export function Logo({ link = true, size = "header", className }: LogoProps) {
  const { px, className: height } = sizes[size];
  const image = (
    <Image
      quality={85}
      src={LOGO_SRC}
      alt={link ? t.common.brand.homeLinkLabel : t.common.brand.name}
      // CSS sets the rendered height; width/height give the aspect ratio and the 1x/2x srcset.
      width={Math.round(px * LOGO_RATIO)}
      height={px}
      loading={size === "header" ? "eager" : "lazy"}
      className={cx("w-auto", height)}
    />
  );
  const classes = cx("inline-flex min-h-12 shrink-0 items-center rounded-control", className);
  if (!link) return <span className={classes}>{image}</span>;
  return (
    <Link href="/" className={classes}>
      {image}
    </Link>
  );
}
