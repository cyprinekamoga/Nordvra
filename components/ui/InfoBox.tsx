import type { ReactNode } from "react";
import { cx } from "./cx";
import { Icon, type IconName } from "./Icon";

export type InfoBoxTone = "info" | "warning" | "legal" | "success" | "danger";

export interface InfoBoxProps {
  /** info = blue, warning = amber, legal = calm violet (legal texts, never small print), success, danger. */
  tone?: InfoBoxTone;
  /** Bold title, e.g. "Avdraget är inte garanterat". */
  title?: ReactNode;
  /** Render the title as a heading of this level (default: a bold paragraph, not a heading). */
  headingLevel?: 2 | 3 | 4;
  /** Override the tone's default icon. */
  icon?: IconName;
  children?: ReactNode;
  id?: string;
  className?: string;
}

const tones: Record<InfoBoxTone, { box: string; title: string; icon: IconName }> = {
  info: { box: "bg-info-soft border-info", title: "text-info", icon: "info" },
  warning: { box: "bg-warning-soft border-warning-border", title: "text-warning", icon: "warning" },
  legal: { box: "bg-legal-soft border-legal", title: "text-legal", icon: "scale" },
  success: { box: "bg-success-soft border-success", title: "text-success", icon: "check-circle" },
  danger: { box: "bg-danger-soft border-danger", title: "text-danger", icon: "alert" },
};

/** Plain-language info box with a coloured left edge, icon, optional title and body text. */
export function InfoBox({
  tone = "info",
  title,
  headingLevel,
  icon,
  children,
  id,
  className,
}: InfoBoxProps) {
  const style = tones[tone];
  const Title = headingLevel ? (`h${headingLevel}` as const) : "p";
  return (
    <div
      id={id}
      className={cx("flex gap-3 rounded-card border-l-[6px] p-4 text-ink", style.box, className)}
    >
      <Icon name={icon ?? style.icon} size={24} className={cx("mt-0.5", style.title)} />
      <div className="min-w-0 flex-1 space-y-2">
        {title ? <Title className={cx("text-lg leading-snug font-bold", style.title)}>{title}</Title> : null}
        {children ? <div className="space-y-2">{children}</div> : null}
      </div>
    </div>
  );
}
