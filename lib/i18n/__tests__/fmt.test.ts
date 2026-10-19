import { describe, expect, it } from "vitest";
import { fmt, sv, t } from "@/lib/i18n";
import { HOUSING_TYPES, SIZE_BANDS, TIME_WINDOWS, FREQUENCIES } from "@/lib/catalog/types";

describe("fmt", () => {
  it("fills named placeholders", () => {
    expect(fmt("Steg {step} av {total}", { step: 3, total: 8 })).toBe("Steg 3 av 8");
  });

  it("fills the same placeholder several times", () => {
    expect(fmt("{a} och {a}", { a: "RUT" })).toBe("RUT och RUT");
  });

  it("formats numbers with String() and keeps zero", () => {
    expect(fmt("{n} st", { n: 0 })).toBe("0 st");
  });

  it("leaves unknown or missing placeholders visible", () => {
    expect(fmt("Hej {name}, {missing}", { name: "Anna", missing: undefined })).toBe(
      "Hej Anna, {missing}",
    );
    expect(fmt("Hej {name}")).toBe("Hej {name}");
  });

  it("supports escaped braces", () => {
    expect(fmt("{{name}} = {name}", { name: "x" })).toBe("{name} = x");
  });

  it("does not treat non-identifier braces as placeholders", () => {
    expect(fmt("{ inte } {1a}", { "1a": "ok" })).toBe("{ inte } ok");
  });
});

describe("messages", () => {
  it("t is the Swedish message object", () => {
    expect(t).toBe(sv);
    expect(t.common.actions.continue).toBe("Fortsätt");
    expect(t.common.actions.back).toBe("Tillbaka");
  });

  it("has a label for every housing type, size band, time window and frequency", () => {
    for (const h of HOUSING_TYPES) expect(t.common.housing[h]).toBeTruthy();
    for (const s of SIZE_BANDS) expect(t.common.sizeBands[s]).toMatch(/m²/);
    for (const w of TIME_WINDOWS) expect(t.common.timeWindows[w]).toBeTruthy();
    for (const f of FREQUENCIES) expect(t.common.frequencies[f]).toBeTruthy();
  });

  it("never uses forbidden wording in shared strings", () => {
    const all = JSON.stringify(sv.common).toLowerCase();
    expect(all).not.toContain("halva priset");
    expect(all).not.toContain("kryphål");
    expect(all).not.toContain("loophole");
    expect(all).not.toContain("serviceavgift");
  });

  it("phone CTA renders with the number", () => {
    expect(fmt(t.common.phone.ctaWithNumber, { phone: "072-222 88 00" })).toBe(
      "Hellre ringa? Ring oss på 072-222 88 00",
    );
  });
});
