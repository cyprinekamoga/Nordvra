import { describe, expect, it } from "vitest";
import {
  FLYTTSTAD_EXAMPLE_LABOUR_ORE,
  capSentence,
  flyttstadExample,
  paintingExample,
  taxFactVars,
  taxFacts,
} from "@/lib/content/facts";
import { seedCatalog } from "@/lib/catalog/seed";
import { formatKr } from "@/lib/format";
import { t } from "@/lib/i18n";
import { CURRENT_RULES, getTaxRules, type TaxYearRules } from "@/lib/taxRules";

const custom: TaxYearRules = {
  ...CURRENT_RULES,
  year: 2099,
  rutRate: 0.4,
  rotRate: 0.2,
  rutCapPerPerson: 60_000_00,
  rotCapPerPerson: 40_000_00,
  combinedCapPerPerson: 70_000_00,
};

describe("taxFacts", () => {
  it("formats the 2026 rules", () => {
    const f = taxFacts(getTaxRules(2026));
    expect(f.rutRate).toBe("50 %");
    expect(f.rotRate).toBe("30 %");
    expect(f.combinedCap).toBe("75\u00a0000\u00a0kr");
    expect(f.rotCap).toBe("50\u00a0000\u00a0kr");
    expect(f.minimumAge).toBe(18);
    expect(f.rotMinBuildingAgeYears).toBe(5);
    expect(f.rutCapIsCombined).toBe(true);
  });

  it("follows the rules it is given", () => {
    const v = taxFactVars(custom);
    expect(v).toMatchObject({ rutRate: "40 %", rotRate: "20 %", combinedCap: "70\u00a0000\u00a0kr", rotCap: "40\u00a0000\u00a0kr" });
  });
});

describe("capSentence", () => {
  it("matches the verbatim legal text for the current rules (SPEC §5.4)", () => {
    expect(capSentence(getTaxRules(2026))).toBe(
      "Max 75\u00a0000\u00a0kr per person och år för RUT och ROT tillsammans, varav max 50\u00a0000\u00a0kr för ROT.",
    );
    expect(capSentence(getTaxRules(2026))).toBe(t.common.legal.cap.body);
  });

  it("mentions a separate RUT cap when RUT has its own lower cap", () => {
    expect(capSentence(custom)).toBe(
      "Max 70\u00a0000\u00a0kr per person och år för RUT och ROT tillsammans, varav max 60\u00a0000\u00a0kr för RUT och max 40\u00a0000\u00a0kr för ROT.",
    );
  });
});

describe("price examples", () => {
  it("flyttstäd 60 m²: 5 600 kr before → 2 800 kr to pay (SPEC §12)", () => {
    const { breakdown, label, type } = flyttstadExample(getTaxRules(2026));
    expect(label).toBe("Flyttstäd 60 m²");
    expect(type).toBe("rut");
    expect(breakdown.total).toBe(FLYTTSTAD_EXAMPLE_LABOUR_ORE);
    expect(formatKr(breakdown.total)).toBe("5\u00a0600\u00a0kr");
    expect(formatKr(breakdown.deduction)).toBe("2\u00a0800\u00a0kr");
    expect(formatKr(breakdown.toPay)).toBe("2\u00a0800\u00a0kr");
  });

  it("the example price sits inside the catalogue's flyttstädning band for 60–79 m²", () => {
    const band = seedCatalog.ranges.find((r) => r.serviceId === "flyttstadning" && r.sizeBand === "60-79");
    expect(band).toBeDefined();
    expect(FLYTTSTAD_EXAMPLE_LABOUR_ORE).toBeGreaterThanOrEqual(band!.labourMin);
    expect(FLYTTSTAD_EXAMPLE_LABOUR_ORE).toBeLessThanOrEqual(band!.labourMax);
  });

  it("the example is recomputed when the rate changes", () => {
    const { breakdown } = flyttstadExample(custom);
    expect(formatKr(breakdown.toPay)).toBe("3\u00a0360\u00a0kr");
  });

  it("ROT example deducts only labour, never material", () => {
    const { breakdown } = paintingExample(getTaxRules(2026));
    expect(breakdown.total).toBe(2_500_000);
    expect(breakdown.deduction).toBe(600_000);
    expect(breakdown.toPay).toBe(1_900_000);
  });
});
