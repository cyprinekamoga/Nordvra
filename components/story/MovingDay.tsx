"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import { PhotoFrame } from "@/components/media/PhotoFrame";
import { cx } from "@/components/ui/cx";
import type { PhotoKey } from "@/lib/content/photos";

export interface DayChapter {
  time: string;
  title: string;
  body: string;
  photo: PhotoKey;
}

export interface MovingDayProps {
  /** Accessible name of the tab list. */
  label: string;
  chapters: readonly DayChapter[];
}

/**
 * One example day told in chapters: a row of times works as tabs (arrow keys, Home, End), the
 * panel shows that chapter's photo and text. The first chapter is in the server HTML.
 */
export function MovingDay({ label, chapters }: MovingDayProps) {
  const id = useId();
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  function select(i: number, focus = false) {
    setActive(i);
    if (focus) tabs.current[i]?.focus();
  }

  function onKeyDown(e: KeyboardEvent, i: number) {
    const last = chapters.length - 1;
    const next = { ArrowRight: i === last ? 0 : i + 1, ArrowLeft: i === 0 ? last : i - 1, Home: 0, End: last }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    select(next, true);
  }

  return (
    <div className="space-y-6">
      <div className="relative">
        {/* The day's timeline: a line behind the three times, filled up to the open chapter. */}
        <div aria-hidden="true" className="absolute top-6 right-[16%] left-[16%] h-1 rounded-full bg-border">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-500 ease-out"
            style={{ width: `${(active / (chapters.length - 1)) * 100}%` }}
          />
        </div>
        <div role="tablist" aria-label={label} className="relative grid grid-cols-3 gap-2 sm:gap-4">
          {chapters.map((c, i) => {
            const selected = i === active;
            return (
              <button
                key={c.time}
                ref={(el) => {
                  tabs.current[i] = el;
                }}
                type="button"
                role="tab"
                id={`${id}-tab-${i}`}
                aria-controls={`${id}-panel-${i}`}
                aria-selected={selected}
                tabIndex={selected ? 0 : -1}
                onClick={() => select(i)}
                onKeyDown={(e) => onKeyDown(e, i)}
                className="group flex min-h-12 flex-col items-center gap-2 rounded-control px-1 pb-2 text-center"
              >
                <span
                  className={cx(
                    "flex h-12 min-w-20 items-center justify-center rounded-full border-2 px-3 text-lg font-extrabold tabular-nums transition-colors duration-300",
                    selected
                      ? "border-brand bg-brand text-on-brand"
                      : "border-brand bg-surface text-brand group-hover:bg-brand-soft",
                  )}
                >
                  {c.time}
                </span>
                <span className={cx("leading-snug", selected ? "font-bold text-ink" : "font-semibold text-muted")}>
                  {c.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {chapters.map((c, i) => (
        <div
          key={c.time}
          role="tabpanel"
          id={`${id}-panel-${i}`}
          aria-labelledby={`${id}-tab-${i}`}
          tabIndex={0}
          hidden={i !== active}
          className={cx("items-center gap-6 rounded-card md:grid-cols-2 md:gap-10", i === active ? "fade-in grid" : "hidden")}
        >
          <PhotoFrame photo={c.photo} shape="arch" decorative sizes="(min-width: 768px) 34rem, 100vw" />
          <div className="space-y-3">
            <p className="text-lg font-extrabold text-brand tabular-nums">{c.time}</p>
            <h3 className="text-2xl text-ink">{c.title}</h3>
            <p className="text-lg">{c.body}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
