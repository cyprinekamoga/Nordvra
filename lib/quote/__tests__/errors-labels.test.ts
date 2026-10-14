import { describe, expect, it } from "vitest";
import { t } from "@/lib/i18n";
import { acceptErrorAnswer, declineErrorAnswer, rpcErrorCode } from "../errors";
import { FIELD } from "../form";
import { counterpartyText, deductionLabel, deductionName } from "../labels";

describe("rpcErrorCode", () => {
  it("finds the code inside the database message", () => {
    expect(rpcErrorCode("quote_expired")).toBe("quote_expired");
    expect(rpcErrorCode('ERROR: missing_withdrawal_waiver (SQLSTATE P0001)')).toBe("missing_withdrawal_waiver");
    expect(rpcErrorCode("invalid_shares")).toBe("invalid_shares");
    expect(rpcErrorCode("something else")).toBe("other");
    expect(rpcErrorCode(undefined)).toBe("other");
  });
});

describe("acceptErrorAnswer", () => {
  it("reloads the page when the quote is no longer open", () => {
    expect(acceptErrorAnswer("quote_expired").reload).toBe(true);
    expect(acceptErrorAnswer("quote_not_open").reload).toBe(true);
    expect(acceptErrorAnswer("quote_not_found").reload).toBe(false);
  });

  it("maps field-level problems to the right fields, in Swedish", () => {
    expect(acceptErrorAnswer("missing_withdrawal_waiver").fieldErrors[FIELD.consentWaiver]).toBe(
      t.quote.errors.waiverConsent,
    );
    expect(acceptErrorAnswer("invalid_shares").fieldErrors[FIELD.shares]).toBeTruthy();
  });

  it("offers the phone number when something unexpected happens", () => {
    expect(acceptErrorAnswer("other").message).toContain("076-113 43 84");
    expect(acceptErrorAnswer("buyers_exist").message).toContain("076-113 43 84");
    expect(declineErrorAnswer("other").message).toContain("076-113 43 84");
    expect(declineErrorAnswer("quote_not_open").reload).toBe(true);
  });
});

describe("deduction labels", () => {
  it("names the deduction with its rate – never 'halva priset'", () => {
    expect(deductionName("rut")).toBe("RUT-avdrag");
    expect(deductionLabel("rut", 50)).toBe("RUT-avdrag 50 %");
    expect(deductionLabel("rot", 30)).toBe("ROT-avdrag 30 %");
    expect(JSON.stringify(t.quote)).not.toMatch(/halva priset|kryphål|loophole|serviceavgift/i);
  });
});

describe("counterpartyText", () => {
  const base = {
    model: "seller" as const,
    partnerName: "Städproffsen AB",
    partnerOrgNr: "556036-0793",
    performedInHouse: false,
    deductionType: "rut" as const,
    eligibility: { eligible: true, reasons: [], warnings: [] },
  };

  it("seller model: TO Städ och Flytt is avtalspart, names the subcontractor, 3-year complaint right", () => {
    const text = counterpartyText(base);
    expect(text.headline).toBe("Avtalspart: TO Städ och Flytt");
    expect(text.lines[0]).toBe("Arbetet utförs av vår underleverantör Städproffsen AB.");
    expect(text.lines).toContain("Du har reklamationsrätt enligt konsumenttjänstlagen i 3 år.");
    expect(text.inHouse).toBe(false);
  });

  it("seller model in-house: no subcontractor line, in-house notice", () => {
    const text = counterpartyText({ ...base, performedInHouse: true, partnerName: "TO Städ och Flytt" });
    expect(text.lines.some((l) => l.includes("underleverantör"))).toBe(false);
    expect(text.inHouse).toBe(true);
  });

  it("agent model: the partner is avtalspart, förmedlat av TO Städ och Flytt, and applies for ROT", () => {
    const text = counterpartyText({ ...base, model: "agent", deductionType: "rot", partnerName: "Måleri AB" });
    expect(text.headline).toBe("Avtalspart: Måleri AB (org.nr 556036-0793), förmedlat av TO Städ och Flytt");
    expect(text.lines[0]).toBe(
      "Måleri AB skickar fakturan, tar emot betalningen och ansöker om ROT-avdrag hos Skatteverket.",
    );
  });

  it("agent model without org.nr or partner name still reads well", () => {
    const text = counterpartyText({ ...base, model: "agent", partnerName: null, partnerOrgNr: null });
    expect(text.headline).toBe(
      "Avtalspart: partnerföretaget (org.nr uppges i bekräftelsen), förmedlat av TO Städ och Flytt",
    );
    expect(text.lines[0].startsWith("Partnerföretaget skickar fakturan")).toBe(true);
  });

  it("no deduction: does not promise to apply for one", () => {
    const text = counterpartyText({ ...base, eligibility: { eligible: false, reasons: [], warnings: [] } });
    expect(text.lines.some((l) => l.includes("ansöker"))).toBe(false);
  });
});
