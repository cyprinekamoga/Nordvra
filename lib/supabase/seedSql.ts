import {
  addons as seedAddons,
  categories as seedCategories,
  ranges as seedRanges,
  services as seedServices,
} from "@/lib/catalog/seed";
import type { Category, PriceRangeRow, Service, ServiceAddon } from "@/lib/catalog/types";

/**
 * Builds `supabase/seed.sql` from the seed catalogue in `lib/catalog/seed.ts`.
 *
 * Pure (no I/O) so it can be unit-tested; `scripts/generate-seed.ts` writes the file.
 * Every statement is idempotent so the seed can be re-run:
 *  - catalogue rows use `on conflict … do update` (re-running resets them to the seed values),
 *  - the admin user and the settings row use `on conflict do nothing`,
 *  - our own-staff partner row is only inserted when no `is_own_company` row exists.
 * Nothing is ever deleted.
 */

export const SEED_ADMIN_EMAIL = "cyprinekamoga@gmail.com";

export const OWN_COMPANY_PARTNER = {
  name: "TO Städ och Flytt (egen personal)",
  orgNr: "TODO",
  regions: ["Södermanlands län"],
  postcodePrefixes: ["63", "64"],
  commissionPct: 0,
  notes: "Fyll i org.nr och verifiera F-skatt innan tilldelning.",
} as const;

export interface SeedData {
  categories: Category[];
  services: Service[];
  addons: ServiceAddon[];
  ranges: PriceRangeRow[];
}

export interface SeedStatement {
  /** Short label, e.g. "services 1/3", used for logging and for applying the seed in chunks. */
  label: string;
  /** Number of data rows the statement writes (0 for the conditional partner insert). */
  rows: number;
  sql: string;
}

export const defaultSeedData: SeedData = {
  categories: seedCategories,
  services: seedServices,
  addons: seedAddons,
  ranges: seedRanges,
};

// ───────────────────────────── SQL literal helpers ─────────────────────────────

/** 'text' with single quotes doubled (standard_conforming_strings is on in Postgres ≥ 9.1). */
export function sqlText(value: string): string {
  if (value.includes("\0")) throw new Error("NUL bytes are not allowed in SQL text");
  return `'${value.replace(/'/g, "''")}'`;
}

export function sqlNullableText(value: string | null | undefined): string {
  return value == null ? "null" : sqlText(value);
}

export function sqlTextArray(values: readonly string[]): string {
  return values.length === 0 ? "'{}'::text[]" : `array[${values.map(sqlText).join(", ")}]::text[]`;
}

export function sqlEnum(value: string | null | undefined, type: string): string {
  return value == null ? "null" : `${sqlText(value)}::public.${type}`;
}

export function sqlInt(value: number): string {
  if (!Number.isInteger(value)) throw new Error(`Expected an integer, got ${value}`);
  return String(value);
}

export function sqlNumeric(value: number | null | undefined): string {
  if (value == null) return "null";
  if (!Number.isFinite(value)) throw new Error(`Expected a finite number, got ${value}`);
  return String(value);
}

export function sqlBool(value: boolean): string {
  return value ? "true" : "false";
}

