import { describe, expect, it } from "vitest";
import { TAX_RULES, getTaxRules } from "@/lib/taxRules";
import {
  daysBetween,
  defaultBuyers,
  isPlausibleToken,
  parseQuote,
  propertyKind,
  quotePrice,
  quoteRules,
  quoteTaxYear,
  quoteView,
  withdrawalWaiverRequired,
  type QuoteData,
} from "../quote";

const KR = 100;

/** A get_quote response as the RPC returns it (snake_case, numerics as numbers). */
function rawQuote(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    booking_number: "NV-2026-00012",
    status: "offert_skickad",
    service_id: "flyttstad",
    service_name: "Flyttstäd",
    deduction_type: "rut",
    model: "seller",
    rot_kind: null,
    labour_share_of_total: null,
    housing_type: "bostadsratt",
    size_band: "60-79",
    details: {},
    preferred_date: "2026-11-02",
    scheduled_date: "2026-11-03",
    scheduled_time_window: "formiddag",
    street: "Storgatan 1",
    postcode: "63220",
    city: "Eskilstuna",
    contact_name: "Anna Svensson",
    buyer_count: 1,
    eligibility: { answers: {}, eligible: true, reasons: [], warnings: [] },
    labour_ore: 8_400 * KR,
    material_ore: 300 * KR,
    travel_ore: 0,
    hours: 6,
    quote_message: "Vi tar med allt material.",
    quote_expires_at: "2026-10-15T12:00:00+00:00",
    performed_in_house: false,
    partner_name: "Städproffsen AB",
    partner_org_nr: "556036-0793",
    approved_at: null,
    declined_at: null,
    ...overrides,
  };
}

function quote(overrides: Record<string, unknown> = {}): QuoteData {
  const parsed = parseQuote(rawQuote(overrides));
  if (!parsed) throw new Error("fixture did not parse");
  return parsed;
}

const NOW = new Date("2026-10-13T10:00:00Z");

describe("parseQuote", () => {
  it("maps the RPC JSON to typed fields", () => {
    const q = quote();
    expect(q).toMatchObject({
      bookingNumber: "NV-2026-00012",
      status: "offert_skickad",
      deductionType: "rut",
      model: "seller",
      housingType: "bostadsratt",
      sizeBand: "60-79",
      scheduledDate: "2026-11-03",
      scheduledTimeWindow: "formiddag",
      labourOre: 840_000,
      materialOre: 30_000,
      travelOre: 0,
      buyerCount: 1,
      hours: 6,
      partnerName: "Städproffsen AB",
      performedInHouse: false,
    });
    expect(q.eligibility).toEqual({ eligible: true, reasons: [], warnings: [] });
  });

  it("returns null for null, arrays and unusable shapes", () => {
    expect(parseQuote(null)).toBeNull();
    expect(parseQuote([])).toBeNull();
    expect(parseQuote(rawQuote({ status: "okänd" }))).toBeNull();
    expect(parseQuote(rawQuote({ deduction_type: "xyz" }))).toBeNull();
    expect(parseQuote(rawQuote({ booking_number: "" }))).toBeNull();
  });

  it("coerces numeric strings, clamps the buyer count and drops bad values", () => {
    const q = quote({
      labour_ore: "420000",
      material_ore: null,
      travel_ore: -5,
      labour_share_of_total: "0.500",
      buyer_count: 9,
      hours: 0,
      scheduled_date: "not a date",
      scheduled_time_window: "kväll",
      quote_message: "   ",
    });
    expect(q.labourOre).toBe(420_000);
    expect(q.materialOre).toBe(0);
    expect(q.travelOre).toBe(0);
    expect(q.labourShareOfTotal).toBe(0.5);
    expect(q.buyerCount).toBe(4);
    expect(q.hours).toBeNull();
    expect(q.scheduledDate).toBeNull();
    expect(q.scheduledTimeWindow).toBeNull();
    expect(q.quoteMessage).toBeNull();
  });

  it("reads the stored eligibility; unknown reasons are ignored, missing flag means eligible", () => {
    expect(quote({ eligibility: {} }).eligibility.eligible).toBe(true);
    const not = quote({ eligibility: { eligible: false, reasons: ["rotRental", "hacker"], warnings: ["usedThisYear"] } });
    expect(not.eligibility).toEqual({ eligible: false, reasons: ["rotRental"], warnings: ["usedThisYear"] });
    expect(quote({ eligibility: { reasons: ["under18"] } }).eligibility.eligible).toBe(false);
  });
});

describe("isPlausibleToken", () => {
  it("accepts base64url tokens and rejects anything else", () => {
    expect(isPlausibleToken("a".repeat(43))).toBe(true);
    expect(isPlausibleToken("abc_DEF-123".repeat(4))).toBe(true);
    expect(isPlausibleToken("short")).toBe(false);
    expect(isPlausibleToken("a".repeat(42) + "/")).toBe(false);
    expect(isPlausibleToken(undefined)).toBe(false);
  });
});

