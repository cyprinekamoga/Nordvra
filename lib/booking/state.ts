import { addDays, addMonths, isIsoDate } from "@/components/ui/calendar-utils";
import {
  servicesInCategory,
  type Catalog,
  type Category,
  type Frequency,
  type HousingType,
  type Service,
  type ServiceAddon,
  type SizeBand,
  type TimeWindow,
} from "@/lib/catalog/types";
import { company } from "@/lib/company";
import {
  eligibilityQuestions,
  evaluateEligibility,
  type EligibilityAnswers,
  type EligibilityResult,
  type EligibilityWarning,
  type IneligibleReason,
} from "@/lib/eligibility";
import { fmt, t } from "@/lib/i18n";
import type { PriceRange, Range } from "@/lib/pricing/calculate";
import { displayRange, displayRate, estimateForRequest, type Estimate } from "@/lib/pricing/estimate";
import {
  CURRENT_RULES,
  getTaxRules,
  ratePercent,
  taxYearForDate,
  type DeductionType,
  type ResolvedTaxRules,
} from "@/lib/taxRules";
import {
  FLOORS_MAX,
  FLOORS_MIN,
  WINDOWS_MAX,
  WINDOWS_MIN,
  redactPersonnummer,
  requestDraftSchema,
  storedDraftSchema,
  type Appliance,
  type Contact,
  type RequestDraft,
} from "./schema";

/**
 * Pure logic for the request flow `/boka`: the draft in sessionStorage, which answers each
 * step needs, reset rules when the service changes, derived eligibility/estimate and the
 * payload for the `submit_request` RPC. Used by the client flow and again by the server action.
 * No React, no I/O except the injected storage.
 */

export const TOTAL_STEPS = 8;
export type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export const STEP_CATEGORY = 1;
export const STEP_SERVICE = 2;
export const STEP_HOME = 3;
export const STEP_WHEN = 4;
export const STEP_WHERE = 5;
export const STEP_ELIGIBILITY = 6;
export const STEP_SUMMARY = 7;
export const STEP_CONTACT = 8;

/** Default for the window stepper when the customer hasn't changed it. */
export const DEFAULT_WINDOWS = 10;
export const DEFAULT_FLOORS = 1;

/** `?steg=3` → 3; anything else → 1. */
export function parseStep(value: string | null | undefined): Step {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= TOTAL_STEPS ? (n as Step) : 1;
}

export function stepHref(step: number): string {
  return step <= 1 ? "/boka" : `/boka?steg=${step}`;
}

// ---------------------------------------------------------------------------------------------
// Storage

export const DRAFT_STORAGE_KEY = "nordvra-request-v1";

/** The subset of the Web Storage API we use (lets tests pass a fake). */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function emptyDraft(): RequestDraft {
  return requestDraftSchema.parse({});
}

/** Reads and validates the saved draft; anything missing, broken or unknown gives an empty draft. */
export function readDraft(storage: StorageLike | null | undefined): RequestDraft {
  if (!storage) return emptyDraft();
  try {
    const raw = storage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return emptyDraft();
    const parsed = storedDraftSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data.draft : emptyDraft();
  } catch {
    return emptyDraft();
  }
}

/** Prepares a draft for storage: drops unknown keys and anything that looks like a personnummer. */
export function draftForStorage(draft: RequestDraft): RequestDraft {
  const parsed = requestDraftSchema.safeParse(draft);
  const clean = parsed.success ? parsed.data : emptyDraft();
  const note = clean.contact.note;
  return note ? { ...clean, contact: { ...clean.contact, note: redactPersonnummer(note) } } : clean;
}

/** Saves the draft. Returns false when storage is unavailable (private mode, quota, blocked). */
export function writeDraft(storage: StorageLike | null | undefined, draft: RequestDraft): boolean {
  if (!storage) return false;
  try {
    storage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ v: 1, draft: draftForStorage(draft) }));
    return true;
  } catch {
    return false;
  }
}

export function clearStoredDraft(storage: StorageLike | null | undefined): void {
  if (!storage) return;
  try {
    storage.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    // Storage blocked – nothing to clear.
  }
}

// ---------------------------------------------------------------------------------------------
// Catalogue lookups and which questions apply

export function findCategory(catalog: Catalog, id: string | undefined): Category | null {
  return (id && catalog.categories.find((c) => c.id === id && c.active)) || null;
}

export function findService(catalog: Catalog, id: string | undefined): Service | null {
  return (id && catalog.services.find((s) => s.id === id && s.active)) || null;
}

