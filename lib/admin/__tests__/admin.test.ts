import { describe, expect, it } from "vitest";
import { filtersToQuery, parseBookingFilters } from "@/lib/admin/filters";
import { coversPostcode, parsePostcodePrefixes, rankPartners, type PartnerRow } from "@/lib/admin/partners";
import { computeStats, type StatsBooking } from "@/lib/admin/stats";
import { buildRows, csvEscape, requestedPerBuyer, toCsv, type ExportBooking } from "@/lib/admin/csv";

describe("booking filters", () => {
  it("keeps only valid values", () => {
    const f = parseBookingFilters({ status: "godkand", tjanst: "flyttstadning", fran: "2026-10-01", till: "bad", postnr: "632 2", sida: "2" });
    expect(f).toEqual({ status: "godkand", service: "flyttstadning", from: "2026-10-01", to: null, postcode: "6322", page: 2 });
    expect(parseBookingFilters({ status: "hacked", tjanst: "x;drop" })).toMatchObject({ status: null, service: null, page: 1 });
  });

  it("round-trips to a query string", () => {
    const f = parseBookingFilters({ status: "nekad", postnr: "63" });
    expect(filtersToQuery(f)).toBe("?status=nekad&postnr=63");
    expect(filtersToQuery(f, { page: 3 })).toBe("?status=nekad&postnr=63&sida=3");
  });
});

const partner = (over: Partial<PartnerRow>): PartnerRow => ({
  active: true,
  commission_pct: 12,
  contact_name: null,
  created_at: "",
  email: null,
  employer_registered: true,
  f_skatt_checked_at: "2026-10-01",
  f_skatt_verified: true,
  id: "p",
  insurance_company: null,
  insurance_valid_to: null,
  internal_price_notes: null,
  name: "A",
  notes: null,
  org_nr: "556036-0793",
  phone: null,
  postcode_prefixes: [],
  rating: null,
  regions: [],
  service_ids: [],
  subcontractor_agreement_signed: true,
  updated_at: "",
  ...over,
});

describe("partners", () => {
  it("covers all of Sweden when no prefixes are set", () => {
    expect(coversPostcode({ postcode_prefixes: [] }, "11122")).toBe(true);
    expect(coversPostcode({ postcode_prefixes: ["63", "64"] }, "63220")).toBe(true);
    expect(coversPostcode({ postcode_prefixes: ["63"] }, "11122")).toBe(false);
  });

  it("ranks matching, assignable partners first and explains blocks", () => {
    const ranked = rankPartners(
      [
        partner({ id: "far", name: "Far", service_ids: ["flyttstadning"], postcode_prefixes: ["11"] }),
        partner({ id: "noskatt", name: "Utan F-skatt", service_ids: ["flyttstadning"], f_skatt_verified: false, f_skatt_checked_at: null }),
        partner({ id: "good", name: "Bra", service_ids: ["flyttstadning"], postcode_prefixes: ["63"] }),
      ],
      "flyttstadning",
      "63220",
    );
    expect(ranked.map((r) => r.partner.id)).toEqual(["good", "noskatt", "far"]);
    expect(ranked[1].blockedReason).toBe("F-skatt ej verifierad");
  });

  it("parses postcode prefixes", () => {
    expect(parsePostcodePrefixes("63, 64 1; 63\nabc")).toEqual(["63", "641"]);
  });
});

describe("dashboard stats", () => {
  const base: StatsBooking = {
    created_at: "2026-10-13T10:00:00Z",
    status: "ny_forfragan",
    model: "seller",
    labour_ore: null,
    material_ore: 0,
    travel_ore: 0,
    subcontractor_cost_ore: null,
    commission_pct: null,
    paid_amount_ore: null,
    claim_requested_ore: null,
  };

  it("buckets by ISO week and sums money by model", () => {
    const s = computeStats(
      [
        base,
        { ...base, created_at: "2026-10-05T10:00:00Z", status: "betald", labour_ore: 840000, subcontractor_cost_ore: 600000, paid_amount_ore: 420000, claim_requested_ore: 420000 },
        { ...base, model: "agent", status: "godkand", labour_ore: 1000000, commission_pct: 12 },
        { ...base, created_at: "2025-01-01T10:00:00Z" },
      ],
      new Date("2026-10-14T12:00:00Z"),
    );
    expect(s.weeks).toHaveLength(12);
    expect(s.weeks.at(-1)).toMatchObject({ weekStart: "2026-10-12", count: 2, label: "v. 42" });
    expect(s.weeks.at(-2)?.count).toBe(1);
    expect(s.total).toBe(4);
    expect(s.sellerRevenueOre).toBe(420000);
    expect(s.sellerMarginOre).toBe(240000);
    expect(s.agentCommissionOre).toBe(120000);
    expect(s.requestedDeductionOre).toBe(420000);
    expect(s.byStatus.ny_forfragan).toBe(2);
  });
});

describe("CSV export", () => {
  const booking: ExportBooking = {
    booking_number: "NV-2026-00001",
    deduction_type: "rut",
    skv_work_type: "Städning",
    labour_ore: 840000,
    material_ore: 0,
    travel_ore: 0,
    hours: 6.5,
    invoice_number: "F-1",
    invoice_date: "2026-10-20",
    paid_amount_ore: 420000,
    paid_at: "2026-10-25",
    payment_method: "swish",
    scheduled_date: "2026-10-18",
    created_at: "2026-10-13T10:00:00Z",
    eligibility: { eligible: true },
    labour_share_of_total: null,
    rot_property: null,
    partner: { name: "Städbolaget AB", org_nr: "556036-0793" },
    buyers: [
      { full_name: "Anna Andersson", personnummer: "191212121212", share_pct: 50 },
      { full_name: "Bo Berg", personnummer: "197010632391", share_pct: 50 },
    ],
  };

  it("requests the deduction per buyer", () => {
    expect(requestedPerBuyer(booking)).toEqual([210000, 210000]);
  });

  it("writes one row per buyer with whole kronor", () => {
    const rows = buildRows([booking]);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual([
      "NV-2026-00001", "Anna Andersson", "191212121212", "50", "F-1", "2026-10-20",
      "8400", "0", "0", "4200", "2026-10-25", "Swish", "2100", "6,5", "Städning", "RUT",
      "", "", "", "Städbolaget AB", "556036-0793",
    ]);
  });

  it("escapes and adds a BOM", () => {
    expect(csvEscape('a;b "c"')).toBe('"a;b ""c"""');
    const csv = toCsv([["x", "y"]]);
    expect(csv.startsWith("﻿Bokningsnummer;")).toBe(true);
    expect(csv.endsWith("x;y\r\n")).toBe(true);
  });
});
