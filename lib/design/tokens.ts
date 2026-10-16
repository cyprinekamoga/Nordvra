/**
 * Design tokens (colours) – the same hex values are declared as Tailwind v4 `@theme` tokens in
 * `app/globals.css` (as `--color-<name>`). `lib/__tests__/contrast.test.ts` checks that both
 * stay in sync and that every text/background pair below meets WCAG 2.1 AA.
 *
 * Use them in components through Tailwind utilities, e.g. `bg-canvas text-ink`,
 * `bg-brand text-on-brand`, `border-control`, `bg-rot-soft text-rot`.
 */

export const palette = {
  /** Page background (warm off-white). */
  canvas: "#FAF7F2",
  /** Cards, inputs, tiles. */
  surface: "#FFFFFF",
  /** Subtle section background (slightly darker than canvas). */
  "surface-muted": "#F2EDE4",
  /** Body text. */
  ink: "#1A2420",
  /** Secondary text (hints, captions). */
  muted: "#4D5853",
  /** Brand green – primary buttons, links, logo. */
  brand: "#0B5D4B",
  /** Hover/pressed state for brand surfaces. */
  "brand-strong": "#084536",
  /** Tinted brand background (selected rows, phone strip). */
  "brand-soft": "#E1EFE9",
  /**
   * Emerald from the logo. Icons and decorative accents on canvas or surface only – never text or
   * button text (about 3.2:1, below the 4.5:1 text minimum).
   */
  accent: "#2E9E6E",
  /** Text on brand / brand-strong / rot / danger fills. */
  "on-brand": "#FFFFFF",
  /** Decorative separators only (card edges, dividers). Not for form controls. */
  border: "#DDD5C8",
  /** Boundaries of interactive controls (inputs, chips, tiles) – ≥ 3:1 against backgrounds. */
  control: "#6F7A74",
  /** Disabled text and controls (exempt from contrast requirements). */
  disabled: "#8C9590",
  /** RUT accent (deep teal). */
  rut: "#0E5A5E",
  "rut-soft": "#DCEFEF",
  /** ROT accent (warm terracotta). */
  rot: "#9C4221",
  "rot-strong": "#7F3418",
  "rot-soft": "#FBE9DD",
  info: "#1D4F7C",
  "info-soft": "#E6F0F9",
  warning: "#7A4A00",
  "warning-soft": "#FCF1D8",
  /** Border of warning boxes and chips (UI boundary, ≥ 3:1). */
  "warning-border": "#B7791F",
  danger: "#A3232A",
  "danger-soft": "#FCEBEC",
  success: "#1D6B3B",
  "success-soft": "#E3F3E8",
  /** Legal info boxes (calm violet-grey so they read as "important, not an error"). */
  legal: "#4A3F6B",
  "legal-soft": "#EFEDF6",
  /** Focus ring (dark) and its halo (light) – together visible on light and brand backgrounds. */
  focus: "#1A2420",
  "focus-halo": "#FFFFFF",
} as const;

export type ColorToken = keyof typeof palette;

/** WCAG minimums. */
export const AA_TEXT = 4.5;
export const AA_LARGE_TEXT = 3;
export const AA_NON_TEXT = 3;

export interface ContrastPair {
  fg: ColorToken;
  bg: ColorToken;
  min: number;
  use: string;
}

