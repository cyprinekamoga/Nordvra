import Image from "next/image";
import type { ComponentPropsWithRef, ReactNode } from "react";
import { photos, type PhotoKey } from "@/lib/content/photos";
import type { DeductionType } from "@/lib/taxRules";
import { cx } from "./cx";
import { DeductionBadge } from "./DeductionBadge";
import { Icon, type IconName } from "./Icon";

export interface TileProps extends Omit<ComponentPropsWithRef<"button">, "title"> {
  /** Main text, e.g. "Städning". */
  title: ReactNode;
  /** Icon key, e.g. a category's `icon` ("sparkles"). Ignored when `photo` is set. */
  icon?: IconName | (string & {});
  /** A photo of the work instead of the icon (decorative: the title says what it is). */
  photo?: PhotoKey;
  /** Renders a DeductionBadge ("RUT 50 %"/"ROT 30 %"). */
  deduction?: DeductionType;
  /** Any other badge content (rendered after the deduction badge). */
  badge?: ReactNode;
  /** Optional short description under the title. */
  description?: ReactNode;
  /** Marks the tile as chosen (`aria-pressed`) – use when the tile stays on screen after a click. */
  selected?: boolean;
}

/**
 * Large choice button with icon, title, badge and optional description (e.g. category and
 * service pickers). Renders a native `<button type="button">`; pass `onClick` from a client
 * component.
 */
export function Tile({
  title,
  icon,
  photo,
  deduction,
  badge,
  description,
  selected,
  className,
  type = "button",
  ...rest
}: TileProps) {
  if (photo) {
    return (
      <PhotoTile
        title={title}
        photo={photo}
        deduction={deduction}
        badge={badge}
        description={description}
        selected={selected}
        className={className}
        type={type}
        {...rest}
      />
    );
  }
  return (
    <button
      type={type}
      aria-pressed={selected === undefined ? undefined : selected}
      className={cx(
        "group flex min-h-24 w-full flex-col items-start gap-2 rounded-card border-2 p-4 text-left transition-colors duration-150",
        "border-control bg-surface text-ink shadow-card hover:border-brand hover:bg-brand-soft",
        "aria-pressed:border-brand aria-pressed:bg-brand-soft",
        "disabled:cursor-not-allowed disabled:border-border disabled:text-disabled disabled:shadow-none",
        className,
      )}
      {...rest}
    >
      {/* Title first in the DOM so the accessible name starts with it; the icon/badge row is shown above via `order-first`. */}
      <span className="text-lg leading-snug font-bold">{title}</span>
      {description ? <span className="text-base text-muted">{description}</span> : null}
      <span className="order-first flex w-full items-start justify-between gap-3">
        {icon ? (
          <span className="relative flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand group-aria-pressed:bg-brand group-aria-pressed:text-on-brand">
            <Icon name={icon} size={26} />
            {selected ? (
              <span className="absolute -right-1.5 -bottom-1.5 flex size-6 items-center justify-center rounded-full border-2 border-brand bg-surface text-brand">
                <Icon name="check" size={14} strokeWidth={3} />
              </span>
            ) : null}
          </span>
        ) : selected ? (
          <span className="flex size-7 items-center justify-center rounded-full bg-brand text-on-brand">
            <Icon name="check" size={18} />
          </span>
        ) : null}
        {deduction || badge ? (
          <span className="flex flex-wrap justify-end gap-1">
            {deduction ? <DeductionBadge type={deduction} size="sm" /> : null}
            {badge}
          </span>
        ) : null}
      </span>
    </button>
  );
}

/**
 * Tile with a photo of the work: photo on the left on phones (keeps the list short), on top from
 * sm. The selected tile gets a check on the photo and the brand border.
 */
function PhotoTile({
  title,
  photo,
  deduction,
  badge,
  description,
  selected,
  className,
  type,
  ...rest
}: Omit<TileProps, "icon"> & { photo: PhotoKey }) {
  const p = photos[photo];
  return (
    <button
      type={type}
      aria-pressed={selected === undefined ? undefined : selected}
      className={cx(
        "group flex w-full overflow-hidden rounded-card border-2 text-left transition-colors duration-150 sm:flex-col",
        "border-control bg-surface text-ink shadow-card hover:border-brand hover:bg-brand-soft",
        "aria-pressed:border-brand aria-pressed:bg-brand-soft",
        "disabled:cursor-not-allowed disabled:border-border disabled:text-disabled disabled:shadow-none",
        className,
      )}
      {...rest}
    >
      {/* Text first in the DOM so the accessible name starts with the title; the photo is shown first. */}
      <span className="flex min-w-0 flex-1 flex-col items-start justify-center gap-2 p-4">
        <span className="text-lg leading-snug font-bold">{title}</span>
        {description ? <span className="text-base text-muted">{description}</span> : null}
        {deduction || badge ? (
          <span className="flex flex-wrap gap-1">
            {deduction ? <DeductionBadge type={deduction} size="sm" /> : null}
            {badge}
          </span>
        ) : null}
      </span>
      <span className="relative order-first block w-[7.5rem] shrink-0 self-stretch overflow-hidden bg-surface-muted sm:aspect-[16/9] sm:w-full">
        <Image
          quality={85}
          src={p.src}
          alt=""
          fill
          sizes="(min-width: 640px) 22rem, 8rem"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          style={"focus" in p ? { objectPosition: p.focus } : undefined}
        />
        {selected ? (
          <span className="absolute top-2 left-2 flex size-8 items-center justify-center rounded-full border-2 border-on-brand bg-brand text-on-brand">
            <Icon name="check" size={18} strokeWidth={3} />
          </span>
        ) : null}
      </span>
    </button>
  );
}
