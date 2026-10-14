import { describe, expect, it } from "vitest";
import { getFaq } from "@/lib/content/faq";
import { privacyPolicy, termsOfService } from "@/lib/content/legal";
import content from "@/lib/i18n/sv/content";
import { CURRENT_RULES, type TaxYearRules } from "@/lib/taxRules";

/** Every user-facing string in a nested object, with its key path (ids and hrefs skipped). */
function strings(value: unknown, path = ""): { path: string; text: string }[] {
  if (typeof value === "string") return [{ path, text: value }];
  if (Array.isArray(value)) return value.flatMap((v, i) => strings(v, `${path}[${i}]`));
  if (value && typeof value === "object") {
    return Object.entries(value)
      .filter(([k]) => k !== "id" && k !== "href")
      .flatMap(([k, v]) => strings(v, path ? `${path}.${k}` : k));
  }
  return [];
}

const otherRules: TaxYearRules = {
  ...CURRENT_RULES,
  rutRate: 0.45,
  rotRate: 0.25,
  rutCapPerPerson: 80_000_00,
  rotCapPerPerson: 40_000_00,
  combinedCapPerPerson: 80_000_00,
};

const allCopy = [
  ...strings(content, "content"),
  ...strings(getFaq(), "faq"),
  ...strings(termsOfService(), "villkor"),
  ...strings(privacyPolicy(), "integritetspolicy"),
];

describe("content copy rules", () => {
  it("never says 'halva priset' or calls the deduction a loophole", () => {
    for (const { path, text } of allCopy) {
      expect(text, path).not.toMatch(/halva priset|kryphål|loophole|\btrick/i);
    }
  });

  it("has no service or booking fee – only 'ingen bokningsavgift'", () => {
    for (const { path, text } of allCopy) {
      expect(text, path).not.toMatch(/serviceavgift/i);
      for (const match of text.matchAll(/bokningsavgift/gi)) {
        // "Ingen bokningsavgift", or the FAQ question "Tar ni någon bokningsavgift?".
        const before = text.slice(Math.max(0, match.index! - 6), match.index).toLowerCase();
        expect(before, path).toMatch(/(ingen|någon) $/);
      }
    }
  });

  it("never hard-codes deduction rates or caps in lib/i18n/sv/content.ts", () => {
    for (const { path, text } of strings(content, "content")) {
      expect(text, path).not.toMatch(/\b(50|30) ?%|75 000|50 000/);
    }
  });

  it("FAQ and legal texts follow lib/taxRules.ts", () => {
    const texts = [
      ...strings(getFaq({ rules: otherRules })),
      ...strings(termsOfService({ rules: otherRules })),
    ];
    for (const { path, text } of texts) {
      expect(text, path).not.toMatch(/\b(50|30) %|75 000|50 000/);
    }
  });

  it("has no leftover TODO markers except the phone hours placeholder", () => {
    for (const { path, text } of allCopy) {
      if (path === "content.contact.hours") continue;
      expect(text, path).not.toMatch(/TODO/);
    }
  });
});
