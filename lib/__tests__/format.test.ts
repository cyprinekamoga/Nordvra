import { describe, expect, it } from "vitest";
import { NBSP, formatKr, formatKrRange, formatNumber, parseKrToOre } from "@/lib/format";

describe("price formatting", () => {
  it("writes '1 250 kr' with non-breaking spaces only", () => {
    expect(formatKr(125000)).toBe(`1${NBSP}250${NBSP}kr`);
    expect(formatKr(125000)).not.toMatch(/[  ]/);
    expect(formatKr(0)).toBe(`0${NBSP}kr`);
    expect(formatNumber(1250000)).toBe(`1${NBSP}250${NBSP}000`);
  });

  it("keeps a range on one line", () => {
    expect(formatKrRange([380000, 480000])).toBe(`3${NBSP}800–4${NBSP}800${NBSP}kr`);
    expect(formatKrRange([420000, 420000])).toBe(`4${NBSP}200${NBSP}kr`);
  });

  it("parses its own output back", () => {
    expect(parseKrToOre(formatNumber(1250))).toBe(125000);
  });
});