export function addonsForService(catalog: Catalog, service: Service | null): ServiceAddon[] {
  if (!service) return [];
  return catalog.addons.filter((a) => a.serviceId === service.id).sort((a, b) => a.sort - b.sort);
}

/** Housing types offered in step 3: "Mina föräldrars hem" only gives RUT. */
export function housingOptions(type: DeductionType): HousingType[] {
  const all: HousingType[] = ["hyresratt", "bostadsratt", "villa", "fritidshus", "foraldrar"];
  return type === "rut" ? all : all.filter((h) => h !== "foraldrar");
}

export interface HomeQuestions {
  /** Size chips: required when the price depends on it, optional when it only helps. */
  size: "required" | "optional" | null;
  /** Floors stepper and pets yes/no. */
  homeDetails: boolean;
  frequency: boolean;
  windows: boolean;
  appliances: boolean;
  addons: ServiceAddon[];
  inspection: boolean;
}

export function homeQuestions(catalog: Catalog, service: Service): HomeQuestions {
  return {
    size: service.usesSizeBand ? "required" : service.askHomeDetails ? "optional" : null,
    homeDetails: service.askHomeDetails,
    frequency: service.formKind === "hemstad",
    windows: service.formKind === "fonster",
    appliances: service.formKind === "vitvaror",
    addons: addonsForService(catalog, service),
    inspection: service.formKind === "flyttstad",
  };
}

export type EligibilityKey = keyof EligibilityAnswers;

const ELIGIBILITY_KEYS: readonly EligibilityKey[] = [
  "age18",
  "taxSweden",
  "rutResidence",
  "rotOwner",
  "rotBuildingOver5",
  "buyerCount",
  "usedThisYear",
];

function isEligibilityKey(key: string): key is EligibilityKey {
  return (ELIGIBILITY_KEYS as readonly string[]).includes(key);
}

/** The step 6 questions for this service and home, in the order they are asked. */
export function eligibilityKeys(service: Service, housing: HousingType | undefined): EligibilityKey[] {
  return eligibilityQuestions(service.deductionType, housing).filter(isEligibilityKey);
}

/** Only the answers to the questions that were asked for this service and home. */
export function relevantEligibilityAnswers(
  service: Service,
  draft: Pick<RequestDraft, "housingType" | "eligibility">,
): EligibilityAnswers {
  const out: Record<string, unknown> = {};
  for (const key of eligibilityKeys(service, draft.housingType)) {
    const value = draft.eligibility[key];
    if (value !== undefined) out[key] = value;
  }
  return out as EligibilityAnswers;
}

export function dateBounds(today: string): { min: string; max: string } {
  return { min: addDays(today, 1), max: addMonths(today, 6) };
}

function inRange(iso: string | undefined, min: string, max: string): boolean {
  return isIsoDate(iso) && iso >= min && iso <= max;
}

// ---------------------------------------------------------------------------------------------
// Derived values

export interface DerivedRequest {
  category: Category | null;
  /** Active services listed under the chosen category. */
  services: Service[];
  /** The chosen service, only when it belongs to the chosen category. */
  service: Service | null;
  questions: HomeQuestions | null;
  eligibility: EligibilityResult | null;
  rules: ResolvedTaxRules;
  taxYear: number;
  estimate: Estimate | null;
  /** The estimate rounded for display (whole hundreds, rates to 5 kr). */
  display: PriceRange | null;
}

export function effectiveWindows(draft: RequestDraft): number {
  return draft.windows ?? DEFAULT_WINDOWS;
}

export function effectiveFloors(draft: RequestDraft): number {
  return draft.floors ?? DEFAULT_FLOORS;
}

export function deriveRequest(draft: RequestDraft, catalog: Catalog): DerivedRequest {
  const category = findCategory(catalog, draft.categoryId);
  const services = category ? servicesInCategory(catalog, category.id) : [];
  const service = services.find((s) => s.id === draft.serviceId) ?? null;
  const taxYear = taxYearForDate(draft.preferredDate, CURRENT_RULES.year);
  const rules = getTaxRules(taxYear, catalog.config.taxOverrides);

  if (!service) {
    return { category, services, service, questions: null, eligibility: null, rules, taxYear, estimate: null, display: null };
  }

  const questions = homeQuestions(catalog, service);
  const eligibility = evaluateEligibility({
    deductionType: service.deductionType,
    rotKind: service.rotKind,
    housingType: draft.housingType,
    answers: relevantEligibilityAnswers(service, draft),
  });
  const estimate = estimateForRequest({
    catalog,
    service,
    answers: {
      sizeBand: draft.sizeBand,
      floors: effectiveFloors(draft),
      pets: draft.pets ?? false,
      addonIds: draft.addonIds,
      windows: effectiveWindows(draft),
    },
    rules,
    eligible: eligibility.eligible,
    buyerCount: draft.eligibility.buyerCount ?? 1,
  });
  const display =
    estimate.kind === "total"
      ? displayRange(estimate.range)
      : estimate.kind === "rate"
        ? displayRate(estimate.range)
        : null;

  return { category, services, service, questions, eligibility, rules, taxYear, estimate, display };
}

