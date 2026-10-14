import { Card, Icon, cx } from "@/components/ui";

export interface TocItem {
  /** Anchor id on this page (without "#"). */
  id: string;
  label: string;
}

export interface TableOfContentsProps {
  label: string;
  items: readonly TocItem[];
  /** Number the entries (legal documents already number their headings). */
  ordered?: boolean;
  className?: string;
}

/** "På den här sidan" – in-page links to the sections below. */
export function TableOfContents({ label, items, ordered = false, className }: TableOfContentsProps) {
  const labelId = "innehall-pa-sidan";
  const List = ordered ? "ol" : "ul";
  return (
    <Card tone="muted" padding="md" className={cx("my-6", className)}>
      <nav aria-labelledby={labelId}>
        <p id={labelId} className="mb-1 text-lg font-bold">
          {label}
        </p>
        <List className="grid gap-x-6 sm:grid-cols-2">
          {items.map((item) => (
            <li key={item.id}>
              <a href={`#${item.id}`} className="link inline-flex min-h-12 items-center gap-2 py-1">
                <Icon name="chevron-right" className="shrink-0" />
                <span>{item.label}</span>
              </a>
            </li>
          ))}
        </List>
      </nav>
    </Card>
  );
}
