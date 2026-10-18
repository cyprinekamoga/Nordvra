import { describe, expect, it } from "vitest";
import type { RequestDraft } from "@/lib/booking/schema";
import {
  DRAFT_STORAGE_KEY,
  buildSubmitPayload,
  clearStoredDraft,
  deriveRequest,
  emptyDraft,
  maxReachableStep,
  nextStep,
  parseStep,
  previousStep,
  readDraft,
  resolveStep,
  selectCategory,
  selectService,
  serviceLabel,
  stepErrors,
  stepHref,
  writeDraft,
  type StorageLike,
} from "@/lib/booking/state";
import { seedCatalog as catalog } from "@/lib/catalog/seed";
import type { Contact } from "@/lib/booking/schema";

const TODAY = "2026-10-13";

class MemoryStorage implements StorageLike {
  data = new Map<string, string>();
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.data.set(key, value);
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
}

class BrokenStorage implements StorageLike {
  getItem(): string | null {
    throw new Error("blocked");
  }
  setItem() {
    throw new Error("quota");
  }
  removeItem() {
    throw new Error("blocked");
  }
}

/** A complete flyttstädning request up to step 7. */
function flyttDraft(overrides: Partial<RequestDraft> = {}): RequestDraft {
  return {
    ...emptyDraft(),
    categoryId: "stadning",
    serviceId: "flyttstadning",
    housingType: "bostadsratt",
    sizeBand: "60-79",
    pets: false,
    preferredDate: "2026-10-20",
    timeWindow: "formiddag",
    postcode: "11453",
    eligibility: { age18: true, taxSweden: true, rutResidence: true, buyerCount: 1, usedThisYear: "nej" },
    ...overrides,
  };
}

const contact: Contact = {
  name: "Anna Andersson",
  phone: "+46701234567",
  email: "anna@exempel.se",
  street: "Storgatan 1",
  postcode: "11453",
  city: "Stockholm",
  note: "",
  acceptTerms: true,
};

describe("step parameter", () => {
  it("parses ?steg and falls back to 1", () => {
    expect(parseStep("3")).toBe(3);
    expect(parseStep("8")).toBe(8);
    expect(parseStep("9")).toBe(1);
    expect(parseStep("0")).toBe(1);
    expect(parseStep("2.5")).toBe(1);
    expect(parseStep("abc")).toBe(1);
    expect(parseStep(null)).toBe(1);
    expect(stepHref(1)).toBe("/boka");
    expect(stepHref(4)).toBe("/boka?steg=4");
  });
});

describe("draft storage", () => {
  it("round-trips a draft under nordvra-request-v1", () => {
    const storage = new MemoryStorage();
    const draft = flyttDraft({ contact: { name: "Anna" } });
    expect(writeDraft(storage, draft)).toBe(true);
    expect(JSON.parse(storage.getItem(DRAFT_STORAGE_KEY)!).v).toBe(1);
    expect(readDraft(storage)).toEqual(draft);
    clearStoredDraft(storage);
    expect(storage.getItem(DRAFT_STORAGE_KEY)).toBeNull();
  });

  it("returns an empty draft for missing, broken or foreign data", () => {
    const storage = new MemoryStorage();
    expect(readDraft(storage)).toEqual(emptyDraft());
    storage.setItem(DRAFT_STORAGE_KEY, "{not json");
    expect(readDraft(storage)).toEqual(emptyDraft());
    storage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ v: 1, draft: { housingType: "slott" } }));
    expect(readDraft(storage)).toEqual(emptyDraft());
    expect(readDraft(null)).toEqual(emptyDraft());
  });

  it("survives blocked storage", () => {
    const broken = new BrokenStorage();
    expect(readDraft(broken)).toEqual(emptyDraft());
    expect(writeDraft(broken, flyttDraft())).toBe(false);
    expect(() => clearStoredDraft(broken)).not.toThrow();
  });

  it("never stores a personnummer", () => {
    const storage = new MemoryStorage();
    const draft = {
      ...flyttDraft({ contact: { note: "Portkod 12, pnr 19121212-1212" } }),
      personnummer: "19121212-1212",
    } as RequestDraft;
    writeDraft(storage, draft);
    const raw = storage.getItem(DRAFT_STORAGE_KEY)!;
    expect(raw).not.toContain("1212-1212");
    expect(raw).not.toContain("personnummer");
    expect(readDraft(storage).contact.note).toContain("Portkod 12");
  });
});

