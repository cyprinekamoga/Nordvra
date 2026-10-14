import { describe, expect, it } from "vitest";
import {
  mapAddon,
  mapCatalog,
  mapCategory,
  mapPriceRange,
  mapPublicConfig,
  mapService,
  mapTaxOverride,
  toNumber,
  toNullableNumber,
} from "@/lib/catalog/map";
import { seedCatalog } from "@/lib/catalog/seed";
import type { Category, PriceRangeRow, Service, ServiceAddon } from "@/lib/catalog/types";

// Inverse mappers (app type → DB row) with numbers sent as strings, like `numeric` columns can be.
const str = (n: number | null) => (n === null ? null : String(n));

const categoryRow = (c: Category) => ({
  id: c.id,
  name: c.name,
  icon: c.icon,
  deduction_type: c.deductionType,
  sort: str(c.sort),
  active: c.active,
});

const serviceRow = (s: Service) => ({
  id: s.id,
  category_id: s.categoryId,
  extra_category_ids: s.extraCategoryIds,
  name: s.name,
  description: s.description,
  deduction_type: s.deductionType,
  model: s.model,
  rot_kind: s.rotKind,
  pricing_unit: s.pricingUnit,
  labour_share_of_total: s.labourShareOfTotal === null ? null : s.labourShareOfTotal.toFixed(3),
  form_kind: s.formKind,
  ask_home_details: s.askHomeDetails,
  uses_size_band: s.usesSizeBand,
  skv_work_type: s.skvWorkType,
  warning_ids: s.warningIds,
  sort: s.sort,
  active: s.active,
  updated_at: "2026-10-13T10:00:00Z",
});

const addonRow = (a: ServiceAddon) => ({
  id: a.id,
  service_id: a.serviceId,
  label: a.label,
  included: a.included,
  per_window: a.perWindow,
  labour_min_ore: str(a.labourMin),
  labour_max_ore: str(a.labourMax),
  sort: a.sort,
});

const rangeRow = (r: PriceRangeRow, id: number) => ({
  id,
  service_id: r.serviceId,
  size_band: r.sizeBand,
  labour_min_ore: str(r.labourMin),
  labour_max_ore: str(r.labourMax),
  material_min_ore: str(r.materialMin),
  material_max_ore: str(r.materialMax),
  travel_min_ore: r.travelMin,
  travel_max_ore: r.travelMax,
  note: r.note,
  updated_at: "2026-10-13T10:00:00Z",
});

describe("toNumber / toNullableNumber", () => {
  it("coerces numeric strings and rejects junk", () => {
    expect(toNumber("12.00")).toBe(12);
    expect(toNumber(" 0.500 ")).toBe(0.5);
    expect(toNumber(7)).toBe(7);
    expect(toNumber("abc", 3)).toBe(3);
    expect(toNumber("", 4)).toBe(4);
    expect(toNumber(null, 5)).toBe(5);
    expect(toNumber(Number.NaN, 6)).toBe(6);
    expect(toNullableNumber(null)).toBeNull();
    expect(toNullableNumber(undefined)).toBeNull();
    expect(toNullableNumber("x")).toBeNull();
    expect(toNullableNumber("0.3")).toBe(0.3);
  });
});

describe("row mappers round-trip the seed catalogue", () => {
  it("categories", () => {
    for (const c of seedCatalog.categories) expect(mapCategory(categoryRow(c))).toEqual(c);
  });
  it("services (numeric labour share as string)", () => {
    for (const s of seedCatalog.services) expect(mapService(serviceRow(s))).toEqual(s);
  });
  it("add-ons (öre as strings)", () => {
    for (const a of seedCatalog.addons) expect(mapAddon(addonRow(a))).toEqual(a);
  });
  it("price ranges", () => {
    seedCatalog.ranges.forEach((r, i) => expect(mapPriceRange(rangeRow(r, i + 1))).toEqual(r));
  });
});

