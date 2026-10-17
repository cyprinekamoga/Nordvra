import Image from "next/image";
import type { ComponentPropsWithoutRef } from "react";
import { cx } from "@/components/ui/cx";
import { photos, type PhotoKey } from "@/lib/content/photos";

/*
 * Veils keep white text at well over 4.5:1 on any part of the photo: the text side is at least
 * 80 % forest green. hero = darkest at the start of the reading direction; flat = even; fade =
 * darker towards the bottom where buttons sit.
 */
const veils = {
  hero: "bg-linear-to-b from-forest/95 via-forest/88 to-forest/80 lg:bg-linear-to-r lg:from-forest/95 lg:via-forest/85 lg:to-forest/30",
  flat: "bg-forest/90",
  fade: "bg-linear-to-b from-forest/80 to-forest/95",
} as const;

export interface PhotoBandProps extends ComponentPropsWithoutRef<"section"> {
  photo: PhotoKey;
  veil?: keyof typeof veils;
  /** Above the fold: fetch the photo first. */
  eager?: boolean;
}

/**
 * Full-bleed section on a photo under a deep-green veil, for white text (hero, story band,
 * closing call to action). The photo is decoration; the section's text carries the content.
 * overflow-clip (not hidden) so sticky content inside, like the story's zigzag, still sticks.
 */
export function PhotoBand({ photo, veil = "flat", eager = false, className, children, ...rest }: PhotoBandProps) {
  const p = photos[photo];
  return (
    <section className={cx("relative isolate overflow-clip bg-forest text-on-brand", className)} {...rest}>
      <Image
        src={p.src}
        alt=""
        fill
        sizes="100vw"
        quality={50}
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : undefined}
        className="-z-20 object-cover"
        style={"focus" in p ? { objectPosition: p.focus } : undefined}
      />
      <div aria-hidden="true" className={cx("absolute inset-0 -z-10", veils[veil])} />
      {children}
    </section>
  );
}