describe("reset rules", () => {
  it("changing the service clears service-specific answers but keeps home, date and contact", () => {
    const draft = flyttDraft({
      addonIds: ["flytt-balkong"],
      inspection: "date",
      inspectionDate: "2026-10-25",
      floors: 2,
      contact: { name: "Anna" },
    });
    const next = selectService(draft, "storstadning", catalog);
    expect(next.serviceId).toBe("storstadning");
    expect(next.addonIds).toEqual([]);
    expect(next.inspection).toBeUndefined();
    expect(next.inspectionDate).toBeUndefined();
    expect(next.housingType).toBe("bostadsratt");
    expect(next.sizeBand).toBe("60-79");
    expect(next.floors).toBe(2);
    expect(next.preferredDate).toBe("2026-10-20");
    expect(next.postcode).toBe("11453");
    expect(next.contact).toEqual({ name: "Anna" });
    // Same deduction type: eligibility answers are kept.
    expect(next.eligibility.rutResidence).toBe(true);
  });

  it("choosing the same service changes nothing", () => {
    const draft = flyttDraft();
    expect(selectService(draft, "flyttstadning", catalog)).toBe(draft);
  });

  it("RUT → ROT clears type-specific eligibility answers and 'Mina föräldrars hem'", () => {
    const draft = flyttDraft({ housingType: "foraldrar" });
    const next = selectService(draft, "rot-ventilation", catalog);
    expect(next.housingType).toBeUndefined();
    expect(next.eligibility).toEqual({ age18: true, taxSweden: true, buyerCount: 1, usedThisYear: "nej" });
  });

  it("a category with one service selects it", () => {
    const next = selectCategory(emptyDraft(), "fonsterputs", catalog);
    expect(next.categoryId).toBe("fonsterputs");
    expect(next.serviceId).toBe("fonsterputs");
  });

  it("keeps a service that is also listed in the new category", () => {
    const draft = selectCategory(emptyDraft(), "fonsterputs", catalog);
    const next = selectCategory({ ...draft, windows: 12 }, "stadning", catalog);
    expect(next.serviceId).toBe("fonsterputs");
    expect(next.windows).toBe(12);
  });

  it("clears a service that is not in the new category", () => {
    const next = selectCategory(flyttDraft({ addonIds: ["flytt-balkong"] }), "tradgard", catalog);
    expect(next.serviceId).toBeUndefined();
    expect(next.addonIds).toEqual([]);
    expect(next.housingType).toBe("bostadsratt");
  });
});

describe("step completeness", () => {
  it("a complete draft can reach step 8", () => {
    expect(maxReachableStep(flyttDraft(), catalog, TODAY)).toBe(8);
    for (let step = 1; step <= 8; step++) {
      expect(stepErrors(step, flyttDraft(), catalog, TODAY)).toEqual({});
    }
  });

  it("stops at the first incomplete step", () => {
    expect(maxReachableStep(emptyDraft(), catalog, TODAY)).toBe(1);
    expect(maxReachableStep(flyttDraft({ serviceId: undefined }), catalog, TODAY)).toBe(2);
    expect(maxReachableStep(flyttDraft({ sizeBand: undefined }), catalog, TODAY)).toBe(3);
    expect(maxReachableStep(flyttDraft({ timeWindow: undefined }), catalog, TODAY)).toBe(4);
    expect(maxReachableStep(flyttDraft({ postcode: "114" }), catalog, TODAY)).toBe(5);
    expect(
      maxReachableStep(flyttDraft({ eligibility: { age18: true, taxSweden: true } }), catalog, TODAY),
    ).toBe(6);
  });

  it("step 3 asks the service-specific questions", () => {
    const errors = stepErrors(3, flyttDraft({ pets: undefined, housingType: undefined }), catalog, TODAY);
    expect(Object.keys(errors).sort()).toEqual(["housingType", "pets"]);

    const hemstad = flyttDraft({ serviceId: "hemstadning" });
    expect(Object.keys(stepErrors(3, hemstad, catalog, TODAY))).toEqual(["frequency"]);

    const vitvaror = { ...emptyDraft(), categoryId: "hem-it", serviceId: "vitvaror-reparation", housingType: "villa" as const };
    expect(Object.keys(stepErrors(3, vitvaror, catalog, TODAY))).toEqual(["appliances"]);
    expect(stepErrors(3, { ...vitvaror, appliances: ["kyl"] }, catalog, TODAY)).toEqual({});

    // Hourly garden work needs only the housing type.
    const garden = { ...emptyDraft(), categoryId: "tradgard", serviceId: "grasklippning", housingType: "villa" as const };
    expect(stepErrors(3, garden, catalog, TODAY)).toEqual({});
  });

  it("ROT services don't accept 'Mina föräldrars hem'", () => {
    const rot = { ...emptyDraft(), categoryId: "el", serviceId: "eluttag", housingType: "foraldrar" as const };
    expect(stepErrors(3, rot, catalog, TODAY).housingType).toBeDefined();
  });

  it("dates must be from tomorrow up to six months ahead", () => {
    expect(stepErrors(4, flyttDraft({ preferredDate: TODAY }), catalog, TODAY).preferredDate).toBeDefined();
    expect(stepErrors(4, flyttDraft({ preferredDate: "2026-10-14" }), catalog, TODAY)).toEqual({});
    expect(stepErrors(4, flyttDraft({ preferredDate: "2027-04-13" }), catalog, TODAY)).toEqual({});
    expect(stepErrors(4, flyttDraft({ preferredDate: "2027-04-14" }), catalog, TODAY).preferredDate).toBeDefined();
    expect(stepErrors(4, flyttDraft({ inspection: "date" }), catalog, TODAY).inspectionDate).toBeDefined();
    expect(stepErrors(4, flyttDraft({ inspection: "unknown" }), catalog, TODAY)).toEqual({});
  });

  it("step 6 asks the questions for the deduction type", () => {
    const rot = {
      ...flyttDraft(),
      categoryId: "el",
      serviceId: "eluttag",
      eligibility: { age18: true, taxSweden: true, buyerCount: 1 as const, usedThisYear: "nej" as const },
    };
    expect(Object.keys(stepErrors(6, rot, catalog, TODAY)).sort()).toEqual(["rotBuildingOver5", "rotOwner"]);
    // Parents' home already answers the RUT residence question.
    const parents = flyttDraft({ housingType: "foraldrar", eligibility: { age18: true, taxSweden: true, buyerCount: 2, usedThisYear: "vet_inte" } });
    expect(stepErrors(6, parents, catalog, TODAY)).toEqual({});
  });
});

