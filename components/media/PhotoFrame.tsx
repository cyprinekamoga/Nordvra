import Image from "next/image";
import type { ReactNode } from "react";
import { cx } from "@/components/ui/cx";
import { photos, type PhotoKey } from "@/lib/content/photos";

/** rounded = card corners; square = straight editorial edges. Styles live in app/globals.css. */
export type FrameShape = "rounded" | "square";

export interface PhotoFrameProps {
  photo: PhotoKey;
  shape?: FrameShape;
  /** Tailwind aspect-ratio class for the frame, e.g. "aspect-[4/5]". */
  aspect?: string;
  /** Rendered width hint for the srcset, e.g. "(min-width: 1024px) 34rem, 100vw". */
  sizes: string;
  /** The text next to it already says everything: hide the photo from screen readers. */
  decorative?: boolean;
  /** Above the fold: fetch it first instead of lazily. */
  eager?: boolean;
  /** Fade and lift in as it scrolls into view (skipped with reduced motion). */
  reveal?: boolean;
  className?: string;
  imageClassName?: string;
  /** Overlays (chips, arrows); placed above the photo and outside the clip. */
  children?: ReactNode;
}

/** A photo from lib/content/photos in one of the brand frames. Works in server and client components. */
export function PhotoFrame({
  photo,
  shape = "rounded",
  aspect = "aspect-[4/3]",
  sizes,
  decorative = false,
  eager = false,
  reveal = false,
  className,
  imageClassName,
  children,
}: PhotoFrameProps) {
  const p = photos[photo];
  return (
    <div className={cx("frame", `frame-${shape}`, aspect, "w-full max-w-full", reveal && "reveal", className)}>
      <div className="frame-clip">
        <Image
          quality={85}
          src={p.src}
          alt={decorative ? "" : p.alt}
          fill
          sizes={sizes}
          loading={eager ? "eager" : "lazy"}
          fetchPriority={eager ? "high" : undefined}
          className={cx("object-cover", imageClassName)}
          style={"focus" in p ? { objectPosition: p.focus } : undefined}
        />
      </div>
      {children}
    </div>
  );
}
