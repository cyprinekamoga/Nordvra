"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { PhotoChip } from "@/components/media/PhotoChip";
import { PhotoFrame } from "@/components/media/PhotoFrame";
import { Icon } from "@/components/ui/Icon";
import { cx } from "@/components/ui/cx";
import { fmt } from "@/lib/i18n";
import type { PhotoKey } from "@/lib/content/photos";

export interface StoryStep {
  title: string;
  body: string;
  photo: PhotoKey;
}

export interface StepsStoryProps {
  /** Exactly three steps: they sit on the three corners of the logo's zigzag. */
  steps: readonly StoryStep[];
  /** "Steg {n}", read before each step title. */
  stepLabel: string;
  /** Overlay texts per step (decoration: the step text says the same thing). */
  visual: {
    chips: readonly string[];
    priceLabel: string;
    /** Price card text with the amount, e.g. ["Du betalar ", "4 200 kr"]. */
    pricePay: readonly [string, string];
    quote: string;
    invoice: string;
  };
}

/*
 * The logo's zigzag in a 300 × 110 box: foot A, then one corner per step (peak, valley, arrow).
 * The line draws from A to the active step's corner; the arrowhead lights up at the last step.
 */
const POINTS = [
  [14, 98],
  [98, 26],
  [166, 72],
  [262, 20],
] as const;
const PATH = "M" + POINTS.map((p) => p.join(",")).join(" L");
const CUMULATIVE = POINTS.slice(1).reduce<number[]>((acc, p, i) => {
  const prev = POINTS[i];
  acc.push((acc.at(-1) ?? 0) + Math.hypot(p[0] - prev[0], p[1] - prev[1]));
  return acc;
}, []);
const TOTAL = CUMULATIVE.at(-1)!;
const ARROW = (() => {
  const [c, d] = [POINTS[2], POINTS[3]];
  const len = Math.hypot(d[0] - c[0], d[1] - c[1]);
  const [ux, uy] = [(d[0] - c[0]) / len, (d[1] - c[1]) / len];
  const base = [d[0] + ux * 16, d[1] + uy * 16];
  const tip = [d[0] + ux * 34, d[1] + uy * 34];
  // Perpendicular (-uy, ux), half-width 9.
  const left = [base[0] - uy * 9, base[1] + ux * 9];
  const right = [base[0] + uy * 9, base[1] - ux * 9];
  return [tip, left, right].map((p) => p.map((v) => v.toFixed(1)).join(",")).join(" ");
})();

function Zigzag({ active }: { active: number }) {
  return (
    <svg viewBox="0 0 300 110" className="w-full overflow-visible" aria-hidden="true" focusable="false">
      <path d={PATH} fill="none" className="stroke-border" strokeWidth="3" strokeDasharray="2 8" strokeLinecap="round" />
      <path
        d={PATH}
        fill="none"
        className="stroke-accent transition-[stroke-dashoffset] duration-700 ease-out"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={TOTAL}
        strokeDashoffset={TOTAL - CUMULATIVE[active]}
      />
      <polygon
        points={ARROW}
        className={cx("transition-colors duration-500", active === POINTS.length - 2 ? "fill-accent" : "fill-border")}
      />
      {POINTS.slice(1).map(([x, y], i) => {
        const reached = i <= active;
        return (
          <g key={i}>
            <circle
              cx={x}
              cy={y}
              r="13"
              strokeWidth="3"
              className={cx("stroke-brand transition-colors duration-500", reached ? "fill-brand" : "fill-surface")}
            />
            <text
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="13"
              fontWeight="800"
              className={cx("transition-colors duration-500", reached ? "fill-on-brand" : "fill-brand")}
            >
              {i + 1}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function Overlay({ index, visual }: { index: number; visual: StepsStoryProps["visual"] }) {
  if (index === 0) {
    return (
      <ul className="absolute right-3 bottom-3 left-3 z-10 flex flex-wrap gap-2">
        {visual.chips.map((chip, i) => (
          <li
            key={chip}
            className={cx(
              "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 font-semibold shadow-raised",
              i === 0 ? "bg-brand text-on-brand" : "bg-surface text-ink",
            )}
          >
            {i === 0 ? <Icon name="check" size={18} /> : null}
            {chip}
          </li>
        ))}
      </ul>
    );
  }
  if (index === 1) {
    return (
      <PhotoChip label={visual.priceLabel} className="absolute bottom-3 left-3">
        {visual.pricePay[0]}
        <span className="price text-brand">{visual.pricePay[1]}</span>
      </PhotoChip>
    );
  }
  return (
    <div className="absolute bottom-3 left-3 z-10 flex max-w-[calc(100%-1.5rem)] flex-col items-start gap-2">
      <PhotoChip icon="clock">{visual.quote}</PhotoChip>
      <PhotoChip icon="receipt">{visual.invoice}</PhotoChip>
    </div>
  );
}

/**
 * "Så enkelt är det" as scrollytelling. Desktop: the steps scroll past a sticky photo that
 * swaps per step while the logo's zigzag draws up to the current step. Phones: each step shows
 * its own photo, which fades in as it scrolls into view. All text is in the server HTML.
 */
export function StepsStory({ steps, stepLabel, visual }: StepsStoryProps): ReactNode {
  const [active, setActive] = useState(0);
  const items = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    // A step becomes active when it crosses a thin band in the middle of the screen.
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.index));
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    items.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-14">
      <ol className="relative space-y-6 lg:space-y-0">
        {steps.map((step, i) => (
          <li
            key={step.title}
            ref={(el) => {
              items.current[i] = el;
            }}
            data-index={i}
            className="lg:flex lg:min-h-[70vh] lg:items-center"
          >
            {/* Phones: every step is a card. Desktop: only the step beside the sticky photo is. */}
            <div
              className={cx(
                "w-full space-y-3 rounded-card border border-border bg-surface p-5 shadow-card transition-colors duration-300 sm:p-6",
                active !== i && "lg:border-transparent lg:bg-transparent lg:shadow-none",
              )}
            >
              <span
                aria-hidden="true"
                className={cx(
                  "flex size-12 items-center justify-center rounded-full border-2 border-brand bg-brand text-xl font-extrabold text-on-brand transition-colors duration-300",
                  active !== i && "lg:bg-surface lg:text-brand",
                )}
              >
                {i + 1}
              </span>
              <h3 className="text-2xl text-ink">
                <span className="sr-only">{fmt(stepLabel, { n: i + 1 })}: </span>
                {step.title}
              </h3>
              <p className="text-lg">{step.body}</p>
              <div className="pt-2 lg:hidden" aria-hidden="true">
                <PhotoFrame photo={step.photo} aspect="aspect-[5/4]" decorative reveal sizes="(min-width: 640px) 40rem, 100vw">
                  <Overlay index={i} visual={visual} />
                </PhotoFrame>
              </div>
            </div>
          </li>
        ))}
      </ol>

      <div className="hidden lg:block" aria-hidden="true">
        <div className="sticky top-8 space-y-6 pt-[6vh]">
          <div className="mx-auto w-3/5">
            <Zigzag active={active} />
          </div>
          <div className="relative aspect-[4/3]">
            {steps.map((step, i) => (
              <PhotoFrame
                key={step.photo}
                photo={step.photo}
                decorative
                aspect=""
                sizes="(min-width: 1296px) 40rem, 50vw"
                className={cx(
                  "absolute inset-0 transition-[opacity,transform] duration-700 ease-out",
                  active === i ? "scale-100 opacity-100" : "pointer-events-none scale-[1.03] opacity-0",
                )}
              >
                <Overlay index={i} visual={visual} />
              </PhotoFrame>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
