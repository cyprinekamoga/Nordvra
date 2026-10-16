import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui/Icon";
import { cx } from "@/components/ui/cx";

export interface PhotoChipProps {
  /** Small line on top, e.g. "Flyttstäd 60 m²". */
  label?: ReactNode;
  children: ReactNode;
  icon?: IconName;
  className?: string;
}

/** White card laid over a photo, e.g. a price or a status. Position it with className or a wrapper. */
export function PhotoChip({ label, children, icon = "check-circle", className }: PhotoChipProps) {
  return (
    <div className={cx("z-10 max-w-full rounded-control bg-surface px-4 py-3 shadow-raised", className)}>
      {label ? <p className="text-base text-muted">{label}</p> : null}
      <p className="flex items-center gap-2 font-semibold text-ink">
        <Icon name={icon} className="shrink-0 text-accent" />
        <span>{children}</span>
      </p>
    </div>
  );
}
