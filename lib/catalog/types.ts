import type { DeductionType, TaxRuleOverride } from "@/lib/taxRules";

export const SIZE_BANDS = ["0-39", "40-59", "60-79", "80-99", "100-129", "130-159", "160+"] as const;
export type SizeBand = (typeof SIZE_BANDS)[number];

export const HOUSING_TYPES = ["hyresratt", "bostadsratt", "villa", "fritidshus", "foraldrar"] as const;
export type HousingType = (typeof HOUSING_TYPES)[number];

export const FREQUENCIES = ["en_gang", "varje_vecka", "varannan_vecka", "var_fjarde_vecka"] as const;
export type Frequency = (typeof FREQUENCIES)[number];

export const TIME_WINDOWS = ["formiddag", "eftermiddag", "flexibel"] as const;
export type TimeWindow = (typeof TIME_WINDOWS)[number];

/**
 * seller = TO Städ och Flytt is the seller of record (invoices, applies for RUT, liable).
 * agent  = a partner company quotes, invoices and applies for ROT; we only arrange the booking.
 */
export type ServiceModel = "seller" | "agent";

/** ROT: repairs/maintenance qualify regardless of the building's age, rebuilds need 5 years. */
export type RotKind = "repair" | "rebuild";

/** What the indicative price is expressed in. */
export type PricingUnit = "job" | "visit" | "hour" | "window" | "m2";

/** Which extra questions step 3 asks for this service. */
export type FormKind = "flyttstad" | "hemstad" | "storstad" | "fonster" | "vitvaror" | "standard";

export interface Category {
  id: string;
  name: string;
  icon: string;
  deductionType: DeductionType;
  sort: number;
  active: boolean;
}

export interface Service {
  id: string;
  categoryId: string;
  /** Also listed under these categories (e.g. Fönsterputs under Städning). */
  extraCategoryIds: string[];
  name: string;
  description: string;
  deductionType: DeductionType;
  model: ServiceModel;
  rotKind: RotKind | null;
  pricingUnit: PricingUnit;
  /** Special rule: deductible base is this share of the total price (second-hand transport). */
  labourShareOfTotal: number | null;
  formKind: FormKind;
  /** Ask about floors and pets in step 3. */
  askHomeDetails: boolean;
  /** Price depends on the size band. */
  usesSizeBand: boolean;
  /** Work type as named in Skatteverket's claim form, used in the CSV export. */
  skvWorkType: string;
  /** Ids from lib/content/notDeductible.ts to warn about on this service. */
  warningIds: string[];
  sort: number;
  active: boolean;
}

export interface ServiceAddon {
  id: string;
  serviceId: string;
  label: string;
  /** Shown as a chip, but already part of the standard price. */
  included: boolean;
  /** Price is per window (multiplied by the number of windows) instead of per job. */
  perWindow: boolean;
  labourMin: number;
  labourMax: number;
  sort: number;
}

/** Indicative price range before deduction, incl. VAT, in öre, split by line. */
export interface PriceRangeRow {
  serviceId: string;
  /** null = applies regardless of size. */
  sizeBand: SizeBand | null;
  labourMin: number;
  labourMax: number;
  materialMin: number;
  materialMax: number;
  travelMin: number;
  travelMax: number;
  note: string | null;
}

export interface PublicConfig {
  petsSurchargePct: number;
  extraFloorSurchargePct: number;
  taxOverrides: TaxRuleOverride[];
}

export interface Catalog {
  categories: Category[];
  services: Service[];
  addons: ServiceAddon[];
  ranges: PriceRangeRow[];
  config: PublicConfig;
  /** "database" in production; "seed" when Supabase isn't configured (local dev, tests). */
  source: "database" | "seed";
}

export function servicesInCategory(catalog: Catalog, categoryId: string): Service[] {
  return catalog.services
    .filter(
      (s) => s.active && (s.categoryId === categoryId || s.extraCategoryIds.includes(categoryId)),
    )
    .sort((a, b) => a.sort - b.sort);
}
