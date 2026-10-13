import { describe, expect, it } from "vitest";
import { getTaxRules, TAX_RULES } from "@/lib/taxRules";
import {
  calculatePrice,
  calculateRange,
  evenShares,
  floorToKrona,
  PricingError,
  roundRange,
} from "@/lib/pricing/calculate";

const kr = (n: number) => n * 100;
const rules = getTaxRules(2026);
const lines = (labour: number, material = 0, travel = 0) => ({
  labour: kr(labour),
  material: kr(material),
  travel: kr(travel),
});

describe("2026 tax rules", () => {
  it("encodes RUT 50 %, ROT 30 % and the yearly caps", () => {
    const r = TAX_RULES[2026];
    expect(r.rutRate).toBe(0.5);
    expect(r.rotRate).toBe(0.3);
    expect(r.rutCapPerPerson).toBe(kr(75_000));
    expect(r.rotCapPerPerson).toBe(kr(50_000));
    expect(r.combinedCapPerPerson).toBe(kr(75_000));
  });

  it("falls back to the latest known year and flags it", () => {
    const r = getTaxRules(2031);
    expect(r.isFallback).toBe(true);
    expect(r.rotRate).toBe(0.3);
    expect(r.year).toBe(2031);
  });

  it("applies admin overrides and flags them", () => {
    const r = getTaxRules(2026, [{ year: 2026, rotRate: 0.5 }]);
    expect(r.rotRate).toBe(0.5);
    expect(r.isOverridden).toBe(true);
    expect(getTaxRules(2026, [{ year: 2026, rotRate: 0.3 }]).isOverridden).toBe(false);
  });
});

describe("RUT 50 %", () => {
  it("deducts half of the labour cost", () => {
    // Homepage example: flyttstäd 60 m², 8 400 kr before deduction → 4 200 kr.
    const p = calculatePrice({ deductionType: "rut", lines: lines(8_400), rules, eligible: true });
    expect(p.deduction).toBe(kr(4_200));
    expect(p.toPay).toBe(kr(4_200));
    expect(p.rate).toBe(0.5);
  });
});

describe("ROT 30 %", () => {
  it("deducts 30 % of the labour cost, never half", () => {
    const p = calculatePrice({ deductionType: "rot", lines: lines(10_000), rules, eligible: true });
    expect(p.deduction).toBe(kr(3_000));
    expect(p.toPay).toBe(kr(7_000));
  });
});

describe("labour only", () => {
  it("never deducts material or travel", () => {
    const p = calculatePrice({
      deductionType: "rut",
      lines: lines(10_000, 5_000, 500),
      rules,
      eligible: true,
    });
    expect(p.total).toBe(kr(15_500));
    expect(p.deductibleBase).toBe(kr(10_000));
    expect(p.deduction).toBe(kr(5_000));
    expect(p.toPay).toBe(kr(10_500));
  });

  it("ROT on labour only, with material", () => {
    const p = calculatePrice({
      deductionType: "rot",
      lines: lines(20_000, 12_000, 800),
      rules,
      eligible: true,
    });
    expect(p.deduction).toBe(kr(6_000));
    expect(p.toPay).toBe(kr(26_800));
  });
});

describe("yearly caps", () => {
  it("caps ROT at 50 000 kr per person", () => {
    const p = calculatePrice({ deductionType: "rot", lines: lines(200_000), rules, eligible: true });
    expect(p.buyers[0].uncapped).toBe(kr(60_000));
    expect(p.deduction).toBe(kr(50_000));
    expect(p.buyers[0].cappedBy).toBe("rot_cap");
    expect(p.capped).toBe(true);
  });

  it("caps RUT at 75 000 kr per person", () => {
    const p = calculatePrice({ deductionType: "rut", lines: lines(200_000), rules, eligible: true });
    expect(p.deduction).toBe(kr(75_000));
    expect(p.buyers[0].cappedBy).toBe("rut_cap");
  });

  it("caps ROT + RUT together at 75 000 kr", () => {
    // Already used 40 000 kr RUT: ROT room is min(50 000, 75 000 − 40 000) = 35 000.
    const p = calculatePrice({
      deductionType: "rot",
      lines: lines(200_000),
      rules,
      eligible: true,
      buyers: [{ sharePct: 100, usedRut: kr(40_000) }],
    });
    expect(p.deduction).toBe(kr(35_000));
    expect(p.buyers[0].cappedBy).toBe("combined_cap");
  });

  it("limits RUT when ROT has used part of the combined cap", () => {
    const p = calculatePrice({
      deductionType: "rut",
      lines: lines(100_000),
      rules,
      eligible: true,
      buyers: [{ sharePct: 100, usedRot: kr(50_000) }],
    });
    expect(p.deduction).toBe(kr(25_000));
    expect(p.buyers[0].cappedBy).toBe("combined_cap");
  });

  it("gives nothing when the cap is already used", () => {
    const p = calculatePrice({
      deductionType: "rot",
      lines: lines(10_000),
      rules,
      eligible: true,
      buyers: [{ sharePct: 100, usedRot: kr(50_000) }],
    });
    expect(p.deduction).toBe(0);
    expect(p.toPay).toBe(kr(10_000));
  });
});

