"use client";

import { useEffect, useRef, useState } from "react";
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
  /** Accessible name of the timeline navigation. */
  label: string;
  chapters: readonly DayChapter[];
}

/**
 * One example day told as scrollytelling. Desktop: the timeline (08:00 → 13:00 → 17:00) and the
 * chapter's photo stay in view while the chapters scroll past; the line fills and the photo
 * changes as each chapter reaches the middle of the screen, and the times link to their chapter.
 * Phones: a row of chapter cards to swipe through, each with its own photo; small tablets: the
 * chapters follow each other. All text is in
 * the server HTML; with reduced motion nothing animates.
 */
export function MovingDay({ label, chapters }: MovingDayProps) {
  const [active, setActive] = useState(0);
  const items = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    // A chapter becomes active when it crosses a thin band in the middle of the screen.
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

  // Readable anchors (#flyttdag-1 …); there is one moving day per page.
  const chapterId = (i: number) => `flyttdag-${i + 1}`;

  return (
    <div className="md:grid md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:gap-12">
      <div className="hidden md:block">
        <div className="sticky top-[10vh] space-y-6">
          <nav aria-label={label} className="relative">
            {/* The day's timeline: a line behind the three times, filled up to the current chapter. */}
            <div aria-hidden="true" className="absolute top-6 right-[16%] left-[16%] h-1 rounded-full bg-border">
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-500 ease-out"
                style={{ width: `${(active / (chapters.length - 1)) * 100}%` }}
              />
            </div>
            <ol className="relative grid grid-cols-3 gap-2">
              {chapters.map((c, i) => {
                const current = i === active;
                return (
                  <li key={c.time}>
                    <a
                      href={`#${chapterId(i)}`}
                      aria-current={current ? "step" : undefined}
                      className="group flex min-h-12 flex-col items-center gap-2 rounded-control px-1 pb-2 text-center"
                    >
                      <span
                        className={cx(
                          "flex h-12 min-w-20 items-center justify-center rounded-full border-2 px-3 text-lg font-extrabold tabular-nums transition-colors duration-300",
                          current
                            ? "border-brand bg-brand text-on-brand"
                            : "border-brand bg-surface text-brand group-hover:bg-brand-soft",
                        )}
                      >
                        {c.time}
                      </span>
                      <span className={cx("leading-snug", current ? "font-bold text-ink" : "font-semibold text-muted")}>
                        {c.title}
                      </span>
                    </a>
                  </li>
                );
              })}
            </ol>
          </nav>

          {/* The photos lie on top of each other and cross-fade; the chapter text says what they show. */}
          <div className="relative aspect-[4/3]" aria-hidden="true">
            {chapters.map((c, i) => (
              <div
                key={c.time}
                className={cx(
                  "absolute inset-0 transition-opacity duration-700 ease-out",
                  i === active ? "opacity-100" : "opacity-0",
                )}
              >
                <PhotoFrame
                  photo={c.photo}
                  shape="square"
                  aspect="aspect-[4/3]"
                  decorative
                  sizes="(min-width: 1296px) 42rem, (min-width: 768px) 52vw, 100vw"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Focusable so the swipe row can be scrolled with the keyboard too. */}
      <ol tabIndex={0} aria-label={label} className="swipe-row sm:max-md:space-y-12">
        {chapters.map((c, i) => (
          <li
            key={c.time}
            id={chapterId(i)}
            ref={(el) => {
              items.current[i] = el;
            }}
            data-index={i}
            className="swipe-card relative scroll-mt-[30vh] md:flex md:min-h-[60vh] md:items-center"
          >
            <div className="pb-4 md:hidden">
              <PhotoFrame
                photo={c.photo}
                shape="square"
                aspect="aspect-[3/2]"
                decorative
                sizes="(min-width: 640px) 100vw, 82vw"
              />
            </div>
            <div
              className={cx(
                "min-w-0 space-y-2 transition-colors sm:space-y-3 duration-300 md:border-l-4 md:py-2 md:pl-8",
                active === i ? "md:border-accent" : "md:border-border",
              )}
            >
              <p className="relative z-10 inline-flex h-10 min-w-16 items-center justify-center rounded-full border-2 border-brand bg-brand px-3 font-extrabold text-on-brand tabular-nums sm:h-12 sm:min-w-20 sm:text-lg md:h-auto md:min-w-0 md:justify-start md:border-0 md:bg-transparent md:px-0 md:text-brand">
                {c.time}
              </p>
              <h3 className="text-xl text-ink sm:text-2xl">{c.title}</h3>
              <p className="sm:text-lg">{c.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
