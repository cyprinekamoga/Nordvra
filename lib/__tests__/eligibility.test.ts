import { describe, expect, it } from "vitest";
import { eligibilityQuestions, evaluateEligibility } from "@/lib/eligibility";

const yes = { age18: true, taxSweden: true, rutResidence: true, rotOwner: true, rotBuildingOver5: true };

describe("evaluateEligibility", () => {
  it("RUT: all yes → eligible", () => {
    const r = evaluateEligibility({ deductionType: "rut", rotKind: null, housingType: "hyresratt", answers: yes });
    expect(r).toEqual({ eligible: true, reasons: [], warnings: [] });
  });

  it("under 18 or no Swedish tax → not eligible", () => {
    const r = evaluateEligibility({
      deductionType: "rut",
      rotKind: null,
      housingType: "villa",
      answers: { ...yes, age18: false, taxSweden: false },
    });
    expect(r.eligible).toBe(false);
    expect(r.reasons).toEqual(["under18", "noSwedishTax"]);
  });

  it("RUT in parents' home needs no residence answer", () => {
    const r = evaluateEligibility({
      deductionType: "rut",
      rotKind: null,
      housingType: "foraldrar",
      answers: { age18: true, taxSweden: true, rutResidence: false },
    });
    expect(r.eligible).toBe(true);
  });

  it("RUT where the customer doesn't live → not eligible", () => {
    const r = evaluateEligibility({
      deductionType: "rut",
      rotKind: null,
      housingType: "villa",
      answers: { ...yes, rutResidence: false },
    });
    expect(r.reasons).toEqual(["rutNotResidence"]);
  });

  it("ROT in a rental flat → not eligible", () => {
    const r = evaluateEligibility({ deductionType: "rot", rotKind: "repair", housingType: "hyresratt", answers: yes });
    expect(r.reasons).toEqual(["rotRental"]);
  });

  it("ROT without owning → not eligible", () => {
    const r = evaluateEligibility({
      deductionType: "rot",
      rotKind: "repair",
      housingType: "villa",
      answers: { ...yes, rotOwner: false },
    });
    expect(r.reasons).toEqual(["rotNotOwner"]);
  });

  it("ROT in a house under 5 years: rebuild not eligible, repair eligible with warning", () => {
    const answers = { ...yes, rotBuildingOver5: false };
    const rebuild = evaluateEligibility({ deductionType: "rot", rotKind: "rebuild", housingType: "villa", answers });
    expect(rebuild.reasons).toEqual(["rotNewBuilding"]);
    const repair = evaluateEligibility({ deductionType: "rot", rotKind: "repair", housingType: "villa", answers });
    expect(repair.eligible).toBe(true);
    expect(repair.warnings).toEqual(["rotRepairOnly"]);
  });

  it("warns when the deduction may already be used", () => {
    const r = evaluateEligibility({
      deductionType: "rut",
      rotKind: null,
      housingType: "villa",
      answers: { ...yes, usedThisYear: "ja" },
    });
    expect(r.eligible).toBe(true);
    expect(r.warnings).toEqual(["usedThisYear"]);
  });

  it("asks the right questions", () => {
    expect(eligibilityQuestions("rut", "villa")).toContain("rutResidence");
    expect(eligibilityQuestions("rut", "foraldrar")).not.toContain("rutResidence");
    expect(eligibilityQuestions("rot", "villa")).toEqual([
      "age18",
      "taxSweden",
      "rotOwner",
      "rotBuildingOver5",
      "buyerCount",
      "usedThisYear",
    ]);
  });
});
