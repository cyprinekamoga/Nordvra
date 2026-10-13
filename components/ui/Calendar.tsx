"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { fmt, t } from "@/lib/i18n";
import {
  addDays,
  addMonths,
  addYears,
  clampIso,
  endOfWeek,
  formatDayLabel,
  formatMonthTitle,
  isIsoDate,
  isSameMonth,
  isWithinRange,
  monthMatrix,
  startOfMonth,
  startOfWeek,
  WEEKDAYS,
} from "./calendar-utils";
import { cx } from "./cx";
import { FieldError } from "./FieldError";
import { Icon } from "./Icon";

export interface CalendarProps {
  /** Chosen date "YYYY-MM-DD", or null/undefined. */
  value: string | null | undefined;
  /** Called with "YYYY-MM-DD" when the user picks an available day. */
  onChange: (value: string) => void;
  /**
   * First selectable day "YYYY-MM-DD" (e.g. tomorrow). Required: the calendar never reads the
   * current time itself (that would break prerendering). Compute it with `stockholmDate(new Date())`
   * after mount, or on the server after `await connection()`.
   */
  min: string;
  /** Last selectable day "YYYY-MM-DD" (e.g. `addMonths(today, 6)`). */
  max?: string;
  /** Extra rule for unavailable days inside [min, max]. They stay focusable but can't be chosen. */
  isDateDisabled?: (iso: string) => boolean;
  /** Accessible name of the calendar, e.g. "Välj datum". Visible unless `hideLabel`. */
  label: string;
  hideLabel?: boolean;
  /** Today's date "YYYY-MM-DD" to mark with `aria-current="date"` (optional). */
  today?: string;
  /** Show "Valt datum: …" under the calendar (default true). */
  showSelection?: boolean;
  /** Name for a hidden input carrying the value in `<form action>` submissions. */
  name?: string;
  error?: ReactNode;
  className?: string;
}

/**
 * Accessible month calendar (Swedish, weeks start on Monday). Keyboard: arrows move a day/week,
 * Home/End go to the start/end of the week, Page Up/Down change month (with Shift: year),
 * Enter/Space choose. Only one day is in the tab order (roving tabindex).
 * Needs about 336px of width for 48px day targets – don't add extra padding around it on mobile.
 */
