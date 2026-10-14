import { randomBytes } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { decryptPII, encryptPII } from "@/lib/crypto/pii";
import { t } from "@/lib/i18n";
import { getTaxRules } from "@/lib/taxRules";
import {
  FIELD,
  approvalInputFromFormData,
  buildAcceptPayload,
  buyerPreview,
  declineReasonText,
  evenShareStrings,
  fieldId,
  nameError,
  orderedErrors,
  parseShare,
  sharesSum,
  validateApproval,
  type ApprovalContext,
  type ApprovalInput,
} from "../form";

const e = t.quote.errors;
const KR = 100;
const TODAY = new Date("2026-10-13T12:00:00Z");

// Luhn-valid test numbers (not real people).
const PNR_A = "19121212-1212";
const PNR_B = "198112189876";
const PNR_MINOR = "20100515-1236"; // turns 16 in 2026
const BRF_ORG = "769600-1234";

const ctx = (over: Partial<ApprovalContext> = {}): ApprovalContext => ({
  propertyKind: null,
  waiverRequired: false,
  today: TODAY,
  ...over,
});

function input(over: Partial<ApprovalInput> = {}): ApprovalInput {
  return {
    buyers: [{ name: "Anna Svensson", pnr: PNR_A, share: "100" }],
    property: { fastighetsbeteckning: "", brfOrgNr: "", lagenhetsnummer: "" },
    consents: { deduction: true, withdrawalWaiver: false, terms: true },
    ...over,
  };
}

describe("shares", () => {
  it("parses whole percent 1–100", () => {
    expect(parseShare("50")).toBe(50);
    expect(parseShare(" 33 % ")).toBe(33);
    expect(parseShare("100")).toBe(100);
    expect(parseShare("0")).toBeNull();
    expect(parseShare("101")).toBeNull();
    expect(parseShare("12,5")).toBeNull();
    expect(parseShare("")).toBeNull();
  });

  it("sums the shares and splits evenly", () => {
    expect(sharesSum([{ share: "50" }, { share: "30" }, { share: "x" }])).toBe(80);
    expect(evenShareStrings(3)).toEqual(["34", "33", "33"]);
    expect(evenShareStrings(4)).toEqual(["25", "25", "25", "25"]);
  });
});

describe("nameError", () => {
  it("needs a first and a last name", () => {
    expect(nameError("Anna Svensson")).toBeNull();
    expect(nameError("  Åsa   Öberg-Ek ")).toBeNull();
    expect(nameError("")).toBe(e.nameRequired);
    expect(nameError("Anna")).toBe(e.nameFull);
    expect(nameError("Anna 123")).toBe(e.nameFull);
    expect(nameError(`Anna ${"x".repeat(100)}`)).toBe(e.nameTooLong);
  });
});

