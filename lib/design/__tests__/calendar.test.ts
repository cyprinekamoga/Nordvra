import { describe, expect, it } from "vitest";
import {
  addDays,
  addMonths,
  addYears,
  clampIso,
  daysInMonth,
  endOfWeek,
  formatDayLabel,
  formatMonthTitle,
  isIsoDate,
  isWithinRange,
  monthMatrix,
  parseIsoDate,
  startOfMonth,
  startOfWeek,
  stockholmDate,
  weekdayIndex,
  WEEKDAYS,
} from "@/components/ui/calendar-utils";

describe("calendar date maths (UTC, YYYY-MM-DD)", () => {
  it("parses and validates dates", () => {
    expect(parseIsoDate("2026-10-14")).toEqual({ year: 2026, month: 10, day: 14 });
    expect(parseIsoDate("2026-02-30")).toBeNull();
    expect(parseIsoDate("2026-13-01")).toBeNull();
    expect(parseIsoDate("14/10/2026")).toBeNull();
    expect(isIsoDate("2028-02-29")).toBe(true);
    expect(isIsoDate("2027-02-29")).toBe(false);
    expect(isIsoDate(undefined)).toBe(false);
  });

  it("counts days in months incl. leap years", () => {
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(daysInMonth(2028, 2)).toBe(29);
    expect(daysInMonth(2026, 10)).toBe(31);
  });

  it("adds days across month/year boundaries and DST changes", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    // Swedish DST ends 2026-10-25 and starts 2027-03-28 – no skipped or doubled days.
    expect(addDays("2026-10-24", 1)).toBe("2026-10-25");
    expect(addDays("2026-10-25", 1)).toBe("2026-10-26");
    expect(addDays("2027-03-27", 2)).toBe("2027-03-29");
  });

  it("adds months, clamping to the last day", () => {
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonths("2026-10-14", 6)).toBe("2027-04-14");
    expect(addMonths("2026-01-15", -1)).toBe("2025-12-15");
    expect(addYears("2028-02-29", 1)).toBe("2029-02-28");
  });

  it("uses Monday as the first day of the week", () => {
    expect(weekdayIndex("2026-10-12")).toBe(0); // Monday
    expect(weekdayIndex("2026-10-18")).toBe(6); // Sunday
    expect(startOfWeek("2026-10-14")).toBe("2026-10-12");
    expect(endOfWeek("2026-10-14")).toBe("2026-10-18");
    expect(startOfWeek("2026-11-01")).toBe("2026-10-26");
  });

  it("builds a Monday-first month matrix", () => {
    const weeks = monthMatrix("2026-10-14");
    expect(startOfMonth("2026-10-14")).toBe("2026-10-01");
    expect(weeks).toHaveLength(5);
    expect(weeks.every((w) => w.length === 7)).toBe(true);
    // 1 October 2026 is a Thursday → three empty cells first.
    expect(weeks[0]).toEqual([null, null, null, "2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04"]);
    expect(weeks[4][5]).toBe("2026-10-31");
    expect(weeks[4][6]).toBeNull();
    // February 2027 starts on a Monday and fills exactly four weeks.
    expect(monthMatrix("2027-02-01")).toHaveLength(4);
  });

  it("clamps and checks ranges", () => {
    expect(clampIso("2026-10-01", "2026-10-14", "2027-04-14")).toBe("2026-10-14");
    expect(clampIso("2027-05-01", "2026-10-14", "2027-04-14")).toBe("2027-04-14");
    expect(clampIso("2026-12-24", "2026-10-14")).toBe("2026-12-24");
    expect(isWithinRange("2026-10-13", "2026-10-14")).toBe(false);
    expect(isWithinRange("2026-10-14", "2026-10-14", "2026-10-14")).toBe(true);
  });

  it("finds the Swedish calendar date for an instant", () => {
    // 23:30 UTC on 13 Oct is already 14 Oct in Stockholm (UTC+2 in summer time).
    expect(stockholmDate(new Date("2026-10-13T23:30:00Z"))).toBe("2026-10-14");
    expect(stockholmDate(new Date("2026-12-31T22:59:00Z"))).toBe("2026-12-31");
    expect(stockholmDate(new Date("2026-12-31T23:00:00Z"))).toBe("2027-01-01");
  });

  it("formats Swedish labels", () => {
    expect(formatDayLabel("2026-10-14")).toBe("onsdag 14 oktober 2026");
    expect(formatMonthTitle("2026-10-14")).toBe("Oktober 2026");
    expect(WEEKDAYS.map((d) => d.long)).toEqual([
      "måndag",
      "tisdag",
      "onsdag",
      "torsdag",
      "fredag",
      "lördag",
      "söndag",
    ]);
  });
});
