import { describe, expect, it } from "vitest";
import { getTaxRules } from "@/lib/taxRules";
import { seedCatalog } from "@/lib/catalog/seed";
import { displayRange, estimateForRequest } from "@/lib/pricing/estimate";
import { notDeductibleById } from "@/lib/content/notDeductible";

const rules = getTaxRules(2026);
const service = (id: string) => seedCatalog.services.find((s) => s.id === id)!;
const kr = (n: number) => n * 100;

describe("estimateForRequest", () => {
  it("flyttstäd 60–79 m²: usually 2 300–3 600 kr after RUT (market price 2026)", () => {
    const e = estimateForRequest({
      catalog: seedCatalog,
      service: service("flyttstadning"),
      answers: { sizeBand: "60-79", floors: 1, pets: false },
      rules,
      eligible: true,
    });
    expect(e.kind).toBe("total");
    if (e.kind !== "total") return;
    expect(displayRange(e.range).after).toEqual([kr(2_300), kr(3_600)]);
    expect(e.range.before).toEqual([kr(4_600), kr(7_200)]);
  });

  it("shows the price without deduction when not eligible", () => {
    const e = estimateForRequest({
      catalog: seedCatalog,
      service: service("flyttstadning"),
      answers: { sizeBand: "60-79" },
      rules,
      eligible: false,
    });
    if (e.kind !== "total") throw new Error("expected total");
    expect(e.range.after).toEqual([kr(4_600), kr(7_200)]);
    expect(e.range.deduction).toEqual([0, 0]);
  });

  it("adds add-ons, pets and extra floors to the labour", () => {
    const e = estimateForRequest({
      catalog: seedCatalog,
      service: service("flyttstadning"),
      answers: { sizeBand: "60-79", addonIds: ["flytt-balkong", "flytt-ugn"], pets: true, floors: 2 },
      rules,
      eligible: true,
    });
    if (e.kind !== "total") throw new Error("expected total");
    // (4 600 + 300) × 1.10 × 1.05 = 5 659.5 kr labour before RUT.
    expect(e.range.before[0]).toBe(Math.round(kr(4_900) * 1.1 * 1.05));
  });

  it("multiplies window cleaning by the number of windows", () => {
    const e = estimateForRequest({
      catalog: seedCatalog,
      service: service("fonsterputs"),
      answers: { windows: 10 },
      rules,
      eligible: true,
    });
    if (e.kind !== "total") throw new Error("expected total");
    expect(e.range.after).toEqual([kr(600), kr(950)]);
  });

  it("gives a rate for hourly ROT work, at 30 %", () => {
    const e = estimateForRequest({
      catalog: seedCatalog,
      service: service("eluttag"),
      answers: {},
      rules,
      eligible: true,
    });
    expect(e.kind).toBe("rate");
    if (e.kind !== "rate") return;
    expect(e.range.before).toEqual([kr(750), kr(950)]);
    expect(e.range.after).toEqual([kr(525), kr(665)]);
  });

  it("second-hand transport: deduction is 25 % of the total", () => {
    const e = estimateForRequest({
      catalog: seedCatalog,
      service: service("secondhand-transport"),
      answers: {},
      rules,
      eligible: true,
    });
    if (e.kind !== "total") throw new Error("expected total");
    expect(e.range.deduction).toEqual([kr(300), kr(800)]);
  });

  it("asks for a quote when no range is set", () => {
    const e = estimateForRequest({
      catalog: seedCatalog,
      service: service("takbyte"),
      answers: {},
      rules,
      eligible: true,
    });
    expect(e.kind).toBe("quote");
  });
});

describe("seed catalogue", () => {
  it("has 13 categories and only references known warnings", () => {
    expect(seedCatalog.categories).toHaveLength(13);
    for (const s of seedCatalog.services) {
      for (const w of s.warningIds) expect(notDeductibleById(w), `${s.id} → ${w}`).toBeDefined();
    }
  });

  it("uses the seller model for RUT and the agent model for ROT", () => {
    for (const s of seedCatalog.services) {
      expect(s.model).toBe(s.deductionType === "rut" ? "seller" : "agent");
    }
  });

  it("has unique ids", () => {
    const ids = seedCatalog.services.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
