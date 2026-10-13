import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  AA_TEXT,
  contrastPairs,
  contrastRatio,
  palette,
  relativeLuminance,
  type ColorToken,
} from "@/lib/design/tokens";

const css = readFileSync(fileURLToPath(new URL("../../app/globals.css", import.meta.url)), "utf8");

/** `--color-<name>: #xxxxxx;` declarations inside the first `@theme {…}` block. */
function themeColors(source: string): Record<string, string> {
  const start = source.indexOf("@theme {");
  const end = source.indexOf("}", start);
  const block = source.slice(start, end);
  const out: Record<string, string> = {};
  for (const m of block.matchAll(/--color-([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) {
    out[m[1]] = m[2].toUpperCase();
  }
  return out;
}

describe("contrast maths", () => {
  it("matches known WCAG values", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 5);
    expect(contrastRatio("#FFFFFF", "#FFFFFF")).toBeCloseTo(1, 5);
    // #767676 on white is the classic 4.54:1 grey.
    expect(contrastRatio("#767676", "#FFFFFF")).toBeCloseTo(4.54, 2);
    expect(relativeLuminance("#FFFFFF")).toBeCloseTo(1, 5);
  });

  it("is symmetric", () => {
    expect(contrastRatio(palette.brand, palette.canvas)).toBeCloseTo(
      contrastRatio(palette.canvas, palette.brand),
      10,
    );
  });
});

describe("design tokens", () => {
  it("globals.css @theme declares exactly the palette colours", () => {
    const declared = themeColors(css);
    const expected = Object.fromEntries(
      Object.entries(palette).map(([name, hex]) => [name, hex.toUpperCase()]),
    );
    expect(declared).toEqual(expected);
  });

  it("keeps the brand colours from the spec", () => {
    expect(palette.brand).toBe("#0B5D4B");
    expect(palette.canvas).toBe("#FAF7F2");
    expect(palette.ink).toBe("#1A2420");
  });

  it("sets the 18px base and light colour scheme", () => {
    expect(css).toMatch(/font-size:\s*112\.5%/);
    expect(css).toMatch(/color-scheme:\s*light/);
    expect(css).toMatch(/prefers-reduced-motion:\s*reduce/);
    expect(css).toMatch(/:focus-visible\s*\{/);
  });

  it.each(contrastPairs.map((p) => [p.fg, p.bg, p.min, p.use] as const))(
    "%s on %s ≥ %d:1 (%s)",
    (fg, bg, min) => {
      const ratio = contrastRatio(palette[fg as ColorToken], palette[bg as ColorToken]);
      expect(ratio).toBeGreaterThanOrEqual(min);
    },
  );

  it("checks every text colour used as foreground at least once at AA text level", () => {
    const textTokens: ColorToken[] = ["ink", "muted", "brand", "rut", "rot", "info", "warning", "danger", "success", "legal", "on-brand"];
    for (const token of textTokens) {
      expect(contrastPairs.some((p) => p.fg === token && p.min >= AA_TEXT)).toBe(true);
    }
  });
});
