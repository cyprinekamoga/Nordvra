import type { Range } from "@/lib/pricing/calculate";
import { displayRange, displayRate, estimateForRequest } from "@/lib/pricing/estimate";
import { SIZE_BANDS, servicesInCategory, type Catalog, type Category, type Service, type SizeBand } from "@/lib/catalog/types";
import { CURRENT_RULES, getTaxRules } from "@/lib/taxRules";

/**
 * The public service pages: one page per category (`/stadning`) and one per service
 * (`/stadning/flyttstadning`), all on nordvra.se, so a search for a service can land on a page
 * about exactly that service. Built from the catalogue, so a new service gets its page by
 * itself. Pure: the URLs and prices are unit-tested.
 */

export function activeCategories(catalog: Catalog): Category[] {
  return catalog.categories
    .filter((c) => c.active && servicesInCategory(catalog, c.id).length > 0)
    .sort((a, b) => a.sort - b.sort);
}

export function findPageCategory(catalog: Catalog, id: string): Category | null {
  return activeCategories(catalog).find((c) => c.id === id) ?? null;
}

/**
 * A category with a single service of its own (Fönsterputs) has no list to show: its category
 * page is the service page, and that is the service's only URL.
 */
export function soleService(catalog: Catalog, category: Category): Service | null {
  const own = catalog.services.filter((s) => s.active && s.categoryId === category.id);
  return own.length === 1 ? own[0] : null;
}

export function categoryHref(category: Pick<Category, "id">): string {
  return `/${category.id}`;
}

/** The service's one canonical URL, under its main category (also when listed under another). */
export function serviceHref(catalog: Catalog, service: Service): string {
  const category = findPageCategory(catalog, service.categoryId);
  if (category && soleService(catalog, category)?.id === service.id) return categoryHref(category);
  return `/${service.categoryId}/${service.id}`;
}

/** The service at `/{categoryId}/{serviceId}`, or null when that is not its canonical URL. */
export function findPageService(catalog: Catalog, categoryId: string, serviceId: string): Service | null {
  const service = catalog.services.find((s) => s.id === serviceId && s.active);
  if (!service || service.categoryId !== categoryId) return null;
  return service;
}

/** Opens the request flow on this service. */
export function bookHref(service: Pick<Service, "id">): string {
  return `/boka?tjanst=${encodeURIComponent(service.id)}`;
}

// ---------------------------------------------------------------------------------------------
// Indicative prices for the pages (same price list and tax rules as the request flow)

export interface PriceRow {
  sizeBand: SizeBand;
  before: Range;
  after: Range;
}

export type ServicePrice =
  /** Price for the whole job, or per visit; per size of home when `rows` is set. */
  | { kind: "total"; perVisit: boolean; before: Range; after: Range; rows: PriceRow[]; note: string | null }
  /** A rate: per hour, per m² or per window. */
  | { kind: "rate"; unit: "hour" | "m2" | "window"; before: Range; after: Range; note: string | null }
  /** No indicative price: the company quotes. */
  | { kind: "quote" };

/** Indicative price before and after the deduction, for one buyer who has the right to it. */
export function servicePrice(catalog: Catalog, service: Service): ServicePrice {
  const rules = getTaxRules(CURRENT_RULES.year, catalog.config.taxOverrides);
  const estimate = (sizeBand?: SizeBand) =>
    estimateForRequest({ catalog, service, answers: { sizeBand, windows: 1 }, rules, eligible: true, buyerCount: 1 });

  if (service.pricingUnit === "window") {
    const e = estimate();
    if (e.kind !== "total") return { kind: "quote" };
    const r = displayRate(e.range);
    return { kind: "rate", unit: "window", before: r.before, after: r.after, note: e.note };
  }

  if (service.usesSizeBand) {
    const rows: PriceRow[] = [];
    let note: string | null = null;
    let perVisit = false;
    for (const sizeBand of SIZE_BANDS) {
      const e = estimate(sizeBand);
      if (e.kind !== "total") continue;
      const r = displayRange(e.range);
      rows.push({ sizeBand, before: r.before, after: r.after });
      note ??= e.note;
      perVisit = e.perVisit;
    }
    if (rows.length === 0) return { kind: "quote" };
    return {
      kind: "total",
      perVisit,
      before: [rows[0].before[0], rows.at(-1)!.before[1]],
      after: [rows[0].after[0], rows.at(-1)!.after[1]],
      rows,
      note,
    };
  }

  const e = estimate();
  if (e.kind === "quote") return e;
  if (e.kind === "rate") {
    const r = displayRate(e.range);
    return { kind: "rate", unit: e.unit, before: r.before, after: r.after, note: e.note };
  }
  const r = displayRange(e.range);
  return { kind: "total", perVisit: e.perVisit, before: r.before, after: r.after, rows: [], note: e.note };
}