describe("defensive mapping", () => {
  it("falls back on unknown enums and missing arrays", () => {
    const s = mapService({
      id: "x",
      category_id: "el",
      deduction_type: "rot",
      model: "weird",
      rot_kind: null,
      pricing_unit: "lightyears",
      form_kind: null,
      extra_category_ids: null,
      warning_ids: undefined,
      sort: "5",
    });
    expect(s.model).toBe("agent");
    expect(s.rotKind).toBe("repair");
    expect(s.pricingUnit).toBe("job");
    expect(s.formKind).toBe("standard");
    expect(s.extraCategoryIds).toEqual([]);
    expect(s.warningIds).toEqual([]);
    expect(s.sort).toBe(5);
    expect(s.labourShareOfTotal).toBeNull();
  });

  it("RUT services never get a rot kind", () => {
    expect(mapService({ id: "a", deduction_type: "rut", rot_kind: "rebuild" }).rotKind).toBeNull();
  });

  it("rounds öre and drops unknown size bands and empty notes", () => {
    const r = mapPriceRange({
      service_id: "s",
      size_band: "999+",
      labour_min_ore: "100.6",
      labour_max_ore: 200,
      note: "",
    });
    expect(r.sizeBand).toBeNull();
    expect(r.labourMin).toBe(101);
    expect(r.materialMin).toBe(0);
    expect(r.note).toBeNull();
  });
});

describe("public config", () => {
  const fallback = seedCatalog.config;

  it("maps surcharges and tax overrides, keeping only non-null override values", () => {
    const config = mapPublicConfig(
      {
        pets_surcharge_pct: "12.50",
        extra_floor_surcharge_pct: 6,
        tax_overrides: [
          { year: 2027, rut_rate: "0.500", rot_rate: null, rut_cap_ore: null, rot_cap_ore: "4000000", combined_cap_ore: null },
          { year: "bad" },
          null,
        ],
      },
      fallback,
    );
    expect(config.petsSurchargePct).toBe(12.5);
    expect(config.extraFloorSurchargePct).toBe(6);
    expect(config.taxOverrides).toEqual([{ year: 2027, rutRate: 0.5, rotCapPerPerson: 4_000_000 }]);
  });

  it("uses the fallback for missing or malformed config", () => {
    expect(mapPublicConfig(null, fallback)).toEqual(fallback);
    expect(mapPublicConfig([], fallback)).toEqual(fallback);
    expect(mapPublicConfig({}, fallback)).toEqual(fallback);
    expect(mapTaxOverride("nope")).toBeNull();
  });
});

describe("mapCatalog", () => {
  it("builds a database catalogue sorted by sort order", () => {
    const catalog = mapCatalog(
      {
        categories: [...seedCatalog.categories].reverse().map(categoryRow),
        services: seedCatalog.services.map(serviceRow),
        addons: seedCatalog.addons.map(addonRow),
        ranges: seedCatalog.ranges.map((r, i) => rangeRow(r, i)),
        config: { pets_surcharge_pct: 10, extra_floor_surcharge_pct: 5, tax_overrides: [] },
      },
      fallback(),
    );
    expect(catalog.source).toBe("database");
    expect(catalog.categories.map((c) => c.id)).toEqual(
      [...seedCatalog.categories].sort((a, b) => a.sort - b.sort).map((c) => c.id),
    );
    expect(catalog.services).toHaveLength(seedCatalog.services.length);
    expect(catalog.ranges).toEqual(seedCatalog.ranges);
    expect(catalog.config).toEqual(seedCatalog.config);
  });

  it("handles null data arrays", () => {
    const catalog = mapCatalog(
      { categories: null, services: undefined, addons: null, ranges: null, config: null },
      fallback(),
    );
    expect(catalog.categories).toEqual([]);
    expect(catalog.services).toEqual([]);
    expect(catalog.config).toEqual(seedCatalog.config);
  });
});

function fallback() {
  return seedCatalog.config;
}