describe("navigation", () => {
  it("skips step 2 for a category with a single service", () => {
    const single = deriveRequest(selectCategory(emptyDraft(), "fonsterputs", catalog), catalog);
    expect(nextStep(1, single)).toBe(3);
    expect(previousStep(3, single)).toBe(1);
    const many = deriveRequest(flyttDraft(), catalog);
    expect(nextStep(1, many)).toBe(2);
    expect(previousStep(3, many)).toBe(2);
    expect(nextStep(8, many)).toBe(8);
    expect(previousStep(1, many)).toBe(1);
  });

  it("never shows a step past the first incomplete one", () => {
    expect(resolveStep(7, emptyDraft(), catalog, TODAY)).toBe(1);
    expect(resolveStep(7, flyttDraft({ postcode: undefined }), catalog, TODAY)).toBe(5);
    expect(resolveStep(3, flyttDraft(), catalog, TODAY)).toBe(3);
    const single = { ...selectCategory(emptyDraft(), "fonsterputs", catalog), housingType: "villa" as const };
    expect(resolveStep(2, single, catalog, TODAY)).toBe(3);
  });
});

describe("derived estimate", () => {
  it("flyttstäd 60–79 m²: vanligtvis 2 300–3 600 kr efter RUT", () => {
    const d = deriveRequest(flyttDraft(), catalog);
    expect(d.eligibility?.eligible).toBe(true);
    expect(d.display?.after).toEqual([230_000, 360_000]);
    expect(d.display?.before).toEqual([460_000, 720_000]);
    expect(serviceLabel(flyttDraft(), d)).toBe("Flyttstädning, 60–79 m²");
  });

  it("not eligible: the full price", () => {
    const d = deriveRequest(flyttDraft({ eligibility: { age18: false, taxSweden: true, rutResidence: true, buyerCount: 1, usedThisYear: "nej" } }), catalog);
    expect(d.eligibility?.reasons).toEqual(["under18"]);
    expect(d.display?.after).toEqual(d.display?.before);
    expect(d.display?.deduction).toEqual([0, 0]);
  });

  it("window cleaning counts windows (default 10)", () => {
    const draft = selectCategory(emptyDraft(), "fonsterputs", catalog);
    const d = deriveRequest(draft, catalog);
    expect(d.estimate?.kind).toBe("total");
    expect(d.display?.after).toEqual([60_000, 100_000]); // 600–950 kr, widened to whole hundreds
    expect(serviceLabel(draft, d)).toBe("Fönsterputs, 10 fönster");
  });
});

