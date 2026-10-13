import type { ResolvedTaxRules } from "@/lib/taxRules";
import type {
  Catalog,
  PriceRangeRow,
  Service,
  ServiceAddon,
  SizeBand,
} from "@/lib/catalog/types";
import {
  calculateRange,
  evenShares,
  roundRange,
  type PriceLines,
  type PriceRange,
} from "@/lib/pricing/calculate";

export interface EstimateAnswers {
  sizeBand?: SizeBand;
  floors?: number;
  pets?: boolean;
  addonIds?: string[];
  windows?: number;
}

export type Estimate =
  /** A total for the whole job (or per visit for recurring cleaning). */
  | { kind: "total"; perVisit: boolean; range: PriceRange; note: string | null }
  /** A rate, e.g. per hour or per m², when the total depends on the job. */
  | { kind: "rate"; unit: "hour" | "m2"; range: PriceRange; note: string | null }
  /** No indicative price: the partner company quotes. */
  | { kind: "quote" };

function findRange(
  catalog: Catalog,
  service: Service,
  sizeBand: SizeBand | undefined,
): PriceRangeRow | undefined {
  const rows = catalog.ranges.filter((r) => r.serviceId === service.id);
  if (service.usesSizeBand && sizeBand) {
    const exact = rows.find((r) => r.sizeBand === sizeBand);
    if (exact) return exact;
  }
  return rows.find((r) => r.sizeBand === null);
}

function selectedAddons(catalog: Catalog, service: Service, ids: string[] = []): ServiceAddon[] {
  return catalog.addons.filter((a) => a.serviceId === service.id && ids.includes(a.id) && !a.included);
}

/**
 * Indicative price for the request flow. Wide on purpose ("vanligtvis …"): prices vary by
 * region and the exact price comes in the quote.
 */
export function estimateForRequest(params: {
  catalog: Catalog;
  service: Service;
  answers: EstimateAnswers;
  rules: ResolvedTaxRules;
  eligible: boolean;
  buyerCount?: number;
}): Estimate {
  const { catalog, service, answers, rules, eligible } = params;
  const row = findRange(catalog, service, answers.sizeBand);
  if (!row) return { kind: "quote" };

  const shares = evenShares(params.buyerCount ?? 1).map((sharePct) => ({ sharePct }));
  const common = {
    deductionType: service.deductionType,
    rules,
    eligible,
    buyers: shares,
    labourShareOfTotal: service.labourShareOfTotal,
  };

  if (service.pricingUnit === "hour" || service.pricingUnit === "m2") {
    const range = calculateRange({
      ...common,
      min: { labour: row.labourMin, material: row.materialMin, travel: row.travelMin },
      max: { labour: row.labourMax, material: row.materialMax, travel: row.travelMax },
    });
    return { kind: "rate", unit: service.pricingUnit, range, note: row.note };
  }

  const addons = selectedAddons(catalog, service, answers.addonIds);
  let min: PriceLines;
  let max: PriceLines;

  if (service.pricingUnit === "window") {
    const windows = Math.max(1, answers.windows ?? 1);
    const perWindowMin = row.labourMin + addons.filter((a) => a.perWindow).reduce((s, a) => s + a.labourMin, 0);
    const perWindowMax = row.labourMax + addons.filter((a) => a.perWindow).reduce((s, a) => s + a.labourMax, 0);
    min = { labour: perWindowMin * windows, material: row.materialMin, travel: row.travelMin };
    max = { labour: perWindowMax * windows, material: row.materialMax, travel: row.travelMax };
  } else {
    min = { labour: row.labourMin, material: row.materialMin, travel: row.travelMin };
    max = { labour: row.labourMax, material: row.materialMax, travel: row.travelMax };
  }

  for (const addon of addons.filter((a) => !a.perWindow)) {
    min.labour += addon.labourMin;
    max.labour += addon.labourMax;
  }

  if (service.askHomeDetails) {
    const extraFloors = Math.max(0, (answers.floors ?? 1) - 1);
    const factor =
      (1 + (answers.pets ? catalog.config.petsSurchargePct / 100 : 0)) *
      (1 + (extraFloors * catalog.config.extraFloorSurchargePct) / 100);
    min.labour = Math.round(min.labour * factor);
    max.labour = Math.round(max.labour * factor);
  }

  const range = calculateRange({ ...common, min, max });
  return { kind: "total", perVisit: service.pricingUnit === "visit", range, note: row.note };
}

/** Rounds every part of a range to whole hundreds for display. */
export function displayRange(range: PriceRange): PriceRange {
  return {
    before: roundRange(range.before),
    deduction: roundRange(range.deduction),
    after: roundRange(range.after),
    labour: roundRange(range.labour),
    extras: roundRange(range.extras),
  };
}

/** Rates are small numbers (kr/h), so round to 5 kr rather than 100 kr. */
export function displayRate(range: PriceRange): PriceRange {
  return {
    before: roundRange(range.before, 5),
    deduction: roundRange(range.deduction, 5),
    after: roundRange(range.after, 5),
    labour: roundRange(range.labour, 5),
    extras: roundRange(range.extras, 5),
  };
}
