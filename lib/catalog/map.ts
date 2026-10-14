import type {
  Catalog,
  Category,
  FormKind,
  PriceRangeRow,
  PricingUnit,
  PublicConfig,
  RotKind,
  Service,
  ServiceAddon,
  ServiceModel,
  SizeBand,
} from "@/lib/catalog/types";
import { SIZE_BANDS } from "@/lib/catalog/types";
import type { Tables } from "@/lib/supabase/database.types";
import type { DeductionType, TaxRuleOverride } from "@/lib/taxRules";

/**
 * Pure mappers from Supabase rows (snake_case) to the app's catalogue types (camelCase).
 *
 * PostgREST returns `numeric` columns as numbers today, but older drivers, views and RPCs can
 * hand them over as strings ("0.500", "12.00"), so every number is coerced. Unknown enum values
 * fall back to a safe default instead of crashing the booking flow.
 */

export type CategoryRow = Tables<"categories">;
export type ServiceRow = Tables<"services">;
export type ServiceAddonRow = Tables<"service_addons">;
export type PriceRangeDbRow = Tables<"price_ranges">;

/** Loosely typed rows: numbers may be strings, arrays may be null. */
type Loose<T> = { [K in keyof T]?: unknown };

/** Number or numeric string → finite number, otherwise `fallback`. */
export function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value.trim());
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}

/** Like `toNumber`, but null/undefined/unparseable stay null. */
export function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = toNumber(value, Number.NaN);
  return Number.isNaN(n) ? null : n;
}

/** Öre are always whole numbers. */
function toOre(value: unknown): number {
  return Math.round(toNumber(value, 0));
}

function toBool(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (value === "true" || value === "t") return true;
  if (value === "false" || value === "f") return false;
  return fallback;
}

function toStr(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : value == null ? fallback : String(value);
}

function toStrArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

const DEDUCTION_TYPES: readonly DeductionType[] = ["rut", "rot"];
const MODELS: readonly ServiceModel[] = ["seller", "agent"];
const ROT_KINDS: readonly RotKind[] = ["repair", "rebuild"];
const PRICING_UNITS: readonly PricingUnit[] = ["job", "visit", "hour", "window", "m2"];
const FORM_KINDS: readonly FormKind[] = [
  "flyttstad",
  "hemstad",
  "storstad",
  "fonster",
  "vitvaror",
  "standard",
];

export function mapCategory(row: Loose<CategoryRow>): Category {
  return {
    id: toStr(row.id),
    name: toStr(row.name),
    icon: toStr(row.icon),
    deductionType: oneOf(row.deduction_type, DEDUCTION_TYPES, "rut"),
    sort: toNumber(row.sort, 0),
    active: toBool(row.active, true),
  };
}

export function mapService(row: Loose<ServiceRow>): Service {
  const deductionType = oneOf(row.deduction_type, DEDUCTION_TYPES, "rut");
  const rotKind =
    row.rot_kind === null || row.rot_kind === undefined
      ? null
      : oneOf<RotKind>(row.rot_kind, ROT_KINDS, "repair");
  return {
    id: toStr(row.id),
    categoryId: toStr(row.category_id),
    extraCategoryIds: toStrArray(row.extra_category_ids),
    name: toStr(row.name),
    description: toStr(row.description),
    deductionType,
    model: oneOf(row.model, MODELS, deductionType === "rut" ? "seller" : "agent"),
    // ROT services always need a kind (repair qualifies regardless of building age).
    rotKind: deductionType === "rot" ? (rotKind ?? "repair") : null,
    pricingUnit: oneOf(row.pricing_unit, PRICING_UNITS, "job"),
    labourShareOfTotal: toNullableNumber(row.labour_share_of_total),
    formKind: oneOf(row.form_kind, FORM_KINDS, "standard"),
    askHomeDetails: toBool(row.ask_home_details),
    usesSizeBand: toBool(row.uses_size_band),
    skvWorkType: toStr(row.skv_work_type),
    warningIds: toStrArray(row.warning_ids),
    sort: toNumber(row.sort, 0),
    active: toBool(row.active, true),
  };
}

