import { cx } from "@/components/ui/cx";

/** The rising zigzag arrow from the logo, in emerald. Decoration only. */
export function RisingArrow({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 90"
      aria-hidden="true"
      focusable="false"
      className={cx("pointer-events-none text-accent", className)}
    >
      <polyline
        points="6,82 78,22 120,62 214,12"
        fill="none"
        stroke="currentColor"
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polygon points="236,2 198,4 222,34" fill="currentColor" />
    </svg>
  );
}