/** Every foreground/background combination the components use. */
export const contrastPairs: ContrastPair[] = [
  // Text
  { fg: "ink", bg: "canvas", min: AA_TEXT, use: "brödtext på sidbakgrund" },
  { fg: "ink", bg: "surface", min: AA_TEXT, use: "brödtext på kort" },
  { fg: "ink", bg: "surface-muted", min: AA_TEXT, use: "brödtext på dämpad sektion" },
  { fg: "muted", bg: "canvas", min: AA_TEXT, use: "hjälptext på sidbakgrund" },
  { fg: "muted", bg: "surface", min: AA_TEXT, use: "hjälptext på kort" },
  { fg: "muted", bg: "surface-muted", min: AA_TEXT, use: "hjälptext på dämpad sektion" },
  { fg: "muted", bg: "brand-soft", min: AA_TEXT, use: "hjälptext på grön tonad yta" },
  { fg: "brand", bg: "canvas", min: AA_TEXT, use: "länkar på sidbakgrund" },
  { fg: "brand", bg: "surface", min: AA_TEXT, use: "länkar på kort" },
  { fg: "brand", bg: "surface-muted", min: AA_TEXT, use: "länkar på dämpad sektion" },
  { fg: "brand", bg: "brand-soft", min: AA_TEXT, use: "grön text på tonad yta" },
  { fg: "brand-strong", bg: "brand-soft", min: AA_TEXT, use: "telefonremsa" },
  { fg: "ink", bg: "brand-soft", min: AA_TEXT, use: "brödtext på tonad yta" },
  { fg: "on-brand", bg: "brand", min: AA_TEXT, use: "primärknapp, vald chip" },
  { fg: "on-brand", bg: "brand-strong", min: AA_TEXT, use: "primärknapp hover" },
  { fg: "brand-soft", bg: "brand", min: AA_TEXT, use: "tonad text på grön yta" },
  { fg: "rut", bg: "rut-soft", min: AA_TEXT, use: "RUT-märke" },
  { fg: "rut", bg: "surface", min: AA_TEXT, use: "RUT-text på kort" },
  { fg: "rot", bg: "rot-soft", min: AA_TEXT, use: "ROT-märke" },
  { fg: "rot-strong", bg: "rot-soft", min: AA_TEXT, use: "ROT-märke, stark" },
  { fg: "rot", bg: "surface", min: AA_TEXT, use: "ROT-text på kort" },
  { fg: "rot", bg: "canvas", min: AA_TEXT, use: "ROT-text på sidbakgrund" },
  { fg: "on-brand", bg: "rot", min: AA_TEXT, use: "vit text på ROT-yta (fyllt märke)" },
  { fg: "on-brand", bg: "rut", min: AA_TEXT, use: "vit text på RUT-yta (fyllt märke)" },
  { fg: "info", bg: "info-soft", min: AA_TEXT, use: "inforuta rubrik" },
  { fg: "ink", bg: "info-soft", min: AA_TEXT, use: "inforuta text" },
  { fg: "warning", bg: "warning-soft", min: AA_TEXT, use: "varningsruta rubrik, varningschip" },
  { fg: "ink", bg: "warning-soft", min: AA_TEXT, use: "varningsruta text" },
  { fg: "danger", bg: "danger-soft", min: AA_TEXT, use: "felruta" },
  { fg: "ink", bg: "danger-soft", min: AA_TEXT, use: "felruta text" },
  { fg: "danger", bg: "surface", min: AA_TEXT, use: "felmeddelande under fält (kort)" },
  { fg: "danger", bg: "canvas", min: AA_TEXT, use: "felmeddelande under fält (sida)" },
  { fg: "on-brand", bg: "danger", min: AA_TEXT, use: "farlig knapp" },
  { fg: "success", bg: "success-soft", min: AA_TEXT, use: "bekräftelse" },
  { fg: "ink", bg: "success-soft", min: AA_TEXT, use: "bekräftelse text" },
  { fg: "legal", bg: "legal-soft", min: AA_TEXT, use: "juridisk ruta rubrik" },
  { fg: "ink", bg: "legal-soft", min: AA_TEXT, use: "juridisk ruta text" },
  { fg: "on-brand", bg: "ink", min: AA_TEXT, use: "cookie-ruta" },
  // Non-text: UI component boundaries and focus indicator
  { fg: "control", bg: "canvas", min: AA_NON_TEXT, use: "fältkant på sidbakgrund" },
  { fg: "control", bg: "surface", min: AA_NON_TEXT, use: "fältkant på kort" },
  { fg: "control", bg: "surface-muted", min: AA_NON_TEXT, use: "fältkant på dämpad sektion" },
  { fg: "warning-border", bg: "warning-soft", min: AA_NON_TEXT, use: "varningschip kant" },
  { fg: "brand", bg: "canvas", min: AA_NON_TEXT, use: "vald chip/kalenderdag mot sidan" },
  { fg: "accent", bg: "canvas", min: AA_NON_TEXT, use: "smaragdgrön ikon på sidbakgrund" },
  { fg: "accent", bg: "surface", min: AA_NON_TEXT, use: "smaragdgrön ikon på kort" },
  { fg: "focus", bg: "canvas", min: AA_NON_TEXT, use: "fokusring på sidbakgrund" },
  { fg: "focus", bg: "surface", min: AA_NON_TEXT, use: "fokusring på kort" },
  { fg: "focus", bg: "focus-halo", min: AA_NON_TEXT, use: "fokusring mot sin ljusa halo" },
  { fg: "focus-halo", bg: "brand", min: AA_NON_TEXT, use: "fokushalo på grön knapp/yta" },
  { fg: "focus-halo", bg: "ink", min: AA_NON_TEXT, use: "fokushalo på mörk cookie-ruta" },
];

function channel(v: number): number {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** Relative luminance of a "#RRGGBB" colour (WCAG 2.1 definition). */
export function relativeLuminance(hex: string): number {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) throw new Error(`Expected #RRGGBB, got ${hex}`);
  const n = parseInt(m[1], 16);
  const r = channel((n >> 16) & 255);
  const g = channel((n >> 8) & 255);
  const b = channel(n & 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two "#RRGGBB" colours, 1–21. */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}