describe("several buyers", () => {
  it("splits by share", () => {
    const p = calculatePrice({
      deductionType: "rut",
      lines: lines(10_000),
      rules,
      eligible: true,
      buyers: [{ sharePct: 70 }, { sharePct: 30 }],
    });
    expect(p.buyers.map((b) => b.deduction)).toEqual([kr(3_500), kr(1_500)]);
    expect(p.deduction).toBe(kr(5_000));
  });

  it("gives each buyer their own cap", () => {
    // 400 000 kr labour, ROT: 120 000 uncapped → 60 000 each → capped at 50 000 each.
    const p = calculatePrice({
      deductionType: "rot",
      lines: lines(400_000),
      rules,
      eligible: true,
      buyers: [{ sharePct: 50 }, { sharePct: 50 }],
    });
    expect(p.buyers.map((b) => b.deduction)).toEqual([kr(50_000), kr(50_000)]);
    expect(p.deduction).toBe(kr(100_000));
  });

  it("caps one buyer without affecting the other", () => {
    const p = calculatePrice({
      deductionType: "rot",
      lines: lines(100_000),
      rules,
      eligible: true,
      buyers: [{ sharePct: 50, usedRot: kr(45_000) }, { sharePct: 50 }],
    });
    expect(p.buyers.map((b) => b.deduction)).toEqual([kr(5_000), kr(15_000)]);
  });

  it("rejects shares that don't add up to 100 %", () => {
    expect(() =>
      calculatePrice({
        deductionType: "rut",
        lines: lines(1_000),
        rules,
        eligible: true,
        buyers: [{ sharePct: 50 }, { sharePct: 40 }],
      }),
    ).toThrow(PricingError);
  });

  it("splits evenly", () => {
    expect(evenShares(1)).toEqual([100]);
    expect(evenShares(2)).toEqual([50, 50]);
    expect(evenShares(3)).toEqual([34, 33, 33]);
  });
});

describe("second-hand / auction transport", () => {
  it("treats 50 % of the total as labour, so the deduction is 25 % of the total", () => {
    const p = calculatePrice({
      deductionType: "rut",
      lines: lines(2_000),
      rules,
      eligible: true,
      labourShareOfTotal: 0.5,
    });
    expect(p.deduction).toBe(kr(500));
    expect(p.toPay).toBe(kr(1_500));
  });

  it("uses the total price, including travel, as the base", () => {
    const p = calculatePrice({
      deductionType: "rut",
      lines: lines(1_600, 0, 400),
      rules,
      eligible: true,
      labourShareOfTotal: 0.5,
    });
    expect(p.deduction).toBe(kr(500));
  });
});

describe("no deduction when not eligible", () => {
  it("shows the full price", () => {
    const p = calculatePrice({ deductionType: "rut", lines: lines(8_400, 200), rules, eligible: false });
    expect(p.deduction).toBe(0);
    expect(p.toPay).toBe(kr(8_600));
    expect(p.rate).toBe(0);
  });

  it("applies to ROT and the special rule too", () => {
    const p = calculatePrice({
      deductionType: "rut",
      lines: lines(2_000),
      rules,
      eligible: false,
      labourShareOfTotal: 0.5,
    });
    expect(p.deduction).toBe(0);
  });
});

describe("rounding", () => {
  it("rounds each buyer's deduction down to whole kronor", () => {
    expect(floorToKrona(16_666.5)).toBe(16_600);
    const p = calculatePrice({
      deductionType: "rut",
      lines: { labour: 33_333, material: 0, travel: 0 },
      rules,
      eligible: true,
    });
    expect(p.deduction).toBe(16_600);
    expect(p.toPay).toBe(33_333 - 16_600);
  });

  it("widens display ranges to whole hundreds", () => {
    expect(roundRange([kr(3_810), kr(4_790)])).toEqual([kr(3_800), kr(4_800)]);
  });
});

describe("ranges", () => {
  it("computes before, deduction and after for min and max", () => {
    const r = calculateRange({
      deductionType: "rut",
      rules,
      eligible: true,
      min: lines(7_600),
      max: lines(9_600),
    });
    expect(r.before).toEqual([kr(7_600), kr(9_600)]);
    expect(r.deduction).toEqual([kr(3_800), kr(4_800)]);
    expect(r.after).toEqual([kr(3_800), kr(4_800)]);
  });
});