describe("quoteView", () => {
  it("is open while the quote is sent and not expired", () => {
    expect(quoteView(quote(), NOW)).toBe("open");
  });

  it("is expired when the time has passed or the status says so", () => {
    expect(quoteView(quote({ quote_expires_at: "2026-10-13T09:59:00Z" }), NOW)).toBe("expired");
    expect(quoteView(quote({ status: "offert_utgangen" }), NOW)).toBe("expired");
  });

  it("maps answered and later statuses", () => {
    for (const status of ["godkand", "utford", "betald", "rut_rot_begard", "avslutad"]) {
      expect(quoteView(quote({ status }), NOW)).toBe("approved");
    }
    expect(quoteView(quote({ status: "nekad" }), NOW)).toBe("declined");
    expect(quoteView(quote({ status: "avbokad" }), NOW)).toBe("cancelled");
    expect(quoteView(quote({ status: "ny_forfragan" }), NOW)).toBe("notReady");
    expect(quoteView(quote({ status: "soker_utforare" }), NOW)).toBe("notReady");
  });
});

describe("withdrawalWaiverRequired", () => {
  it("is required when the job starts less than 14 days from today (same rule as accept_quote)", () => {
    expect(daysBetween("2026-10-13", "2026-10-27")).toBe(14);
    expect(withdrawalWaiverRequired("2026-10-26", "2026-10-13")).toBe(true);
    expect(withdrawalWaiverRequired("2026-10-14", "2026-10-13")).toBe(true);
    expect(withdrawalWaiverRequired("2026-10-27", "2026-10-13")).toBe(false);
    expect(withdrawalWaiverRequired(null, "2026-10-13")).toBe(false);
  });

  it("counts across month and DST boundaries in whole days", () => {
    expect(daysBetween("2026-10-20", "2026-11-02")).toBe(13);
    expect(withdrawalWaiverRequired("2026-11-02", "2026-10-20")).toBe(true);
  });
});

describe("propertyKind", () => {
  it("asks for fastighetsbeteckning for houses and BRF details for bostadsrätt (ROT only)", () => {
    expect(propertyKind(quote({ deduction_type: "rot", housing_type: "villa" }))).toBe("fastighet");
    expect(propertyKind(quote({ deduction_type: "rot", housing_type: "fritidshus" }))).toBe("fastighet");
    expect(propertyKind(quote({ deduction_type: "rot", housing_type: "bostadsratt" }))).toBe("brf");
    expect(propertyKind(quote({ deduction_type: "rot", housing_type: "hyresratt" }))).toBeNull();
    expect(propertyKind(quote({ deduction_type: "rut", housing_type: "villa" }))).toBeNull();
  });

  it("asks for nothing when the customer is not eligible", () => {
    const q = quote({ deduction_type: "rot", housing_type: "villa", eligibility: { eligible: false, reasons: ["rotNotOwner"] } });
    expect(propertyKind(q)).toBeNull();
  });
});

describe("tax year and rules", () => {
  it("uses the scheduled date, then the preferred date, then today", () => {
    expect(quoteTaxYear({ scheduledDate: "2027-01-04", preferredDate: "2026-12-30" }, "2026-10-13")).toBe(2027);
    expect(quoteTaxYear({ scheduledDate: null, preferredDate: "2026-12-30" }, "2026-10-13")).toBe(2026);
    expect(quoteTaxYear({ scheduledDate: null, preferredDate: null }, "2026-10-13")).toBe(2026);
  });

  it("applies admin overrides for the tax year", () => {
    const rules = quoteRules(quote(), "2026-10-13", [{ year: 2026, rutRate: 0.4 }]);
    expect(rules.rutRate).toBe(0.4);
    expect(rules.isOverridden).toBe(true);
  });
});

describe("quotePrice", () => {
  const rules = getTaxRules(2026);

  it("RUT 50 % on labour only; material and travel are paid in full; no fee", () => {
    const price = quotePrice(quote(), rules);
    expect(price.total).toBe(8_700 * KR);
    expect(price.deduction).toBe(4_200 * KR);
    expect(price.toPay).toBe(4_500 * KR);
  });

  it("ROT is 30 % of labour", () => {
    const price = quotePrice(quote({ deduction_type: "rot", labour_ore: 10_000 * KR, material_ore: 0 }), rules);
    expect(price.deduction).toBe(3_000 * KR);
    expect(price.rate).toBe(TAX_RULES[2026].rotRate);
  });

  it("shows the full price without deduction when not eligible", () => {
    const price = quotePrice(quote({ eligibility: { eligible: false, reasons: ["noSwedishTax"] } }), rules);
    expect(price.deduction).toBe(0);
    expect(price.toPay).toBe(price.total);
  });

  it("uses the labour share of the total price for second-hand transport", () => {
    const q = quote({ labour_ore: 2_000 * KR, material_ore: 0, travel_ore: 2_000 * KR, labour_share_of_total: 0.5 });
    const price = quotePrice(q, rules);
    expect(price.deductibleBase).toBe(2_000 * KR);
    expect(price.deduction).toBe(1_000 * KR);
  });

  it("splits evenly between the request's buyers and caps ROT per person", () => {
    const q = quote({ deduction_type: "rot", labour_ore: 400_000 * KR, material_ore: 0, buyer_count: 2 });
    expect(defaultBuyers(2)).toEqual([{ sharePct: 50 }, { sharePct: 50 }]);
    const price = quotePrice(q, rules);
    // 30 % of 400 000 kr = 120 000 kr, capped at 50 000 kr per person.
    expect(price.buyers.map((b) => b.deduction)).toEqual([50_000 * KR, 50_000 * KR]);
    expect(price.capped).toBe(true);
  });
});
