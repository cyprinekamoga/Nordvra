import { cacheLife, cacheTag } from "next/cache";
import { mapCatalog } from "@/lib/catalog/map";
import { seedCatalog } from "@/lib/catalog/seed";
import type { Catalog } from "@/lib/catalog/types";
import { createAnonClient } from "@/lib/supabase/anon";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/** Cache tag for everything read from the catalogue. Admin saves call `updateTag(CATALOG_TAG)`. */
export const CATALOG_TAG = "catalog";

/** FNV-1a hash of the bundled seed: changes whenever its prices or services change. */
function seedVersion(seed: Catalog): string {
  const text = JSON.stringify(seed);
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

const SEED_VERSION = seedVersion(seedCatalog);

/**
 * The service catalogue (categories, services, add-ons, indicative prices and public config).
 *
 * Cached across requests ('minutes' profile) and tagged with `CATALOG_TAG`, so public pages stay
 * in the static shell and admin edits show up as soon as the tag is invalidated.
 *
 * Falls back to the bundled `seedCatalog` when Supabase isn't configured (local dev, tests) or
 * when any query fails, so the booking flow never breaks. Only the error message is logged.
 */
export async function getCatalog(): Promise<Catalog> {
  return cachedCatalog(SEED_VERSION);
}

/**
 * The seed version is part of the cache key (cache keys come from the arguments, not from
 * imported modules), so a deploy with new seed prices never reuses a catalogue cached by an
 * older deploy.
 */
async function cachedCatalog(seed: string): Promise<Catalog> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CATALOG_TAG, `catalog-seed-${seed}`);

  if (!isSupabaseConfigured()) return seedCatalog;

  try {
    return await loadFromDatabase();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[catalog] Using the seed catalogue: ${message}`);
    return seedCatalog;
  }
}

async function loadFromDatabase(): Promise<Catalog> {
  const db = createAnonClient();
  const [categories, services, addons, ranges, config] = await Promise.all([
    db.from("categories").select("*").eq("active", true).order("sort"),
    db.from("services").select("*").eq("active", true).order("sort"),
    db.from("service_addons").select("*").order("sort"),
    db.from("price_ranges").select("*"),
    db.rpc("public_config"),
  ]);

  const failed = [
    ["categories", categories.error],
    ["services", services.error],
    ["service_addons", addons.error],
    ["price_ranges", ranges.error],
    ["public_config", config.error],
  ].find(([, error]) => error) as [string, { message: string }] | undefined;
  if (failed) throw new Error(`${failed[0]}: ${failed[1].message}`);

  const catalog = mapCatalog(
    {
      categories: categories.data,
      services: services.data,
      addons: addons.data,
      ranges: ranges.data,
      config: config.data,
    },
    seedCatalog.config,
  );

  // An empty catalogue means the database hasn't been seeded yet – the seed is more useful.
  if (catalog.categories.length === 0 || catalog.services.length === 0) {
    throw new Error("the catalogue tables are empty");
  }
  return catalog;
}