function chunk<T>(items: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

function upsert(params: {
  table: string;
  columns: string[];
  rows: string[][];
  conflict: string[];
  label: string;
  maxRows: number;
}): SeedStatement[] {
  const { table, columns, rows, conflict, label, maxRows } = params;
  const updates = columns
    .filter((c) => !conflict.includes(c))
    .map((c) => `  ${c} = excluded.${c}`)
    .join(",\n");
  const parts = chunk(rows, maxRows);
  return parts.map((part, i) => ({
    label: parts.length > 1 ? `${label} ${i + 1}/${parts.length}` : label,
    rows: part.length,
    sql:
      `insert into public.${table} (${columns.join(", ")}) values\n` +
      part.map((r) => `  (${r.join(", ")})`).join(",\n") +
      `\non conflict (${conflict.join(", ")}) do update set\n${updates};`,
  }));
}

// ───────────────────────────── Statements ─────────────────────────────

export function buildSeedStatements(
  data: SeedData = defaultSeedData,
  options: { maxRowsPerStatement?: number } = {},
): SeedStatement[] {
  const maxRows = options.maxRowsPerStatement ?? 25;

  const rangeKeys = new Set<string>();
  for (const r of data.ranges) {
    const key = `${r.serviceId}|${r.sizeBand ?? ""}`;
    if (rangeKeys.has(key)) throw new Error(`Duplicate price range for ${key}`);
    rangeKeys.add(key);
  }

  const categories = upsert({
    table: "categories",
    label: "categories",
    maxRows,
    columns: ["id", "name", "icon", "deduction_type", "sort", "active"],
    conflict: ["id"],
    rows: data.categories.map((c) => [
      sqlText(c.id),
      sqlText(c.name),
      sqlText(c.icon),
      sqlEnum(c.deductionType, "deduction_type"),
      sqlInt(c.sort),
      sqlBool(c.active),
    ]),
  });

  const services = upsert({
    table: "services",
    label: "services",
    maxRows,
    columns: [
      "id",
      "category_id",
      "extra_category_ids",
      "name",
      "description",
      "deduction_type",
      "model",
      "rot_kind",
      "pricing_unit",
      "labour_share_of_total",
      "form_kind",
      "ask_home_details",
      "uses_size_band",
      "skv_work_type",
      "warning_ids",
      "sort",
      "active",
    ],
    conflict: ["id"],
    rows: data.services.map((s) => [
      sqlText(s.id),
      sqlText(s.categoryId),
      sqlTextArray(s.extraCategoryIds),
      sqlText(s.name),
      sqlText(s.description),
      sqlEnum(s.deductionType, "deduction_type"),
      sqlEnum(s.model, "service_model"),
      sqlEnum(s.rotKind, "rot_kind"),
      sqlEnum(s.pricingUnit, "pricing_unit"),
      sqlNumeric(s.labourShareOfTotal),
      sqlEnum(s.formKind, "form_kind"),
      sqlBool(s.askHomeDetails),
      sqlBool(s.usesSizeBand),
      sqlText(s.skvWorkType),
      sqlTextArray(s.warningIds),
      sqlInt(s.sort),
      sqlBool(s.active),
    ]),
  });

  const addons = upsert({
    table: "service_addons",
    label: "service_addons",
    maxRows,
    columns: ["id", "service_id", "label", "included", "per_window", "labour_min_ore", "labour_max_ore", "sort"],
    conflict: ["id"],
    rows: data.addons.map((a) => [
      sqlText(a.id),
      sqlText(a.serviceId),
      sqlText(a.label),
      sqlBool(a.included),
      sqlBool(a.perWindow),
      sqlInt(a.labourMin),
      sqlInt(a.labourMax),
      sqlInt(a.sort),
    ]),
  });

  const ranges = upsert({
    table: "price_ranges",
    label: "price_ranges",
    maxRows,
    columns: [
      "service_id",
      "size_band",
      "labour_min_ore",
      "labour_max_ore",
      "material_min_ore",
      "material_max_ore",
      "travel_min_ore",
      "travel_max_ore",
      "note",
    ],
    // unique nulls not distinct (service_id, size_band): rows without a size band conflict too.
    conflict: ["service_id", "size_band"],
    rows: data.ranges.map((r) => [
      sqlText(r.serviceId),
      sqlEnum(r.sizeBand, "size_band"),
      sqlInt(r.labourMin),
      sqlInt(r.labourMax),
      sqlInt(r.materialMin),
      sqlInt(r.materialMax),
      sqlInt(r.travelMin),
      sqlInt(r.travelMax),
      sqlNullableText(r.note),
    ]),
  });

  const settings: SeedStatement = {
    label: "settings",
    rows: 1,
    sql: "insert into public.settings (id) values (1) on conflict (id) do nothing;",
  };

  const admin: SeedStatement = {
    label: "admin_users",
    rows: 1,
    sql:
      `insert into public.admin_users (email, added_by) values (${sqlText(SEED_ADMIN_EMAIL)}, 'seed')\n` +
      "on conflict (email) do nothing;",
  };

  const rutServiceIds = data.services.filter((s) => s.deductionType === "rut").map((s) => s.id);
  const p = OWN_COMPANY_PARTNER;
  const partner: SeedStatement = {
    label: "partners (own staff)",
    rows: 0,
    sql:
      "insert into public.partners (\n" +
      "  name, org_nr, is_own_company, f_skatt_verified, service_ids, regions, postcode_prefixes,\n" +
      "  commission_pct, notes\n" +
      ")\n" +
      `select ${sqlText(p.name)}, ${sqlText(p.orgNr)}, true, false,\n` +
      `  ${sqlTextArray(rutServiceIds)},\n` +
      `  ${sqlTextArray(p.regions)}, ${sqlTextArray(p.postcodePrefixes)},\n` +
      `  ${sqlNumeric(p.commissionPct)}, ${sqlText(p.notes)}\n` +
      "where not exists (select 1 from public.partners where is_own_company);",
  };

  return [...categories, ...services, ...addons, ...ranges, settings, admin, partner];
}

export function buildSeedSql(data: SeedData = defaultSeedData): string {
  const header = [
    "-- Nordvra – seed data. GENERATED FILE, do not edit by hand.",
    "-- Source: lib/catalog/seed.ts. Regenerate with: npm run db:seed:generate",
    "--",
    "-- Idempotent: re-running resets catalogue rows (categories, services, add-ons, price ranges)",
    "-- to the seed values, and never deletes anything. The admin user, the settings row and the",
    "-- own-staff partner are only inserted when missing.",
    "",
  ].join("\n");
  const body = buildSeedStatements(data)
    .map((s) => `-- ${s.label}\n${s.sql}`)
    .join("\n\n");
  return `${header}\n${body}\n`;
}