describe("validateApproval", () => {
  it("accepts one buyer, normalises the personnummer and always uses 100 %", () => {
    // 10 digits: the most recent century in which the date isn't in the future.
    const result = validateApproval(input({ buyers: [{ name: " Anna  Svensson ", pnr: "811218-9876", share: "" }] }), ctx());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.buyers).toEqual([
      { fullName: "Anna Svensson", normalized: "198112189876", masked: "811218-XXXX", birthYear: 1981, sharePct: 100 },
    ]);
    expect(result.data.property).toBeNull();
    expect(result.data.consents).toEqual({ deduction: true, terms: true, withdrawalWaiver: false });
  });

  it("gives a Swedish message per personnummer error code", () => {
    const check = (pnr: string) => {
      const r = validateApproval(input({ buyers: [{ name: "Anna Svensson", pnr, share: "100" }] }), ctx());
      return r.ok ? null : r.errors[FIELD.buyerPnr(0)];
    };
    expect(check("")).toBe(e.pnrRequired);
    expect(check("1212")).toBe(e.pnrFormat);
    expect(check("19121312-1212")).toBe(e.pnrDate);
    expect(check("19121212-1213")).toBe(e.pnrChecksum);
  });

  it("rejects the same personnummer twice", () => {
    const r = validateApproval(
      input({
        buyers: [
          { name: "Anna Svensson", pnr: PNR_A, share: "50" },
          { name: "Bo Svensson", pnr: "191212121212", share: "50" },
        ],
      }),
      ctx(),
    );
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors[FIELD.buyerPnr(1)]).toBe("Samma personnummer finns redan hos köpare 1.");
  });

  it("requires several buyers' shares to add up to 100 %", () => {
    const buyers = [
      { name: "Anna Svensson", pnr: PNR_A, share: "60" },
      { name: "Bo Svensson", pnr: PNR_B, share: "30" },
    ];
    const r = validateApproval(input({ buyers }), ctx());
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors[FIELD.shares]).toBe("Andelarna måste bli 100 % tillsammans. Nu blir de 90 %.");

    const ok = validateApproval(input({ buyers: [buyers[0], { ...buyers[1], share: "40" }] }), ctx());
    expect(ok.ok && ok.data.buyers.map((b) => b.sharePct)).toEqual([60, 40]);
  });

  it("flags an invalid share on the buyer, not the total", () => {
    const r = validateApproval(
      input({
        buyers: [
          { name: "Anna Svensson", pnr: PNR_A, share: "" },
          { name: "Bo Svensson", pnr: PNR_B, share: "150" },
        ],
      }),
      ctx(),
    );
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors[FIELD.buyerShare(0)]).toBe(e.shareRequired);
    expect(r.errors[FIELD.buyerShare(1)]).toBe(e.shareRange);
    expect(r.errors[FIELD.shares]).toBeUndefined();
  });

  it("allows 1–4 buyers only", () => {
    const five = Array.from({ length: 5 }, () => ({ name: "Anna Svensson", pnr: PNR_A, share: "20" }));
    expect(validateApproval(input({ buyers: five }), ctx()).ok).toBe(false);
    expect(validateApproval(input({ buyers: [] }), ctx()).ok).toBe(false);
  });

  it("requires the deduction and terms consents, and the waiver only within 14 days", () => {
    const none = input({ consents: { deduction: false, withdrawalWaiver: false, terms: false } });
    const r = validateApproval(none, ctx({ waiverRequired: true }));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors[FIELD.consentDeduction]).toBe(e.deductionConsent);
    expect(r.errors[FIELD.consentTerms]).toBe(e.termsConsent);
    expect(r.errors[FIELD.consentWaiver]).toBe(e.waiverConsent);

    const noWaiverNeeded = validateApproval(input(), ctx({ waiverRequired: false }));
    expect(noWaiverNeeded.ok).toBe(true);

    const waived = validateApproval(
      input({ consents: { deduction: true, withdrawalWaiver: true, terms: true } }),
      ctx({ waiverRequired: true }),
    );
    expect(waived.ok && waived.data.consents.withdrawalWaiver).toBe(true);
  });

  it("validates the fastighetsbeteckning for houses", () => {
    const house = ctx({ propertyKind: "fastighet" });
    const missing = validateApproval(input(), house);
    expect(!missing.ok && missing.errors[FIELD.fastighetsbeteckning]).toBe(e.fastighetRequired);

    const wrong = validateApproval(
      input({ property: { fastighetsbeteckning: "Storgatan 1", brfOrgNr: "", lagenhetsnummer: "" } }),
      house,
    );
    expect(!wrong.ok && wrong.errors[FIELD.fastighetsbeteckning]).toBe(e.fastighetFormat);

    const ok = validateApproval(
      input({ property: { fastighetsbeteckning: " Nacka  Sicklaön 123:4 ", brfOrgNr: "", lagenhetsnummer: "" } }),
      house,
    );
    expect(ok.ok && ok.data.property).toEqual({ fastighetsbeteckning: "Nacka Sicklaön 123:4" });
  });

  it("validates the association's org.nr and the lägenhetsnummer for bostadsrätt", () => {
    const brf = ctx({ propertyKind: "brf" });
    const missing = validateApproval(input(), brf);
    expect(!missing.ok && missing.errors[FIELD.brfOrgNr]).toBe(e.brfRequired);
    expect(!missing.ok && missing.errors[FIELD.lagenhetsnummer]).toBe(e.lagenhetRequired);

    const wrong = validateApproval(
      input({ property: { fastighetsbeteckning: "", brfOrgNr: "769600-1235", lagenhetsnummer: "12-01" } }),
      brf,
    );
    expect(!wrong.ok && wrong.errors[FIELD.brfOrgNr]).toBe(e.brfInvalid);
    expect(!wrong.ok && wrong.errors[FIELD.lagenhetsnummer]).toBe(e.lagenhetInvalid);

    const ok = validateApproval(
      input({ property: { fastighetsbeteckning: "", brfOrgNr: "7696001234", lagenhetsnummer: " 1101 " } }),
      brf,
    );
    expect(ok.ok && ok.data.property).toEqual({ brf_org_nr: BRF_ORG, lagenhetsnummer: "1101" });
  });

  it("ignores property fields when none are needed", () => {
    const r = validateApproval(
      input({ property: { fastighetsbeteckning: "x", brfOrgNr: "y", lagenhetsnummer: "z" } }),
      ctx({ propertyKind: null }),
    );
    expect(r.ok && r.data.property).toBeNull();
  });
});