// ---------------------------------------------------------------------------------------------
// Step validation and navigation

export type StepField =
  | "categoryId"
  | "serviceId"
  | "housingType"
  | "sizeBand"
  | "floors"
  | "pets"
  | "frequency"
  | "windows"
  | "appliances"
  | "preferredDate"
  | "timeWindow"
  | "inspectionDate"
  | "postcode"
  | EligibilityKey;

export type StepErrors = Partial<Record<StepField, string>>;

const e = t.booking.errors;

/**
 * Missing or invalid answers for one step, as Swedish messages keyed by field. Steps 7 and 8
 * have nothing to answer here (step 8 is validated with `contactSchema`). `today` is
 * "YYYY-MM-DD" in Swedish time; dates must be from tomorrow up to six months ahead.
 */
export function stepErrors(step: number, draft: RequestDraft, catalog: Catalog, today: string): StepErrors {
  const errors: StepErrors = {};
  const d = deriveRequest(draft, catalog);

  switch (step) {
    case STEP_CATEGORY:
      if (!d.category) errors.categoryId = e.categoryRequired;
      break;

    case STEP_SERVICE:
      if (!d.category) errors.categoryId = e.categoryRequired;
      else if (!d.service) errors.serviceId = e.serviceRequired;
      break;

    case STEP_HOME: {
      const service = d.service;
      if (!service || !d.questions) {
        errors.serviceId = e.serviceRequired;
        break;
      }
      const q = d.questions;
      if (!draft.housingType || !housingOptions(service.deductionType).includes(draft.housingType)) {
        errors.housingType = e.housingRequired;
      }
      if (q.size === "required" && !draft.sizeBand) errors.sizeBand = e.sizeRequired;
      if (q.homeDetails) {
        const floors = effectiveFloors(draft);
        if (floors < FLOORS_MIN || floors > FLOORS_MAX) errors.floors = e.floorsInvalid;
        if (draft.pets === undefined) errors.pets = e.petsRequired;
      }
      if (q.frequency && !draft.frequency) errors.frequency = e.frequencyRequired;
      if (q.windows) {
        const windows = effectiveWindows(draft);
        if (windows < WINDOWS_MIN || windows > WINDOWS_MAX) errors.windows = e.windowsInvalid;
      }
      if (q.appliances && draft.appliances.length === 0) errors.appliances = e.appliancesRequired;
      break;
    }

    case STEP_WHEN: {
      const { min, max } = dateBounds(today);
      if (!draft.preferredDate) errors.preferredDate = e.dateRequired;
      else if (!inRange(draft.preferredDate, min, max)) errors.preferredDate = e.dateOutOfRange;
      if (!draft.timeWindow) errors.timeWindow = e.timeWindowRequired;
      if (d.questions?.inspection && draft.inspection === "date") {
        if (!draft.inspectionDate) errors.inspectionDate = e.inspectionDateRequired;
        else if (!inRange(draft.inspectionDate, min, max)) errors.inspectionDate = e.dateOutOfRange;
      }
      break;
    }

    case STEP_WHERE:
      if (!/^\d{5}$/.test(draft.postcode ?? "")) errors.postcode = e.postcodeInvalid;
      break;

    case STEP_ELIGIBILITY: {
      if (!d.service) {
        errors.serviceId = e.serviceRequired;
        break;
      }
      for (const key of eligibilityKeys(d.service, draft.housingType)) {
        if (draft.eligibility[key] === undefined) errors[key] = e.answerRequired;
      }
      break;
    }
  }
  return errors;
}

export function isStepComplete(step: number, draft: RequestDraft, catalog: Catalog, today: string): boolean {
  return Object.keys(stepErrors(step, draft, catalog, today)).length === 0;
}

/**
 * The furthest step the customer may open: the first step with missing answers, or 8 when
 * steps 1–6 are complete (7 is the summary and has nothing to answer).
 */
export function maxReachableStep(draft: RequestDraft, catalog: Catalog, today: string): Step {
  for (let step = STEP_CATEGORY; step <= STEP_ELIGIBILITY; step++) {
    if (!isStepComplete(step, draft, catalog, today)) return step as Step;
  }
  return STEP_CONTACT;
}

