import { describe, expect, it } from "vitest";
import {
  looksLikeFastighetsbeteckning,
  normalizePhone,
  parseOrgNr,
  parsePersonnummer,
} from "@/lib/validation/identity";

const today = new Date("2026-10-12T12:00:00Z");

describe("parsePersonnummer", () => {
  it("accepts the common formats and normalises to 12 digits", () => {
    for (const input of ["19121212-1212", "191212121212", "121212+1212"]) {
      const r = parsePersonnummer(input, today);
      expect(r).toMatchObject({ ok: true, normalized: "191212121212", masked: "121212-XXXX" });
    }
    // Without century or "+", the most recent possible century is used.
    expect(parsePersonnummer("121212-1212", today)).toMatchObject({ normalized: "201212121212" });
  });

  it("infers the century for short numbers", () => {
    const r = parsePersonnummer("080101-1230", today);
    expect(r.ok && r.birthDate.year).toBe(2008);
    const old = parsePersonnummer("080101+1230", today);
    expect(old.ok && old.birthDate.year).toBe(1908);
    // A birthday later this year than today belongs to the previous century.
    const future = parsePersonnummer("811218-9876", today);
    expect(future.ok && future.birthDate.year).toBe(1981);
  });

  it("accepts samordningsnummer", () => {
    const r = parsePersonnummer("701063-2391", today);
    expect(r).toMatchObject({ ok: true, isSamordningsnummer: true });
  });

  it("rejects a wrong check digit, an invalid date and bad format", () => {
    expect(parsePersonnummer("121212-1213", today)).toEqual({ ok: false, error: "checksum" });
    expect(parsePersonnummer("19121312-1212", today)).toEqual({ ok: false, error: "date" });
    expect(parsePersonnummer("12-12", today)).toEqual({ ok: false, error: "format" });
  });
});

describe("other identifiers", () => {
  it("validates organisationsnummer", () => {
    expect(parseOrgNr("769601-1233")).toEqual({ ok: true, normalized: "769601-1233" });
    expect(parseOrgNr("5560360793")).toEqual({ ok: true, normalized: "556036-0793" });
    expect(parseOrgNr("769601-1234").ok).toBe(false);
  });

  it("checks the shape of a fastighetsbeteckning", () => {
    expect(looksLikeFastighetsbeteckning("Nacka Sicklaön 123:4")).toBe(true);
    expect(looksLikeFastighetsbeteckning("Sicklaön")).toBe(false);
  });

  it("normalises Swedish phone numbers", () => {
    expect(normalizePhone("072-222 88 00")).toBe("+46722228800");
    expect(normalizePhone("+46 72 222 88 00")).toBe("+46722228800");
    expect(normalizePhone("12")).toBeNull();
  });
});
