import type { DeductionType } from "@/lib/taxRules";
import type { HousingType, RotKind } from "@/lib/catalog/types";

export type UsedThisYear = "ja" | "nej" | "vet_inte";

export interface EligibilityAnswers {
  age18?: boolean;
  taxSweden?: boolean;
  /** RUT: lives in the home, it's their holiday home, or their parents' home. */
  rutResidence?: boolean;
  /** ROT: owns the home (lagfart or bostadsrätt). */
  rotOwner?: boolean;
  /** ROT: building is more than 5 years old. */
  rotBuildingOver5?: boolean;
  buyerCount?: 1 | 2 | 3;
  usedThisYear?: UsedThisYear;
}

/** Why the deduction does not apply. Texts live in lib/i18n/sv.ts (eligibility.reasons). */
export type IneligibleReason =
  | "under18"
  | "noSwedishTax"
  | "rutNotResidence"
  | "rotRental"
  | "rotParentsHome"
  | "rotNotOwner"
  | "rotNewBuilding";

/** Things the customer should know even though the deduction may apply. */
export type EligibilityWarning = "rotRepairOnly" | "usedThisYear" | "checkRemaining";

export interface EligibilityResult {
  eligible: boolean;
  reasons: IneligibleReason[];
  warnings: EligibilityWarning[];
}

/** Which questions step 6 asks for this deduction type and home. */
export function eligibilityQuestions(type: DeductionType, housing?: HousingType) {
  const common = ["age18", "taxSweden"] as const;
  if (type === "rut") {
    // Choosing "Mina föräldrars hem" already answers the residence question.
    return housing === "foraldrar"
      ? [...common, "buyerCount", "usedThisYear"]
      : [...common, "rutResidence", "buyerCount", "usedThisYear"];
  }
  return [...common, "rotOwner", "rotBuildingOver5", "buyerCount", "usedThisYear"];
}

/**
 * Evaluates the step 6 answers. Unanswered questions count as "yes" so the estimate can be
 * shown while the customer is still answering. Never blocks the customer: an ineligible
 * result means we show the price without deduction and explain why.
 */
export function evaluateEligibility(params: {
  deductionType: DeductionType;
  rotKind: RotKind | null;
  housingType?: HousingType;
  answers: EligibilityAnswers;
}): EligibilityResult {
  const { deductionType, rotKind, housingType, answers } = params;
  const reasons: IneligibleReason[] = [];
  const warnings: EligibilityWarning[] = [];

  if (answers.age18 === false) reasons.push("under18");
  if (answers.taxSweden === false) reasons.push("noSwedishTax");

  if (deductionType === "rut") {
    if (answers.rutResidence === false && housingType !== "foraldrar") {
      reasons.push("rutNotResidence");
    }
  } else {
    if (housingType === "hyresratt") reasons.push("rotRental");
    else if (housingType === "foraldrar") reasons.push("rotParentsHome");
    else if (answers.rotOwner === false) reasons.push("rotNotOwner");

    if (answers.rotBuildingOver5 === false) {
      if (rotKind === "rebuild") reasons.push("rotNewBuilding");
      else warnings.push("rotRepairOnly");
    }
  }

  if (answers.usedThisYear === "ja") warnings.push("usedThisYear");
  if (answers.usedThisYear === "vet_inte") warnings.push("checkRemaining");

  return { eligible: reasons.length === 0, reasons, warnings };
}