describe("approvalInputFromFormData", () => {
  it("reads buyers by the hidden count and checkboxes by presence", () => {
    const fd = new FormData();
    fd.set(FIELD.buyerCount, "2");
    fd.set(FIELD.buyerName(0), "Anna Svensson");
    fd.set(FIELD.buyerPnr(0), PNR_A);
    fd.set(FIELD.buyerShare(0), "50");
    fd.set(FIELD.buyerName(1), "Bo Svensson");
    fd.set(FIELD.buyerPnr(1), PNR_B);
    fd.set(FIELD.buyerShare(1), "50");
    fd.set(FIELD.buyerName(2), "Ignoreras Utanför");
    fd.set(FIELD.consentDeduction, "on");
    fd.set(FIELD.consentTerms, "on");
    fd.set(FIELD.fastighetsbeteckning, "Nacka Sicklaön 123:4");
    const parsed = approvalInputFromFormData(fd);
    expect(parsed.buyers).toHaveLength(2);
    expect(parsed.buyers[1]).toEqual({ name: "Bo Svensson", pnr: PNR_B, share: "50" });
    expect(parsed.consents).toEqual({ deduction: true, withdrawalWaiver: false, terms: true });
    expect(parsed.property.fastighetsbeteckning).toBe("Nacka Sicklaön 123:4");
    expect(validateApproval(parsed, ctx()).ok).toBe(true);
  });

  it("caps a forged buyer count so validation fails instead of reading endless fields", () => {
    const fd = new FormData();
    fd.set(FIELD.buyerCount, "999");
    expect(approvalInputFromFormData(fd).buyers).toHaveLength(5);
    fd.set(FIELD.buyerCount, "abc");
    expect(approvalInputFromFormData(fd).buyers).toHaveLength(0);
  });
});