/** True when the chosen category has exactly one service (step 2 is skipped). */
export function skipsServiceStep(derived: Pick<DerivedRequest, "services">): boolean {
  return derived.services.length === 1;
}

export function nextStep(step: number, derived: Pick<DerivedRequest, "services">): Step {
  if (step === STEP_CATEGORY && skipsServiceStep(derived)) return STEP_HOME;
  return Math.min(TOTAL_STEPS, step + 1) as Step;
}

export function previousStep(step: number, derived: Pick<DerivedRequest, "services">): Step {
  if (step === STEP_HOME && skipsServiceStep(derived)) return STEP_CATEGORY;
  return Math.max(1, step - 1) as Step;
}

/**
 * The step to show for `?steg=N`: never past the first incomplete step, and step 2 is replaced
 * by step 3 when the category has a single service.
 */
export function resolveStep(requested: number, draft: RequestDraft, catalog: Catalog, today: string): Step {
  let step = Math.min(requested, maxReachableStep(draft, catalog, today)) as Step;
  if (step === STEP_SERVICE && skipsServiceStep(deriveRequest(draft, catalog))) {
    step = Math.min(STEP_HOME, maxReachableStep(draft, catalog, today)) as Step;
  }
  return step;
}

// ---------------------------------------------------------------------------------------------
// Updates with reset rules

/** Answers that only make sense for one service; cleared when the service changes. */
function clearServiceSpecific(draft: RequestDraft): RequestDraft {
  return {
    ...draft,
    addonIds: [],
    windows: undefined,
    frequency: undefined,
    appliances: [],
    inspection: undefined,
    inspectionDate: undefined,
  };
}

/**
 * Chooses a service. A different service clears the service-specific answers (add-ons, windows,
 * frequency, appliances, inspection) but keeps home, date, postcode and contact data. Switching
 * between RUT and ROT also clears the type-specific eligibility answers, and "Mina föräldrars
 * hem" (RUT only) when the new service is ROT.
 */
export function selectService(draft: RequestDraft, serviceId: string, catalog: Catalog): RequestDraft {
  if (draft.serviceId === serviceId) return draft;
  const previous = findService(catalog, draft.serviceId);
  const next = findService(catalog, serviceId);
  let result: RequestDraft = clearServiceSpecific({ ...draft, serviceId });
  if (!next) return result;

  if (next.deductionType === "rot" && result.housingType === "foraldrar") {
    result = { ...result, housingType: undefined };
  }
  if (!previous || previous.deductionType !== next.deductionType) {
    const { age18, taxSweden, buyerCount, usedThisYear } = result.eligibility;
    result = { ...result, eligibility: { age18, taxSweden, buyerCount, usedThisYear } };
  }
  return result;
}

/**
 * Chooses a category. Keeps the service when it is also listed in the new category, otherwise
 * clears it (with the reset rules of `selectService`). A category with a single service selects
 * that service automatically.
 */
export function selectCategory(draft: RequestDraft, categoryId: string, catalog: Catalog): RequestDraft {
  const services = servicesInCategory(catalog, categoryId);
  let result: RequestDraft = { ...draft, categoryId };
  if (!services.some((s) => s.id === draft.serviceId) && draft.serviceId !== undefined) {
    result = clearServiceSpecific({ ...result, serviceId: undefined });
  }
  if (services.length === 1) result = selectService(result, services[0].id, catalog);
  return result;
}

// ---------------------------------------------------------------------------------------------
// Summary texts

/** "Flyttstädning, 60–79 m²" / "Fönsterputs, 10 fönster". */
export function serviceLabel(draft: RequestDraft, derived: DerivedRequest): string {
  if (!derived.service) return "";
  const parts = [derived.service.name];
  if (derived.service.usesSizeBand && draft.sizeBand) parts.push(t.common.sizeBands[draft.sizeBand]);
  if (derived.questions?.windows) {
    parts.push(fmt(t.booking.steps.summary.windowsCount, { count: effectiveWindows(draft) }));
  }
  return parts.join(", ");
}

// ---------------------------------------------------------------------------------------------
// Submission payload (keys as expected by the `submit_request` RPC, SPEC §7)

/** What the customer was shown, stored with the request (rounded like on screen). */
export interface EstimateSnapshot {
  kind: Estimate["kind"];
  /** Rates only: price per hour or per m². */
  unit: "hour" | "m2" | null;
  /** Totals only: price per visit (recurring cleaning). */
  perVisit: boolean;
  deductionType: DeductionType;
  ratePct: number;
  taxYear: number;
  eligible: boolean;
  buyerCount: number;
  before: Range | null;
  deduction: Range | null;
  after: Range | null;
  labour: Range | null;
  extras: Range | null;
  note: string | null;
}