export function Calendar({
  value,
  onChange,
  min,
  max,
  isDateDisabled,
  label,
  hideLabel = false,
  today,
  showSelection = true,
  name,
  error,
  className,
}: CalendarProps) {
  const id = useId();
  const labelId = `${id}-label`;
  const titleId = `${id}-title`;
  const instructionsId = `${id}-instructions`;
  const errorId = error ? `${id}-error` : undefined;

  const selected = isIsoDate(value) ? value : null;
  const initialFocus = clampIso(selected ?? min, min, max);

  const [focused, setFocused] = useState<string>(initialFocus);
  const [month, setMonth] = useState<string>(startOfMonth(initialFocus));
  const [prevValue, setPrevValue] = useState(selected);
  const moveFocus = useRef(false);
  const gridRef = useRef<HTMLTableElement>(null);

  // Follow a value set from outside (e.g. restored answers) – adjust state during render.
  if (selected !== prevValue) {
    setPrevValue(selected);
    if (selected) {
      setFocused(selected);
      setMonth(startOfMonth(selected));
    }
  }

  // Keep the visible month and focused day inside [min, max] even if the limits change.
  const firstMonth = startOfMonth(min);
  const lastMonth = max ? startOfMonth(max) : null;
  const visibleMonth = clampIso(month, firstMonth, lastMonth);
  const focusedDay = clampIso(focused, min, max);

  const isUnavailable = (iso: string) =>
    !isWithinRange(iso, min, max) || (isDateDisabled ? isDateDisabled(iso) : false);

  // Exactly one tabbable day: the focused one if it's in view, else the chosen one, else the first
  // day in range.
  const tabbable = isSameMonth(focusedDay, visibleMonth)
    ? focusedDay
    : selected && isSameMonth(selected, visibleMonth)
      ? selected
      : clampIso(visibleMonth, min, max);

  useEffect(() => {
    if (!moveFocus.current) return;
    moveFocus.current = false;
    gridRef.current?.querySelector<HTMLButtonElement>(`button[data-date="${focusedDay}"]`)?.focus();
  }, [focusedDay, visibleMonth]);

  function goTo(iso: string) {
    const next = clampIso(iso, min, max);
    // At a limit nothing changes; don't leave a pending focus move behind.
    if (next === focusedDay && isSameMonth(next, visibleMonth)) return;
    moveFocus.current = true;
    setFocused(next);
    setMonth(startOfMonth(next));
  }

  function showMonth(offset: number) {
    const target = clampIso(addMonths(visibleMonth, offset), firstMonth, lastMonth);
    setMonth(target);
    // Keep the same day number in the new month so Tab lands somewhere sensible.
    setFocused(clampIso(addMonths(focusedDay, offset), min, max));
  }

  function choose(iso: string) {
    if (isUnavailable(iso)) return;
    setFocused(iso);
    onChange(iso);
  }

  function onDayKeyDown(event: KeyboardEvent<HTMLButtonElement>, iso: string) {
    let next: string | null = null;
    switch (event.key) {
      case "ArrowLeft":
        next = addDays(iso, -1);
        break;
      case "ArrowRight":
        next = addDays(iso, 1);
        break;
      case "ArrowUp":
        next = addDays(iso, -7);
        break;
      case "ArrowDown":
        next = addDays(iso, 7);
        break;
      case "Home":
        next = startOfWeek(iso);
        break;
      case "End":
        next = endOfWeek(iso);
        break;
      case "PageUp":
        next = event.shiftKey ? addYears(iso, -1) : addMonths(iso, -1);
        break;
      case "PageDown":
        next = event.shiftKey ? addYears(iso, 1) : addMonths(iso, 1);
        break;
      default:
        return;
    }
    event.preventDefault();
    goTo(next);
  }

  const canGoBack = visibleMonth > firstMonth;
  const canGoForward = lastMonth === null || visibleMonth < lastMonth;
  const monthTitle = formatMonthTitle(visibleMonth);
  const weeks = monthMatrix(visibleMonth);

  const navButton =
    "flex size-12 items-center justify-center rounded-full border-2 border-brand bg-surface text-brand transition-colors duration-150 hover:bg-brand-soft " +
    "aria-disabled:border-disabled aria-disabled:text-disabled aria-disabled:hover:bg-surface";

  return (
    <div className={cx("w-full max-w-md min-w-0", className)}>
      <p id={labelId} className={hideLabel ? "sr-only" : "mb-2 text-xl font-bold text-ink"}>
        {label}
      </p>
      <p id={instructionsId} className="sr-only">
        {t.common.calendar.instructions}
      </p>
      {error && errorId ? (
        <FieldError id={errorId} className="mb-2">
          {error}
        </FieldError>
      ) : null}
      <div className="mb-2 flex items-center justify-between gap-2">
        <button
          type="button"
          className={navButton}
          aria-label={t.common.calendar.previousMonth}
          aria-disabled={!canGoBack || undefined}
          onClick={() => canGoBack && showMonth(-1)}
        >
          <Icon name="chevron-left" size={24} />
        </button>
        <p id={titleId} className="text-lg font-bold text-ink" aria-live="polite">
          {monthTitle}
        </p>
        <button
          type="button"
          className={navButton}
          aria-label={t.common.calendar.nextMonth}
          aria-disabled={!canGoForward || undefined}
          onClick={() => canGoForward && showMonth(1)}
        >
          <Icon name="chevron-right" size={24} />
        </button>
      </div>
      <table
        ref={gridRef}
        role="grid"
        className="w-full table-fixed border-collapse"
        aria-labelledby={`${labelId} ${titleId}`}
        aria-describedby={[instructionsId, errorId].filter(Boolean).join(" ")}
      >
        <thead>
          <tr>
            {WEEKDAYS.map((d) => (
              <th
                key={d.long}
                scope="col"
                abbr={d.long}
                className="pb-1 text-center text-sm font-semibold text-muted"
              >
                {d.short}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, w) => (
            <tr key={w}>
              {week.map((iso, d) => {
                if (!iso) return <td key={`empty-${w}-${d}`} className="p-0" />;
                const isSelected = iso === selected;
                const unavailable = isUnavailable(iso);
                const isToday = iso === today;
                return (
                  <td key={iso} className="p-0" aria-selected={isSelected}>
                    <button
                      type="button"
                      data-date={iso}
                      tabIndex={iso === tabbable ? 0 : -1}
                      aria-label={formatDayLabel(iso)}
                      aria-pressed={isSelected}
                      aria-disabled={unavailable || undefined}
                      aria-current={isToday ? "date" : undefined}
                      onClick={() => choose(iso)}
                      onKeyDown={(e) => onDayKeyDown(e, iso)}
                      className={cx(
                        "flex h-12 w-full items-center justify-center rounded-control border-2 text-lg font-semibold tabular-nums transition-colors duration-150",
                        isSelected
                          ? "border-brand bg-brand text-on-brand"
                          : unavailable
                            ? "cursor-not-allowed border-transparent text-disabled line-through"
                            : "border-transparent text-ink hover:border-brand hover:bg-brand-soft",
                        isToday && !isSelected && !unavailable && "underline decoration-2 underline-offset-4",
                      )}
                    >
                      {Number(iso.slice(8, 10))}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {showSelection ? (
        <p className="mt-3 font-semibold text-ink" aria-live="polite">
          {selected
            ? fmt(t.common.calendar.selectedDate, { date: formatDayLabel(selected) })
            : t.common.calendar.noDateSelected}
        </p>
      ) : null}
      {name ? <input type="hidden" name={name} value={selected ?? ""} /> : null}
    </div>
  );
}
