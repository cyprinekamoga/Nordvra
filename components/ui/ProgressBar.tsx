import { useId } from "react";
import { fmt, t } from "@/lib/i18n";
import { cx } from "./cx";

export interface ProgressBarProps {
  /** Current step, 1-based. */
  step: number;
  total: number;
  /** Override the text (default "Steg {step} av {total}"). */
  label?: string;
  className?: string;
}

/** "Steg 3 av 8" with a bar. Exposed as a progressbar with the same text as `aria-valuetext`. */
export function ProgressBar({ step, total, label, className }: ProgressBarProps) {
  const id = useId();
  const safeTotal = Math.max(1, total);
  const current = Math.min(Math.max(step, 0), safeTotal);
  const text = label ?? fmt(t.common.progress.step, { step: current, total: safeTotal });
  const percent = Math.round((current / safeTotal) * 100);
  return (
    <div className={cx("w-full", className)}>
      <p id={id} className="mb-2 font-semibold text-muted">
        {text}
      </p>
      <div
        role="progressbar"
        aria-labelledby={id}
        aria-valuemin={0}
        aria-valuemax={safeTotal}
        aria-valuenow={current}
        aria-valuetext={text}
        className="h-3 w-full overflow-hidden rounded-full border border-control bg-surface"
      >
        <div className="h-full rounded-full bg-brand transition-[width] duration-300" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
