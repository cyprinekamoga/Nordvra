import { describe, expect, it } from "vitest";
import {
  contactInputFromFormData,
  containsPersonnummer,
  redactPersonnummer,
  requestDraftSchema,
  storedDraftSchema,
  validateContact,
  type ContactFormValues,
} from "@/lib/booking/schema";

const valid: ContactFormValues = {
  name: "Anna Andersson",
  phone: "070-123 45 67",
  email: "  Anna.Andersson@Exempel.SE ",
  street: "Storgatan 1",
  postcode: "114 53",
  city: "Stockholm",
  note: "Portkod 1234",
  acceptTerms: true,
};

describe("validateContact", () => {
  it("accepts valid details and normalises phone, email and postcode", () => {
    const result = validateContact(valid);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.phone).toBe("+46701234567");
    expect(result.data.email).toBe("anna.andersson@exempel.se");
    expect(result.data.postcode).toBe("11453");
    expect(result.data.note).toBe("Portkod 1234");
  });

  it("accepts +46 numbers and an empty note", () => {
    const result = validateContact({ ...valid, phone: "+46 70 123 45 67", note: "" });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.phone).toBe("+46701234567");
  });

  it("returns one Swedish message per invalid field", () => {
    const result = validateContact({
      name: " A ",
      phone: "12",
      email: "anna@",
      street: "",
      postcode: "1145",
      city: "",
      note: "",
      acceptTerms: false,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(Object.keys(result.errors).sort()).toEqual(
      ["acceptTerms", "city", "email", "name", "phone", "postcode", "street"].sort(),
    );
    expect(result.errors.acceptTerms).toMatch(/godkänna villkoren/);
    expect(result.errors.postcode).toMatch(/fem siffror/);
    expect(result.errors.phone).toMatch(/telefonnummer/);
  });

  it("requires the terms checkbox", () => {
    const result = validateContact({ ...valid, acceptTerms: false });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(Object.keys(result.errors)).toEqual(["acceptTerms"]);
  });

  it("rejects a personnummer in the note", () => {
    const result = validateContact({ ...valid, note: "Mitt personnummer är 19121212-1212" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.note).toMatch(/personnumret/);
  });

  it("limits the note to 2 000 characters", () => {
    const result = validateContact({ ...valid, note: "a".repeat(2001) });
    expect(result.ok).toBe(false);
  });
});

describe("contactInputFromFormData", () => {
  it("reads the named fields and the checkbox", () => {
    const form = new FormData();
    form.set("name", "Anna");
    form.set("acceptTerms", "on");
    const input = contactInputFromFormData(form);
    expect(input.name).toBe("Anna");
    expect(input.phone).toBe("");
    expect(input.acceptTerms).toBe(true);
    expect(contactInputFromFormData(new FormData()).acceptTerms).toBe(false);
  });
});

describe("personnummer guard", () => {
  it("finds valid personnummer with separator or 12 digits", () => {
    expect(containsPersonnummer("121212-1212")).toBe(true);
    expect(containsPersonnummer("pnr 191212121212 tack")).toBe(true);
    expect(containsPersonnummer("19121212-1212")).toBe(true);
  });

  it("leaves phone numbers, door codes and invalid numbers alone", () => {
    expect(containsPersonnummer("Ring 070-123 45 67")).toBe(false);
    expect(containsPersonnummer("0701234567")).toBe(false);
    expect(containsPersonnummer("Portkod 1234")).toBe(false);
    expect(containsPersonnummer("121212-1213")).toBe(false);
    expect(containsPersonnummer("")).toBe(false);
  });

  it("redacts only valid personnummer", () => {
    expect(redactPersonnummer("a 121212-1212 b 121212-1213")).toBe("a  b 121212-1213");
  });
});

describe("requestDraftSchema", () => {
  it("fills defaults for an empty draft", () => {
    expect(requestDraftSchema.parse({})).toEqual({
      addonIds: [],
      appliances: [],
      flexible: false,
      eligibility: {},
      contact: {},
    });
  });

  it("strips unknown keys such as a personnummer", () => {
    const parsed = requestDraftSchema.parse({ serviceId: "flyttstadning", personnummer: "19121212-1212" });
    expect(parsed).not.toHaveProperty("personnummer");
    expect(parsed.serviceId).toBe("flyttstadning");
  });

  it("rejects values outside the allowed sets", () => {
    expect(requestDraftSchema.safeParse({ housingType: "slott" }).success).toBe(false);
    expect(requestDraftSchema.safeParse({ windows: 61 }).success).toBe(false);
    expect(requestDraftSchema.safeParse({ floors: 0 }).success).toBe(false);
    expect(requestDraftSchema.safeParse({ postcode: "114 53" }).success).toBe(false);
    expect(requestDraftSchema.safeParse({ preferredDate: "20.10.2026" }).success).toBe(false);
  });

  it("only accepts version 1 envelopes", () => {
    expect(storedDraftSchema.safeParse({ v: 1, draft: {} }).success).toBe(true);
    expect(storedDraftSchema.safeParse({ v: 2, draft: {} }).success).toBe(false);
  });
});
