import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { addons, categories, ranges, services } from "@/lib/catalog/seed";
import {
  SEED_ADMIN_EMAIL,
  buildSeedSql,
  buildSeedStatements,
  defaultSeedData,
  sqlEnum,
  sqlInt,
  sqlNullableText,
  sqlNumeric,
  sqlText,
  sqlTextArray,
} from "@/lib/supabase/seedSql";

const rowsFor = (prefix: string) =>
  buildSeedStatements()
    .filter((s) => s.label.startsWith(prefix))
    .reduce((sum, s) => sum + s.rows, 0);

describe("SQL literal helpers", () => {
  it("doubles single quotes and rejects NUL bytes", () => {
    expect(sqlText("Kyl och frys")).toBe("'Kyl och frys'");
    expect(sqlText("O'Brien")).toBe("'O''Brien'");
    expect(sqlText("'; drop table x; --")).toBe("'''; drop table x; --'");
    expect(() => sqlText("a\0b")).toThrow();
  });

  it("renders nulls, arrays, enums and numbers", () => {
    expect(sqlNullableText(null)).toBe("null");
    expect(sqlNullableText(undefined)).toBe("null");
    expect(sqlNullableText("x")).toBe("'x'");
    expect(sqlTextArray([])).toBe("'{}'::text[]");
    expect(sqlTextArray(["a", "b'c"])).toBe("array['a', 'b''c']::text[]");
    expect(sqlEnum(null, "rot_kind")).toBe("null");
    expect(sqlEnum("repair", "rot_kind")).toBe("'repair'::public.rot_kind");
    expect(sqlInt(440000)).toBe("440000");
    expect(() => sqlInt(1.5)).toThrow();
    expect(sqlNumeric(0.5)).toBe("0.5");
    expect(sqlNumeric(null)).toBe("null");
    expect(() => sqlNumeric(Number.NaN)).toThrow();
  });
});

describe("buildSeedStatements", () => {
  it("covers every row of the seed catalogue", () => {
    expect(rowsFor("categories")).toBe(categories.length);
    expect(rowsFor("services")).toBe(services.length);
    expect(rowsFor("service_addons")).toBe(addons.length);
    expect(rowsFor("price_ranges")).toBe(ranges.length);
    expect(categories).toHaveLength(13);
  });

  it("splits large tables into chunks of at most maxRowsPerStatement rows", () => {
    const statements = buildSeedStatements(defaultSeedData, { maxRowsPerStatement: 10 });
    for (const s of statements) expect(s.rows).toBeLessThanOrEqual(10);
    const serviceChunks = statements.filter((s) => s.label.startsWith("services"));
    expect(serviceChunks).toHaveLength(Math.ceil(services.length / 10));
    expect(serviceChunks[0].label).toBe(`services 1/${serviceChunks.length}`);
  });

  it("only produces idempotent, non-destructive statements", () => {
    for (const s of buildSeedStatements()) {
      expect(s.sql).toMatch(/^insert into public\./);
      expect(s.sql).toMatch(/on conflict|where not exists/);
      expect(s.sql).not.toMatch(/\b(delete|drop|truncate)\b/i);
    }
  });

  it("orders statements so foreign keys resolve (categories → services → add-ons/ranges)", () => {
    const labels = buildSeedStatements().map((s) => s.label.split(" ")[0]);
    expect(labels.indexOf("categories")).toBeLessThan(labels.indexOf("services"));
    expect(labels.lastIndexOf("services")).toBeLessThan(labels.indexOf("service_addons"));
    expect(labels.lastIndexOf("services")).toBeLessThan(labels.indexOf("price_ranges"));
  });

  it("upserts price ranges on (service_id, size_band) and keeps null size bands as null", () => {
    const sql = buildSeedStatements()
      .filter((s) => s.label.startsWith("price_ranges"))
      .map((s) => s.sql)
      .join("\n");
    expect(sql).toContain("on conflict (service_id, size_band) do update set");
    expect(sql).toContain("('fonsterputs', null,");
    expect(sql).toContain("'60-79'::public.size_band");
  });

  it("rejects duplicate price ranges for the same service and size band", () => {
    const dup = { ...defaultSeedData, ranges: [ranges[0], { ...ranges[0] }] };
    expect(() => buildSeedStatements(dup)).toThrow(/Duplicate price range/);
  });

  it("seeds the admin, the settings row and one own-staff partner without F-skatt", () => {
    const byLabel = new Map(buildSeedStatements().map((s) => [s.label, s.sql]));
    expect(byLabel.get("admin_users")).toContain(`'${SEED_ADMIN_EMAIL}'`);
    expect(byLabel.get("admin_users")).toContain("on conflict (email) do nothing");
    expect(byLabel.get("settings")).toContain("on conflict (id) do nothing");
    const partner = byLabel.get("partners (own staff)") ?? "";
    expect(partner).toContain("true, false");
    expect(partner).toContain("where not exists (select 1 from public.partners where is_own_company)");
    for (const s of services.filter((x) => x.deductionType === "rot")) {
      expect(partner).not.toContain(`'${s.id}'`);
    }
  });
});

describe("buildSeedSql", () => {
  it("matches the committed supabase/seed.sql (run npm run db:seed:generate after editing the seed)", () => {
    const committed = readFileSync(join(process.cwd(), "supabase", "seed.sql"), "utf8");
    expect(buildSeedSql()).toBe(committed);
  });
});
