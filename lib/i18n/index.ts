/**
 * Swedish UI strings. Each module under `./sv/` is owned by one area (SPEC §10) and
 * default-exports a plain `as const` object. Import `t` and read e.g. `t.common.nav.book`.
 * When English is added later, `t` becomes locale-dependent; components should keep reading
 * through `t` rather than importing the modules directly.
 */
import common from "./sv/common";
import booking from "./sv/booking";
import quote from "./sv/quote";
import content from "./sv/content";
import adminBookings from "./sv/adminBookings";
import adminConfig from "./sv/adminConfig";
import email from "./sv/email";

/** All Swedish strings, namespaced by module. */
export const sv = {
  common,
  booking,
  quote,
  content,
  adminBookings,
  adminConfig,
  email,
} as const;

export type Messages = typeof sv;

/** The active messages (Swedish only for now). */
export const t: Messages = sv;

export type FmtValue = string | number;

/**
 * Fills "{name}" placeholders: `fmt("Steg {step} av {total}", { step: 3, total: 8 })`
 * → "Steg 3 av 8". Placeholders without a value are left as they are so that a missing
 * variable is visible instead of silently disappearing. Use `{{` and `}}` for literal braces.
 */
export function fmt(template: string, vars: Readonly<Record<string, FmtValue | null | undefined>> = {}): string {
  return template.replace(/\{\{|\}\}|\{([A-Za-z0-9_]+)\}/g, (match, key: string | undefined) => {
    if (match === "{{") return "{";
    if (match === "}}") return "}";
    const value = key === undefined ? undefined : vars[key];
    return value === undefined || value === null ? match : String(value);
  });
}
