import type { WeekBucket } from "@/lib/admin/stats";

/**
 * Bookings per week as a simple bar chart. One series, so a single brand colour; each bar is
 * labelled with its value, and the same numbers are in a data table for screen readers.
 */
export function WeeklyChart({ weeks }: { weeks: WeekBucket[] }) {
  const max = Math.max(1, ...weeks.map((w) => w.count));
  const barWidth = 100 / weeks.length;
  return (
    <figure>
      <svg
        viewBox="0 0 100 60"
        preserveAspectRatio="none"
        className="h-48 w-full"
        role="img"
        aria-label={`Förfrågningar per vecka, de senaste ${weeks.length} veckorna. Högst ${max} på en vecka.`}
      >
        <line x1="0" y1="50" x2="100" y2="50" stroke="var(--color-border)" strokeWidth="0.3" />
        {weeks.map((w, i) => {
          const h = (w.count / max) * 44;
          const x = i * barWidth + barWidth * 0.15;
          return (
            <g key={w.weekStart}>
              <rect x={x} y={50 - h} width={barWidth * 0.7} height={h} rx="0.8" fill="var(--color-brand)" />
            </g>
          );
        })}
      </svg>
      <div className="grid text-center text-xs tabular-nums" style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))` }}>
        {weeks.map((w) => (
          <div key={w.weekStart} aria-hidden="true">
            <div className="font-bold">{w.count}</div>
            <div className="text-muted">{w.label.replace("v. ", "")}</div>
          </div>
        ))}
      </div>
      <figcaption className="mt-2 text-sm text-muted">Veckonummer. Antal förfrågningar ovanför.</figcaption>
      <table className="sr-only">
        <caption>Förfrågningar per vecka</caption>
        <thead>
          <tr>
            <th scope="col">Vecka (måndag)</th>
            <th scope="col">Antal</th>
          </tr>
        </thead>
        <tbody>
          {weeks.map((w) => (
            <tr key={w.weekStart}>
              <td>
                {w.label} ({w.weekStart})
              </td>
              <td>{w.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
