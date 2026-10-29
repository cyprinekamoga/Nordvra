import { describe, expect, it } from "vitest";
import { packageCompanion, reminderDate, reminderMonths, seasonalService } from "@/lib/booking/extras";
import type { Contact, RequestDraft } from "@/lib/booking/schema";
import { validateContact } from "@/lib/booking/schema";
import { buildSubmitPayload, deriveRequest, emptyDraft, selectService, stepErrors } from "@/lib/booking/state";
import { seedCatalog as catalog } from "@/lib/catalog/seed";

const TODAY = "2026-10-13";
const service = (id: string) => catalog.services.find((s) => s.id === id) ?? null;

const contact: Contact = {
  name: "Anna Andersson",
  phone: "+46701234567",
  email: "anna@exempel.se",
  street: "Storgatan 1",
  postcode: "11453",
  city: "Stockholm",
  note: "",
  forRelative: false,
  residentName: null,
  residentPhone: null,
  remind: false,
  acceptTerms: true,
};

function movingDraft(overrides: Partial<RequestDraft> = {}): RequestDraft {
  return {
    ...emptyDraft(),
    categoryId: "flytt",
    serviceId: "bara-lasta",
    housingType: "hyresratt",
    preferredDate: "2026-10-20",
    timeWindow: "formiddag",
    postcode: "11453",
    eligibility: { age18: true, taxSweden: true, rutResidence: true, buyerCount: 1, usedThisYear: "nej" },
    ...overrides,
  };
}

describe("flyttpaket", () => {
  it("pairs moving help with move-out cleaning both ways", () => {
    expect(packageCompanion(catalog, service("flyttstadning"))?.id).toBe("bara-lasta");
    expect(packageCompanion(catalog, service("bara-lasta"))?.id).toBe("flyttstadning");
    expect(packageCompanion(catalog, service("packning"))?.id).toBe("flyttstadning");
    expect(packageCompanion(catalog, service("hemstadning"))).toBeNull();
  });

  it("lists move-out cleaning under Flytt too", () => {
    expect(service("flyttstadning")?.extraCategoryIds).toContain("flytt");
  });

  it("asks for the home size and inspection date when cleaning is added", () => {
    const without = deriveRequest(movingDraft(), catalog);
    expect(without.questions?.size).toBeNull();
    expect(without.companionEstimate).toBeNull();

    const draft = movingDraft({ packageAdd: true });
    const derived = deriveRequest(draft, catalog);
    expect(derived.questions?.size).toBe("required");
    expect(derived.questions?.inspection).toBe(true);
    expect(stepErrors(3, draft, catalog, TODAY).sizeBand).toBeDefined();
    expect(deriveRequest({ ...draft, sizeBand: "60-79", pets: false }, catalog).companionEstimate?.kind).toBe("total");
  });

  it("builds two linked payloads with the inspection date on the cleaning", () => {
    const draft = movingDraft({
      packageAdd: true,
      sizeBand: "60-79",
      pets: false,
      inspection: "date",
      inspectionDate: "2026-10-23",
    });
    const result = buildSubmitPayload({ draft, contact, catalog, today: TODAY, newId: () => "pkg-1" });
    if (!result.ok) throw new Error("expected ok");
    expect(result.payload.service_id).toBe("bara-lasta");
    expect(result.payload.inspection_date).toBeNull();
    expect(result.payload.details.package).toEqual({ id: "pkg-1", role: "main", withServiceId: "flyttstadning" });
    expect(result.companion?.payload.service_id).toBe("flyttstadning");
    expect(result.companion?.payload.size_band).toBe("60-79");
    expect(result.companion?.payload.inspection_date).toBe("2026-10-23");
    expect(result.companion?.payload.details.package).toEqual({ id: "pkg-1", role: "extra", withServiceId: "bara-lasta" });
    expect(result.companion?.payload.estimate.after).not.toBeNull();
  });

  it("drops the package when the service changes", () => {
    const changed = selectService(movingDraft({ packageAdd: true }), "packning", catalog);
    expect(changed.packageAdd).toBe(false);
  });
});

describe("seasonal subscriptions and reminders", () => {
  it("offers subscriptions only for seasonal services", () => {
    expect(seasonalService(service("fonsterputs"))).toBe("fonsterputs");
    expect(seasonalService(service("flyttstadning"))).toBeNull();
  });

  it("dates the reminder two weeks before the job is due again", () => {
    expect(reminderMonths(service("fonsterputs"))).toBe(6);
    expect(reminderDate(service("fonsterputs"), "2026-10-20")).toBe("2027-04-06");
    expect(reminderDate(service("flyttstadning"), "2026-10-20")).toBeNull();
  });

  it("stores the reminder only when asked, and never with a subscription", () => {
    const draft: RequestDraft = {
      ...movingDraft(),
      categoryId: "fonsterputs",
      serviceId: "fonsterputs",
      windows: 10,
      pets: false,
    };
    const asked = buildSubmitPayload({ draft, contact: { ...contact, remind: true }, catalog, today: TODAY });
    if (!asked.ok) throw new Error("expected ok");
    expect(asked.payload.remind_on).toBe("2027-04-06");
    expect(asked.payload.details.recurring).toBe("once");

    const season = buildSubmitPayload({
      draft: { ...draft, recurring: "season" },
      contact: { ...contact, remind: true },
      catalog,
      today: TODAY,
    });
    if (!season.ok) throw new Error("expected ok");
    expect(season.payload.remind_on).toBeNull();
    expect(season.payload.details.recurring).toBe("season");
  });
});

describe("booking for a relative", () => {
  const base = {
    name: "Anna Andersson",
    phone: "070-123 45 67",
    email: "anna@exempel.se",
    street: "Storgatan 1",
    postcode: "11453",
    city: "Stockholm",
    note: "",
    acceptTerms: true,
  };

  it("requires the resident's name and checks the phone", () => {
    const result = validateContact({ ...base, forRelative: true, residentName: "", residentPhone: "123" });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.residentName).toBeDefined();
    expect(result.errors.residentPhone).toBeDefined();
  });

  it("keeps the resident only when booking for someone else", () => {
    const yes = validateContact({ ...base, forRelative: true, residentName: "Greta Andersson", residentPhone: "070-765 43 21" });
    expect(yes.ok && yes.data.residentName).toBe("Greta Andersson");
    expect(yes.ok && yes.data.residentPhone).toBe("+46707654321");
    const no = validateContact({ ...base, forRelative: false, residentName: "Greta", residentPhone: "070-765 43 21" });
    expect(no.ok && no.data.residentName).toBeNull();
  });
});

describe("homepage deep links", () => {
  it("a service link selects its category and service and opens step 3", async () => {
    const { applyDeepLink } = await import("@/lib/booking/state");
    const result = applyDeepLink(emptyDraft(), catalog, { tjanst: "fonsterputs" });
    expect(result?.step).toBe(3);
    expect(result?.draft).toMatchObject({ categoryId: "fonsterputs", serviceId: "fonsterputs" });
  });

  it("a category link opens step 2, unknown ids are ignored", async () => {
    const { applyDeepLink } = await import("@/lib/booking/state");
    expect(applyDeepLink(emptyDraft(), catalog, { kategori: "flytt" })?.step).toBe(2);
    expect(applyDeepLink(emptyDraft(), catalog, { kategori: "finns-inte" })).toBeNull();
  });
});
