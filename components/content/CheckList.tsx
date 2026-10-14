import type { ReactNode } from "react";
import { Icon, cx } from "@/components/ui";

export interface CheckListProps {
  items: readonly ReactNode[];
  className?: string;
}

/** Bulleted list with green check marks (benefits, "så arbetar vi"). */
export function CheckList({ items, className }: CheckListProps) {
  return (
    <ul className={cx("space-y-3", className)}>
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3">
          <Icon name="check-circle" size={24} className="mt-0.5 shrink-0 text-success" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