describe("buildSubmitPayload", () => {
  it("builds the submit_request payload from the catalogue", () => {
    const draft = flyttDraft({ addonIds: ["flytt-balkong", "not-an-addon"], flexible: true, inspection: "unknown" });
    const result = buildSubmitPayload({ draft, contact, catalog, today: TODAY, termsVersion: "2026-10-13" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const p = result.payload;
    expect(p).toMatchObject({
      service_id: "flyttstadning",
      housing_type: "bostadsratt",
      size_band: "60-79",
      floors: 1,
      pets: false,
      details: { addonIds: ["flytt-balkong"], windows: null, frequency: null, appliances: [] },
      preferred_date: "2026-10-20",
      time_window: "formiddag",
      flexible: true,
      inspection_date: null,
      postcode: "11453",
      street: "Storgatan 1",
      city: "Stockholm",
      contact_name: "Anna Andersson",
      contact_phone: "+46701234567",
      contact_email: "anna@exempel.se",
      customer_note: null,
      buyer_count: 1,
      terms_version: "2026-10-13",
    });
    expect(p.eligibility).toEqual({
      answers: { age18: true, taxSweden: true, rutResidence: true, buyerCount: 1, usedThisYear: "nej" },
      eligible: true,
      reasons: [],
      warnings: [],
    });
    expect(p.estimate).toMatchObject({
      kind: "total",
      deductionType: "rut",
      ratePct: 50,
      taxYear: 2026,
      eligible: true,
      perVisit: false,
    });
    // Balcony add-on: +150–300 kr after RUT.
    expect(p.estimate.after).toEqual([240_000, 390_000]); // 2 450–3 900 kr, widened to whole hundreds
    expect(JSON.stringify(p)).not.toMatch(/personnummer|pnr/i);
  });

  it("recomputes eligibility instead of trusting the draft", () => {
    const draft = flyttDraft({
      eligibility: { age18: true, taxSweden: false, rutResidence: true, buyerCount: 1, usedThisYear: "ja" },
    });
    const result = buildSubmitPayload({ draft, contact, catalog, today: TODAY });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.payload.eligibility.eligible).toBe(false);
    expect(result.payload.eligibility.reasons).toEqual(["noSwedishTax"]);
    expect(result.payload.eligibility.warnings).toEqual(["usedThisYear"]);
    expect(result.payload.estimate.eligible).toBe(false);
    expect(result.payload.estimate.after).toEqual(result.payload.estimate.before);
  });

  it("uses the step 8 postcode and service-specific details", () => {
    const draft = {
      ...emptyDraft(),
      categoryId: "stadning",
      serviceId: "hemstadning",
      housingType: "villa" as const,
      sizeBand: "100-129" as const,
      floors: 2,
      pets: true,
      frequency: "varannan_vecka" as const,
      preferredDate: "2026-11-02",
      timeWindow: "flexibel" as const,
      postcode: "11122",
      eligibility: { age18: true, taxSweden: true, rutResidence: true, buyerCount: 2 as const, usedThisYear: "vet_inte" as const },
    };
    const result = buildSubmitPayload({ draft, contact: { ...contact, postcode: "11453", note: "Hund hemma" }, catalog, today: TODAY });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.payload.postcode).toBe("11453");
    expect(result.payload.floors).toBe(2);
    expect(result.payload.pets).toBe(true);
    expect(result.payload.details.frequency).toBe("varannan_vecka");
    expect(result.payload.buyer_count).toBe(2);
    expect(result.payload.customer_note).toBe("Hund hemma");
    expect(result.payload.estimate.perVisit).toBe(true);
    expect(result.payload.eligibility.warnings).toEqual(["checkRemaining"]);
  });

  it("services without home questions send null size, floors and pets", () => {
    const draft = {
      ...flyttDraft(),
      categoryId: "el",
      serviceId: "eluttag",
      housingType: "villa" as const,
      eligibility: { age18: true, taxSweden: true, rotOwner: true, rotBuildingOver5: false, buyerCount: 1 as const, usedThisYear: "nej" as const },
    };
    const result = buildSubmitPayload({ draft, contact, catalog, today: TODAY });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.payload.size_band).toBeNull();
    expect(result.payload.floors).toBeNull();
    expect(result.payload.pets).toBeNull();
    expect(result.payload.eligibility.warnings).toEqual(["rotRepairOnly"]);
    expect(result.payload.estimate).toMatchObject({ kind: "rate", unit: "hour", deductionType: "rot", ratePct: 30 });
  });

  it("reports the first incomplete step", () => {
    expect(buildSubmitPayload({ draft: emptyDraft(), contact, catalog, today: TODAY })).toEqual({ ok: false, step: 1 });
    expect(
      buildSubmitPayload({ draft: flyttDraft({ preferredDate: "2026-10-13" }), contact, catalog, today: TODAY }),
    ).toEqual({ ok: false, step: 4 });
  });
});