export function estimateSnapshot(draft: RequestDraft, derived: DerivedRequest & { service: Service }): EstimateSnapshot {
  const { estimate, display, service } = derived;
  return {
    kind: estimate?.kind ?? "quote",
    unit: estimate?.kind === "rate" ? estimate.unit : null,
    perVisit: estimate?.kind === "total" ? estimate.perVisit : false,
    deductionType: service.deductionType,
    ratePct: ratePercent(derived.rules, service.deductionType),
    taxYear: derived.taxYear,
    eligible: derived.eligibility?.eligible ?? true,
    buyerCount: draft.eligibility.buyerCount ?? 1,
    before: display?.before ?? null,
    deduction: display?.deduction ?? null,
    after: display?.after ?? null,
    labour: display?.labour ?? null,
    extras: display?.extras ?? null,
    note: estimate && estimate.kind !== "quote" ? estimate.note : null,
  };
}

export interface SubmitRequestPayload {
  service_id: string;
  housing_type: HousingType;
  size_band: SizeBand | null;
  floors: number | null;
  pets: boolean | null;
  details: {
    addonIds: string[];
    windows: number | null;
    frequency: Frequency | null;
    appliances: Appliance[];
  };
  preferred_date: string;
  time_window: TimeWindow;
  flexible: boolean;
  inspection_date: string | null;
  postcode: string;
  street: string;
  city: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  customer_note: string | null;
  eligibility: {
    answers: EligibilityAnswers;
    eligible: boolean;
    reasons: IneligibleReason[];
    warnings: EligibilityWarning[];
  };
  buyer_count: number;
  estimate: EstimateSnapshot;
  terms_version: string;
}

export type BuildPayloadResult =
  | { ok: true; payload: SubmitRequestPayload; service: Service }
  | { ok: false; step: Step };

/**
 * Builds the RPC payload from the draft and the validated contact details. Everything is
 * recomputed from the catalogue (eligibility, estimate), so numbers sent by a browser are never
 * trusted. Returns the first incomplete step when an answer is missing.
 */
export function buildSubmitPayload(params: {
  draft: RequestDraft;
  contact: Contact;
  catalog: Catalog;
  today: string;
  termsVersion?: string;
}): BuildPayloadResult {
  const { contact, catalog, today } = params;
  // The postcode typed in step 8 wins over the one from step 5.
  const draft: RequestDraft = { ...params.draft, postcode: contact.postcode };
  const reachable = maxReachableStep(draft, catalog, today);
  if (reachable < STEP_CONTACT) return { ok: false, step: reachable };

  const derived = deriveRequest(draft, catalog);
  const { service, questions, eligibility } = derived;
  if (!service || !questions || !eligibility || !draft.housingType || !draft.preferredDate || !draft.timeWindow) {
    return { ok: false, step: STEP_SERVICE };
  }

  const addonIds = new Set(questions.addons.map((a) => a.id));
  const payload: SubmitRequestPayload = {
    service_id: service.id,
    housing_type: draft.housingType,
    size_band: questions.size ? (draft.sizeBand ?? null) : null,
    floors: questions.homeDetails ? effectiveFloors(draft) : null,
    pets: questions.homeDetails ? (draft.pets ?? null) : null,
    details: {
      addonIds: draft.addonIds.filter((id) => addonIds.has(id)),
      windows: questions.windows ? effectiveWindows(draft) : null,
      frequency: questions.frequency ? (draft.frequency ?? null) : null,
      appliances: questions.appliances ? draft.appliances : [],
    },
    preferred_date: draft.preferredDate,
    time_window: draft.timeWindow,
    flexible: draft.flexible,
    inspection_date:
      questions.inspection && draft.inspection === "date" ? (draft.inspectionDate ?? null) : null,
    postcode: contact.postcode,
    street: contact.street,
    city: contact.city,
    contact_name: contact.name,
    contact_phone: contact.phone,
    contact_email: contact.email,
    customer_note: contact.note ? contact.note : null,
    eligibility: {
      answers: relevantEligibilityAnswers(service, draft),
      eligible: eligibility.eligible,
      reasons: eligibility.reasons,
      warnings: eligibility.warnings,
    },
    buyer_count: draft.eligibility.buyerCount ?? 1,
    estimate: estimateSnapshot(draft, { ...derived, service }),
    terms_version: params.termsVersion ?? company.termsVersion,
  };
  return { ok: true, payload, service };
}
