import { Icon, cx, type IconName } from "@/components/ui";
import { t } from "@/lib/i18n";

const pr = t.common.promises;

type PromiseKey = keyof typeof pr.items;

const ICONS: Record<PromiseKey, IconName> = {
  payAfter: "receipt",
  allIn: "check-circle",
  noUpsell: "lock",
  checked: "badge-check",
  deduction: "shield",
};

const ORDER: readonly PromiseKey[] = ["payAfter", "allIn", "noUpsell", "checked", "deduction"];

export interface PromisesProps {
  headingLevel?: 2 | 3;
  /** One column, for the narrow flow and quote pages. */
  compact?: boolean;
  /** Text on deep green (homepage band). */
  onDark?: boolean;
  className?: string;
}

/** "Våra löften till dig": pay after the job, all-in price, no upselling, checked firms, deduction guarantee. */
export function Promises({ headingLevel = 2, compact = false, onDark = false, className }: PromisesProps) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const ItemHeading = headingLevel === 2 ? "h3" : "h4";
  return (
    <section aria-labelledby="vara-loften" className={cx("space-y-4", className)}>
      <div className="space-y-1">
        <Heading id="vara-loften" className={cx("text-xl font-bold sm:text-2xl", onDark ? "text-on-brand" : "text-ink")}>
          {pr.title}
        </Heading>
        <p className={onDark ? "text-on-brand" : "text-muted"}>{pr.lead}</p>
      </div>
      <ul className={cx("grid gap-4", !compact && "sm:grid-cols-2 lg:grid-cols-3")}>
        {ORDER.map((key) => (
          <li
            key={key}
            className={cx(
              "flex gap-3 rounded-card border p-4",
              onDark ? "border-on-brand/30 bg-on-brand/10" : "border-border bg-surface",
            )}
          >
            <Icon name={ICONS[key]} size={28} className={cx("mt-0.5 shrink-0", onDark ? "text-on-brand" : "text-accent")} />
            <div className="min-w-0 space-y-1">
              <ItemHeading className={cx("text-lg font-bold", onDark ? "text-on-brand" : "text-ink")}>
                {pr.items[key].title}
              </ItemHeading>
              <p className={onDark ? "text-on-brand" : "text-ink"}>{pr.items[key].body}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
