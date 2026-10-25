import Image from "next/image";
import type { ComponentPropsWithoutRef } from "react";
import { cx } from "@/components/ui/cx";
import { photos, type PhotoKey } from "@/lib/content/photos";

export interface PhotoSplitProps extends ComponentPropsWithoutRef<"section"> {
  photo: PhotoKey;
  /** The photo's side from lg; on smaller screens it always sits on top. */
  side?: "start" | "end";
  /** Above the fold: fetch the photo first. */
  eager?: boolean;
}

/*
 * The text column lines up with the page container (max-w-page, 1.5rem gutter) while the photo
 * runs to the edge of the screen.
 */
const gutter = {
  end: "lg:pr-14 lg:pl-[max(1.5rem,calc((100vw-81rem)/2+1.5rem))]",
  start: "lg:pl-14 lg:pr-[max(1.5rem,calc((100vw-81rem)/2+1.5rem))]",
} as const;

/**
 * Deep-green section in two halves: white text on solid forest green, and a photo of the work,
 * shown in full with no veil. On phones the photo is a strip above the text. The photo is
 * decoration; the text carries the content.
 */
export function PhotoSplit({ photo, side = "end", eager = false, className, children, ...rest }: PhotoSplitProps) {
  const p = photos[photo];
  return (
    <section className={cx("bg-forest text-on-brand lg:grid lg:grid-cols-2", className)} {...rest}>
      <div
        className={cx(
          "relative h-[13rem] bg-surface-muted sm:h-[22rem] lg:h-auto lg:min-h-[36rem]",
          side === "start" ? "lg:order-first" : "lg:order-last",
        )}
      >
        <Image
          src={p.src}
          alt=""
          fill
          // From lg the cell is half the screen wide; object-cover may enlarge the photo a little
          // to fill the height, so ask for 60vw (sharp, but not the full 4K file).
          sizes="(min-width: 1024px) 60vw, 100vw"
          quality={70}
          loading={eager ? "eager" : "lazy"}
          fetchPriority={eager ? "high" : undefined}
          className="object-cover"
          style={"focus" in p ? { objectPosition: p.focus } : undefined}
        />
      </div>
      <div className={cx("px-4 py-10 sm:px-6 sm:py-14 lg:flex lg:items-center lg:py-20", gutter[side])}>
        <div className="w-full max-w-[38rem]">{children}</div>
      </div>
    </section>
  );
}
