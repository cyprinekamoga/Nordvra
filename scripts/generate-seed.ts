/**
 * Generates supabase/seed.sql from lib/catalog/seed.ts.
 *
 *   npm run db:seed:generate        (= npx tsx scripts/generate-seed.ts)
 *
 * Run from the repository root (npm scripts always do). Apply the result with the Supabase
 * SQL editor, `supabase db reset` (local) or `psql -f supabase/seed.sql`.
 */
import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildSeedSql, buildSeedStatements } from "../lib/supabase/seedSql";

const root = process.cwd();
if (!existsSync(join(root, "package.json")) || !existsSync(join(root, "supabase"))) {
  console.error("Run this script from the repository root (npm run db:seed:generate).");
  process.exit(1);
}

const outFile = join(root, "supabase", "seed.sql");
writeFileSync(outFile, buildSeedSql(), "utf8");

const statements = buildSeedStatements();
const total = (prefix: string) =>
  statements.filter((s) => s.label.startsWith(prefix)).reduce((sum, s) => sum + s.rows, 0);

console.log(`Wrote ${outFile}`);
console.log(
  `  categories: ${total("categories")}, services: ${total("services")}, ` +
    `service_addons: ${total("service_addons")}, price_ranges: ${total("price_ranges")}, ` +
    `statements: ${statements.length}`,
);
