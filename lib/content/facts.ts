import { calculatePrice, type PriceBreakdown } from "@/lib/pricing/calculate";
import { formatKr } from "@/lib/format";
import { CURRENT_RULES, ratePercent, type TaxYearRules } from "@/lib/taxRules";

/**
 * Tax facts for marketing and legal copy, always derived from `lib/taxRules.ts` so that a
 * change of rate or cap there updates every page. Never hard-code 50 / 30 / 75 000 / 50 000
 * in content – read them from here.
 */
export interface TaxFacts {
  year: number;
  /** "50 %" */
  rutRate: string;
  /** "30 %" */
  rotRate: string;
  rutRateNumber: number;
  rotRateNumber: number;
  /** "75 000 kr" – RUT + ROT together per person and year. */
  combinedCap: string;
  /** "75 000 kr" */
  rutCap: string;
  /** "50 000 kr" */
  rotCap: string;
  /** True when RUT on its own can use the whole combined cap (the case in 2026). */
  rutCapIsCombined: boolean;
  /** 18 */
  minimumAge: number;
  /** 5 */
  rotMinBuildingAgeYears: number;
  /** Where the rules come from, e.g. "Skatteverket, regler från 1 januari 2026". */
  source: string;
}

export function taxFacts(rules: TaxYearRules = CURRENT_RULES): TaxFacts {
  return {
    year: rules.year,
    rutRate: `${ratePercent(rules, "rut")} %`,
    rotRate: `${ratePercent(rules, "rot")} %`,
    rutRateNumber: ratePercent(rules, "rut"),
    rotRateNumber: ratePercent(rules, "rot"),
    combinedCap: formatKr(rules.combinedCapPerPerson),
    rutCap: formatKr(rules.rutCapPerPerson),
    rotCap: formatKr(rules.rotCapPerPerson),
    rutCapIsCombined: rules.rutCapPerPerson >= rules.combinedCapPerPerson,
    minimumAge: rules.minimumAge,
    rotMinBuildingAgeYears: rules.rotMinBuildingAgeYears,
    source: rules.source,
  };
}

/** Variables for `fmt()` templates in lib/i18n/sv/content.ts ("{rutRate}", "{combinedCap}" …). */
export function taxFactVars(rules: TaxYearRules = CURRENT_RULES): Record<string, string | number> {
  const f = taxFacts(rules);
  return {
    year: f.year,
    rutRate: f.rutRate,
    rotRate: f.rotRate,
    combinedCap: f.combinedCap,
    rutCap: f.rutCap,
    rotCap: f.rotCap,
    minimumAge: f.minimumAge,
    rotYears: f.rotMinBuildingAgeYears,
  };
}

/**
 * The cap rule in one sentence (SPEC §5.4), built from the rules:
 * "Max 75 000 kr per person och år för RUT och ROT tillsammans, varav max 50 000 kr för ROT."
 * If a future year gives RUT a lower cap of its own, that is mentioned as well.
 */
export function capSentence(rules: TaxYearRules = CURRENT_RULES): string {
  const f = taxFacts(rules);
  const parts = [`max ${f.rotCap} för ROT`];
  if (!f.rutCapIsCombined) parts.unshift(`max ${f.rutCap} för RUT`);
  return `Max ${f.combinedCap} per person och år för RUT och ROT tillsammans, varav ${parts.join(" och ")}.`;
}

export interface PriceExample {
  /** "Flyttstäd 60 m²" */
  label: string;
  type: "rut" | "rot";
  breakdown: PriceBreakdown;
}

/** Labour for the homepage example (SPEC §12): flyttstäd 60 m², 8 400 kr before deduction. */
export const FLYTTSTAD_EXAMPLE_LABOUR_ORE = 840_000;

/** "Flyttstäd 60 m²: Pris före avdrag 8 400 kr → du betalar 4 200 kr", computed with calculatePrice. */
export function flyttstadExample(rules: TaxYearRules = CURRENT_RULES): PriceExample {
  return {
    label: "Flyttstäd 60 m²",
    type: "rut",
    breakdown: calculatePrice({
      deductionType: "rut",
      lines: { labour: FLYTTSTAD_EXAMPLE_LABOUR_ORE, material: 0, travel: 0 },
      rules,
      eligible: true,
    }),
  };
}

/** ROT example with material, to show that only labour gives a deduction. */
export const PAINTING_EXAMPLE = { labour: 2_000_000, material: 500_000, travel: 0 } as const;

export function paintingExample(rules: TaxYearRules = CURRENT_RULES): PriceExample {
  return {
    label: "Målning inomhus",
    type: "rot",
    breakdown: calculatePrice({
      deductionType: "rot",
      lines: { ...PAINTING_EXAMPLE },
      rules,
      eligible: true,
    }),
  };
}