export function mapAddon(row: Loose<ServiceAddonRow>): ServiceAddon {
  return {
    id: toStr(row.id),
    serviceId: toStr(row.service_id),
    label: toStr(row.label),
    included: toBool(row.included),
    perWindow: toBool(row.per_window),
    labourMin: toOre(row.labour_min_ore),
    labourMax: toOre(row.labour_max_ore),
    sort: toNumber(row.sort, 0),
  };
}

export function mapPriceRange(row: Loose<PriceRangeDbRow>): PriceRangeRow {
  const band = row.size_band;
  return {
    serviceId: toStr(row.service_id),
    sizeBand:
      typeof band === "string" && (SIZE_BANDS as readonly string[]).includes(band)
        ? (band as SizeBand)
        : null,
    labourMin: toOre(row.labour_min_ore),
    labourMax: toOre(row.labour_max_ore),
    materialMin: toOre(row.material_min_ore),
    materialMax: toOre(row.material_max_ore),
    travelMin: toOre(row.travel_min_ore),
    travelMax: toOre(row.travel_max_ore),
    note: typeof row.note === "string" && row.note !== "" ? row.note : null,
  };
}

/** One row of `public_config().tax_overrides` → `TaxRuleOverride` (only non-null values). */
export function mapTaxOverride(raw: unknown): TaxRuleOverride | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const year = toNullableNumber(r.year);
  if (year === null || !Number.isInteger(year)) return null;
  const override: TaxRuleOverride = { year };
  const rutRate = toNullableNumber(r.rut_rate);
  const rotRate = toNullableNumber(r.rot_rate);
  const rutCap = toNullableNumber(r.rut_cap_ore);
  const rotCap = toNullableNumber(r.rot_cap_ore);
  const combinedCap = toNullableNumber(r.combined_cap_ore);
  if (rutRate !== null) override.rutRate = rutRate;
  if (rotRate !== null) override.rotRate = rotRate;
  if (rutCap !== null) override.rutCapPerPerson = Math.round(rutCap);
  if (rotCap !== null) override.rotCapPerPerson = Math.round(rotCap);
  if (combinedCap !== null) override.combinedCapPerPerson = Math.round(combinedCap);
  return override;
}

/** `rpc('public_config')` JSON → `PublicConfig`, with `fallback` for anything missing. */
export function mapPublicConfig(raw: unknown, fallback: PublicConfig): PublicConfig {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ...fallback, taxOverrides: [...fallback.taxOverrides] };
  }
  const r = raw as Record<string, unknown>;
  const overrides = Array.isArray(r.tax_overrides)
    ? r.tax_overrides.map(mapTaxOverride).filter((o): o is TaxRuleOverride => o !== null)
    : [...fallback.taxOverrides];
  return {
    petsSurchargePct: toNumber(r.pets_surcharge_pct, fallback.petsSurchargePct),
    extraFloorSurchargePct: toNumber(r.extra_floor_surcharge_pct, fallback.extraFloorSurchargePct),
    taxOverrides: overrides,
  };
}

const bySort = <T extends { sort: number }>(a: T, b: T) => a.sort - b.sort;

export interface CatalogRows {
  categories: readonly Loose<CategoryRow>[] | null | undefined;
  services: readonly Loose<ServiceRow>[] | null | undefined;
  addons: readonly Loose<ServiceAddonRow>[] | null | undefined;
  ranges: readonly Loose<PriceRangeDbRow>[] | null | undefined;
  config: unknown;
}

/** Maps all catalogue rows at once. Categories, services and add-ons come back sorted. */
export function mapCatalog(rows: CatalogRows, fallbackConfig: PublicConfig): Catalog {
  return {
    categories: (rows.categories ?? []).map(mapCategory).sort(bySort),
    services: (rows.services ?? []).map(mapService).sort(bySort),
    addons: (rows.addons ?? []).map(mapAddon).sort(bySort),
    ranges: (rows.ranges ?? []).map(mapPriceRange),
    config: mapPublicConfig(rows.config, fallbackConfig),
    source: "database",
  };
}
