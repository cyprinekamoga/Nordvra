/**
 * RUT and ROT rules, one entry per income year.
 *
 * HOW TO UPDATE EACH YEAR
 * 1. Check Skatteverket ("Så fungerar rutavdraget" / "Så fungerar rotavdraget") and the
 *    budget bill (budgetpropositionen, presented each autumn) for the coming year.
 * 2. Copy the latest entry below, change `year` and any changed values, and update `source`.
 * 3. Run `npm test` – the tests in lib/pricing/__tests__ pin the 2026 values and must keep passing.
 * 4. Admins can override a single year from /admin/installningar without a deploy; the
 *    admin page warns when an override differs from this file.
 *
 * All money is in öre (1 kr = 100 öre) to avoid floating-point rounding errors.
 * The tax year that applies is the year the customer PAYS (Skatteverket uses the payment
 * date). We approximate this with the job date when estimating.
 */

export type DeductionType = "rut" | "rot";

export interface TaxYearRules {
  year: number;
  /** Share of the labour cost (incl. VAT) that is deducted for RUT, e.g. 0.5 = 50 %. */
  rutRate: number;
  /** Share of the labour cost (incl. VAT) that is deducted for ROT, e.g. 0.3 = 30 %. */
  rotRate: number;
  /** Max RUT deduction per person and year, in öre. */
  rutCapPerPerson: number;
  /** Max ROT deduction per person and year, in öre. */
  rotCapPerPerson: number;
  /** Max RUT + ROT together per person and year, in öre. */
  combinedCapPerPerson: number;
  /**
   * Special rule for transport of household goods to second hand / auction:
   * Skatteverket treats this share of the TOTAL price as labour.
   */
  secondHandTransportLabourShare: number;
  /** Buyer must turn at least this age during the income year. */
  minimumAge: number;
  /** ROT: rebuilding/extensions only qualify when the house is at least this many years old. */
  rotMinBuildingAgeYears: number;
  /** Where the numbers come from. Shown in the admin. */
  source: string;
}

const KR = 100;

export const TAX_RULES: Record<number, TaxYearRules> = {
  2026: {
    year: 2026,
    rutRate: 0.5,
    // The temporary 50 % ROT rate ended 31 Dec 2025.
    rotRate: 0.3,
    rutCapPerPerson: 75_000 * KR,
    rotCapPerPerson: 50_000 * KR,
    combinedCapPerPerson: 75_000 * KR,
    secondHandTransportLabourShare: 0.5,
    minimumAge: 18,
    rotMinBuildingAgeYears: 5,
    source: "Skatteverket, regler från 1 januari 2026",
  },
  // 2027: add here once the budget bill for 2027 has been decided.
};

export type TaxRuleOverride = Partial<Omit<TaxYearRules, "year" | "source">> & {
  year: number;
};

export interface ResolvedTaxRules extends TaxYearRules {
  /** True when no rules exist for the requested year and an earlier year was used. */
  isFallback: boolean;
  /** True when an admin override changed at least one value. */
  isOverridden: boolean;
}

export function knownTaxYears(): number[] {
  return Object.keys(TAX_RULES)
    .map(Number)
    .sort((a, b) => a - b);
}

/**
 * Rules for a given year. If the year is not defined yet, the closest earlier year is used
 * and `isFallback` is set so the UI can warn. Overrides from the database win over the file.
 */
export function getTaxRules(
  year: number,
  overrides: TaxRuleOverride[] = [],
): ResolvedTaxRules {
  const years = knownTaxYears();
  const exact = TAX_RULES[year];
  const baseYear =
    exact?.year ?? [...years].reverse().find((y) => y <= year) ?? years[0];
  const base = TAX_RULES[baseYear];

  const override = overrides.find((o) => o.year === year);
  const merged: TaxYearRules = { ...base, year };
  let isOverridden = false;
  if (override) {
    for (const [key, value] of Object.entries(override)) {
      if (key === "year" || value === undefined || value === null) continue;
      const k = key as keyof TaxYearRules;
      if (merged[k] !== value) isOverridden = true;
      (merged as unknown as Record<string, unknown>)[k] = value;
    }
  }

  return { ...merged, isFallback: !exact, isOverridden };
}

export function rateFor(rules: TaxYearRules, type: DeductionType): number {
  return type === "rut" ? rules.rutRate : rules.rotRate;
}

/** "50 %" / "30 %" for labels and badges. */
export function ratePercent(rules: TaxYearRules, type: DeductionType): number {
  return Math.round(rateFor(rules, type) * 100);
}

export function taxYearForDate(date: string | Date | undefined, fallbackYear: number): number {
  if (!date) return fallbackYear;
  const d = typeof date === "string" ? new Date(`${date}T12:00:00`) : date;
  const y = d.getFullYear();
  return Number.isFinite(y) ? y : fallbackYear;
}

/** The latest rules shipped with this build (used for marketing copy and badges). */
export const CURRENT_RULES: TaxYearRules = TAX_RULES[knownTaxYears().at(-1)!];
