"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { cx } from "@/components/ui/cx";
import { fmt } from "@/lib/i18n";

export interface StoryStep {
  title: string;
  body: string;
}

export interface StepsStoryProps {
  /** Exactly three steps: they sit on the three corners of the logo's zigzag. */
  steps: readonly StoryStep[];
  /** "Steg {n}", read before each step title. */
  stepLabel: string;
  /** Texts for the small booking-form cards beside the steps (decoration: the step text says it). */
  visual: {
    chipsTitle: string;
    chips: readonly string[];
    priceLabel: string;
    /** e.g. ["Du betalar ", "2 800 kr"] */
    pricePay: readonly [string, string];
    priceNote: string;
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

/** Drawn for the deep-green (forest) background. */
function Zigzag({ active }: { active: number }) {
  return (
    <svg viewBox="0 0 300 110" className="w-full overflow-visible" aria-hidden="true" focusable="false">
      <path d={PATH} fill="none" className="stroke-white/30" strokeWidth="3" strokeDasharray="2 8" strokeLinecap="round" />
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
        className={cx("transition-colors duration-500", active === POINTS.length - 2 ? "fill-accent" : "fill-white/30")}
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
              className={cx("transition-colors duration-500", reached ? "fill-on-brand stroke-on-brand" : "fill-forest stroke-white/70")}
            />
            <text
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="13"
              fontWeight="800"
              className={cx("transition-colors duration-500", reached ? "fill-brand" : "fill-on-brand")}
            >
              {i + 1}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** A small white card showing what the step looks like in the booking form. */
function StepCard({ index, visual }: { index: number; visual: StepsStoryProps["visual"] }) {
  const shell = "rounded-card bg-surface p-5 text-ink shadow-raised";
  if (index === 0) {
    return (
      <div className={shell}>
        <p className="mb-3 font-bold">{visual.chipsTitle}</p>
        <ul className="flex flex-wrap gap-2">
          {visual.chips.map((chip, i) => (
            <li
              key={chip}
              className={cx(
                "inline-flex items-center gap-1.5 rounded-control border-2 px-4 py-2 font-semibold",
                i === 0 ? "border-brand bg-brand text-on-brand" : "border-control bg-surface text-ink",
              )}
            >
              {i === 0 ? <Icon name="check" size={18} /> : null}
              {chip}
            </li>
          ))}
        </ul>
      </div>
    );
  }
  if (index === 1) {
    return (
      <div className={shell}>
        <p className="text-muted">{visual.priceLabel}</p>
        <p className="text-2xl font-bold">
          {visual.pricePay[0]}
          <span className="price text-brand">{visual.pricePay[1]}</span>
        </p>
        <p className="text-muted">{visual.priceNote}</p>
      </div>
    );
  }
  return (
    <ul className={cx(shell, "space-y-3")}>
      {[
        { icon: "clock" as const, text: visual.quote },
        { icon: "receipt" as const, text: visual.invoice },
      ].map((row) => (
        <li key={row.text} className="flex items-center gap-3 font-semibold">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
            <Icon name={row.icon} />
          </span>
          {row.text}
          <Icon name="check-circle" className="ml-auto text-accent" />
        </li>
      ))}
    </ul>
  );
}

/**
 * "Så enkelt är det" as scrollytelling on a deep-green band. Desktop: the steps scroll past a
 * sticky panel where the logo's zigzag draws up to the current step and a booking-form card shows
 * that step. Phones: each step shows its own card, joined by a line. All text is in the server
 * HTML; with reduced motion nothing animates.
 */
export function StepsStory({ steps, stepLabel, visual }: StepsStoryProps) {
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
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-16">
      <ol className="relative space-y-8 sm:space-y-10 before:absolute before:top-6 before:bottom-6 before:left-[1.4375rem] before:w-0.5 before:bg-white/25 lg:space-y-0 lg:before:hidden">
        {steps.map((step, i) => (
          <li
            key={step.title}
            ref={(el) => {
              items.current[i] = el;
            }}
            data-index={i}
            className="relative grid grid-cols-[3rem_minmax(0,1fr)] gap-x-5 lg:flex lg:min-h-[60vh] lg:items-center"
          >
            <span
              aria-hidden="true"
              className={cx(
                "z-10 flex size-12 items-center justify-center rounded-full border-2 text-xl font-extrabold transition-colors duration-300 lg:hidden",
                "border-on-brand bg-on-brand text-brand",
              )}
            >
              {i + 1}
            </span>
            <div
              className={cx(
                "min-w-0 space-y-3 transition-colors duration-300 lg:border-l-4 lg:py-2 lg:pl-8",
                active === i ? "lg:border-accent" : "lg:border-white/20",
              )}
            >
              <p aria-hidden="true" className="text-base font-bold tracking-[0.06em] text-forest-text uppercase">
                {fmt(stepLabel, { n: i + 1 })}
              </p>
              <h3 className="text-xl text-on-brand sm:text-3xl">
                <span className="sr-only">{fmt(stepLabel, { n: i + 1 })}: </span>
                {step.title}
              </h3>
              <p className="text-forest-text sm:text-lg">{step.body}</p>
              <div className="pt-3 lg:hidden" aria-hidden="true">
                <StepCard index={i} visual={visual} />
              </div>
            </div>
          </li>
        ))}
      </ol>

      <div className="hidden lg:block" aria-hidden="true">
        <div className="sticky top-[20vh] space-y-10">
          <Zigzag active={active} />
          <div className="relative min-h-44">
            {steps.map((step, i) => (
              <div
                key={step.title}
                className={cx(
                  "absolute inset-x-0 top-0 transition-[opacity,transform] duration-500 ease-out",
                  active === i ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0",
                )}
              >
                <StepCard index={i} visual={visual} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