describe("buildAcceptPayload", () => {
  beforeAll(() => {
    process.env.PII_ENCRYPTION_KEY = randomBytes(32).toString("base64");
  });

  it("encrypts the personnummer and sends only ciphertext + masked form", () => {
    const r = validateApproval(
      input({
        buyers: [
          { name: "Anna Svensson", pnr: PNR_A, share: "34" },
          { name: "Bo Svensson", pnr: PNR_B, share: "66" },
        ],
        consents: { deduction: true, withdrawalWaiver: true, terms: true },
        property: { fastighetsbeteckning: "Nacka Sicklaön 123:4", brfOrgNr: "", lagenhetsnummer: "" },
      }),
      ctx({ propertyKind: "fastighet", waiverRequired: true }),
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const payload = buildAcceptPayload(r.data, encryptPII);

    expect(payload.p_buyers).toHaveLength(2);
    expect(payload.p_buyers[0]).toMatchObject({ full_name: "Anna Svensson", pnr_masked: "121212-XXXX", share_pct: 34 });
    expect(payload.p_buyers[1]).toMatchObject({ full_name: "Bo Svensson", pnr_masked: "811218-XXXX", share_pct: 66 });
    for (const buyer of payload.p_buyers) expect(buyer.pnr_encrypted.startsWith("v1.")).toBe(true);
    expect(decryptPII(payload.p_buyers[0].pnr_encrypted)).toBe("191212121212");
    expect(decryptPII(payload.p_buyers[1].pnr_encrypted)).toBe("198112189876");

    const json = JSON.stringify(payload);
    expect(json).not.toContain("191212121212");
    expect(json).not.toContain("1212-1212");
    expect(json).not.toContain("198112189876");

    expect(payload.p_rot_property).toEqual({ fastighetsbeteckning: "Nacka Sicklaön 123:4" });
    expect(payload.p_consents).toEqual({ deduction: true, terms: true, withdrawal_waiver: true });
  });
});

describe("buyerPreview", () => {
  const rules = getTaxRules(2026);
  const base = {
    deductionType: "rut" as const,
    lines: { labour: 8_400 * KR, material: 0, travel: 0 },
    rules,
    eligible: true,
    labourShareOfTotal: null,
    taxYear: 2026,
  };

  it("splits the deduction by share", () => {
    const p = buyerPreview({ ...base, buyers: [{ share: "75", birthYear: 1980 }, { share: "25", birthYear: 1982 }] });
    expect(p.valid).toBe(true);
    if (!p.valid) return;
    expect(p.rows.map((r) => r.deduction)).toEqual([3_150 * KR, 1_050 * KR]);
    expect(p.deduction).toBe(4_200 * KR);
    expect(p.toPay).toBe(4_200 * KR);
  });

  it("is not valid until the shares add up to 100 %", () => {
    expect(buyerPreview({ ...base, buyers: [{ share: "50", birthYear: null }, { share: "", birthYear: null }] }).valid).toBe(false);
    expect(buyerPreview({ ...base, buyers: [{ share: "50", birthYear: null }, { share: "40", birthYear: null }] }).valid).toBe(false);
  });

  it("one buyer always gets 100 %", () => {
    const p = buyerPreview({ ...base, buyers: [{ share: "", birthYear: null }] });
    expect(p.valid && p.rows[0].sharePct).toBe(100);
  });

  it("gives no deduction to a buyer who turns under 18 this year", () => {
    const p = buyerPreview({ ...base, buyers: [{ share: "50", birthYear: 1980 }, { share: "50", birthYear: 2010 }] });
    expect(p.valid).toBe(true);
    if (!p.valid) return;
    expect(p.rows[1]).toMatchObject({ under18: true, deduction: 0 });
    expect(p.deduction).toBe(2_100 * KR);
    expect(p.toPay).toBe(6_300 * KR);
    // Turning 18 during the year is enough.
    const eighteen = buyerPreview({ ...base, buyers: [{ share: "", birthYear: 2008 }] });
    expect(eighteen.valid && eighteen.rows[0].under18).toBe(false);
  });

  it("reads the minor's birth year from a personnummer", async () => {
    const { birthYearOf } = await import("../form");
    expect(birthYearOf(PNR_MINOR, TODAY)).toBe(2010);
    expect(birthYearOf("nonsense", TODAY)).toBeNull();
  });
});

describe("error summary helpers", () => {
  it("orders errors as they appear on the page and builds DOM ids", () => {
    const errors = {
      [FIELD.consentTerms]: "terms",
      [FIELD.buyerPnr(1)]: "pnr 2",
      [FIELD.buyerName(0)]: "name 1",
      [FIELD.shares]: "shares",
    };
    expect(orderedErrors(errors, 2).map(([k]) => k)).toEqual([
      FIELD.buyerName(0),
      FIELD.buyerPnr(1),
      FIELD.shares,
      FIELD.consentTerms,
    ]);
    expect(fieldId(FIELD.buyerPnr(1))).toBe("offert-buyers-1-pnr");
    expect(fieldId(FIELD.consentWaiver)).toBe("offert-consent-withdrawal-waiver");
  });
});

describe("declineReasonText", () => {
  it("joins the chosen reasons in a fixed order with Swedish labels", () => {
    expect(declineReasonText(["wrong_time", "too_expensive"], "")).toBe("För dyrt, Fel tid");
    expect(declineReasonText([], "")).toBeNull();
    expect(declineReasonText(["hack"], "")).toBeNull();
  });

  it("keeps the free text only with Annat and strips personnummer from it", () => {
    expect(declineReasonText(["found_other"], "ignored")).toBe("Har hittat annan lösning");
    expect(declineReasonText(["other"], "  Vi väntar   till våren ")).toBe("Annat: Vi väntar till våren");
    expect(declineReasonText(["other"], `Mitt nummer är ${PNR_A}`)).toBe("Annat: Mitt nummer är");
    expect(declineReasonText(["other"], "x".repeat(400))?.length).toBe("Annat: ".length + 300);
  });
});
