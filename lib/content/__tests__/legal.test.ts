import { describe, expect, it } from "vitest";
import { company } from "@/lib/company";
import { privacyPolicy, termsOfService, type LegalBlock, type LegalDocument } from "@/lib/content/legal";
import { t } from "@/lib/i18n";
import { CURRENT_RULES } from "@/lib/taxRules";

function blockText(b: LegalBlock): string {
  switch (b.kind) {
    case "p":
      return b.text;
    case "ul":
      return b.items.join("\n");
    case "dl":
      return b.items.map((i) => `${i.term}\n${i.detail}`).join("\n");
    case "links":
      return b.items.map((i) => i.label).join("\n");
  }
}

function documentText(doc: LegalDocument): string {
  return [
    doc.title,
    ...doc.intro,
    ...doc.sections.flatMap((s) => [
      s.title,
      ...s.blocks.map(blockText),
      ...(s.subsections ?? []).flatMap((sub) => [sub.title, ...sub.blocks.map(blockText)]),
    ]),
  ].join("\n");
}

describe("Villkor", () => {
  const doc = termsOfService();
  const text = documentText(doc);
  const ids = doc.sections.map((s) => s.id);

  it("is versioned with the terms version customers accept", () => {
    expect(doc.version).toBe(company.termsVersion);
  });

  it("has unique anchors for the sections other pages link to", () => {
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ["avtalspart", "pris", "avdrag", "betalning", "angerratt", "avbokning", "reklamation", "ansvar", "klagomal"]) {
      expect(ids).toContain(id);
    }
  });

  it("covers both business models, consumer law and complaints", () => {
    expect(text).toContain("förmedlar");
    expect(text).toContain("partnerföretaget som nämns i offerten");
    expect(text).toContain("underleverantör");
    expect(text).toContain("distansavtal");
    expect(text).toContain("konsumenttjänstlagen i 3 år");
    expect(text).toContain("Allmänna reklamationsnämnden");
    expect(text).toContain("14 dagars ångerrätt");
    expect(text).toContain(t.common.legal.notGuaranteed.body);
    expect(text).toContain(t.common.legal.payment.body);
    expect(text).toContain(t.common.legal.labourOnly.body);
    expect(text).toContain(t.common.legal.cap.body);
  });

  it("never shows the commission rate or a fee to the customer", () => {
    expect(text).not.toMatch(/provision|\b12 %|serviceavgift/i);
    expect(text).toContain("ingen bokningsavgift");
  });

  it("derives the rates from the rules", () => {
    const other = documentText(termsOfService({ rules: { ...CURRENT_RULES, rutRate: 0.4, rotRate: 0.2 } }));
    expect(other).toContain("RUT-avdraget är 40 % och ROT-avdraget 20 %");
  });
});

describe("Integritetspolicy", () => {
  const doc = privacyPolicy();
  const text = documentText(doc);
  const ids = doc.sections.map((s) => s.id);

  it("has the #cookies section the footer and cookie notice link to", () => {
    expect(ids).toContain("cookies");
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ["ansvarig", "syften", "personnummer", "mottagare", "lagring", "sakerhet", "rattigheter", "klagomal"]) {
      expect(ids).toContain(id);
    }
  });

  it("covers controller, legal bases, recipients, retention, rights and IMY", () => {
    expect(text).toContain(`Personuppgiftsansvarig är ${company.legalName}`);
    expect(text).toContain("rättslig förpliktelse");
    expect(text).toContain("Skatteverket");
    expect(text).toContain("7 år efter att Skatteverket");
    expect(text).toContain("90 dagar");
    expect(text).toContain("Integritetsskyddsmyndigheten");
    expect(text).toContain("AES-256-GCM");
    expect(text).toContain(t.common.legal.personnummer.body);
  });

  it("uses the retention settings it is given", () => {
    const other = documentText(privacyPolicy({ retentionYears: 10, unusedRetentionDays: 30 }));
    expect(other).toContain("10 år efter att Skatteverket");
    expect(other).toContain("högst 30 dagar");
  });

  it("only describes necessary cookies", () => {
    const cookies = doc.sections.find((s) => s.id === "cookies")!;
    const cookieText = cookies.blocks.map(blockText).join("\n");
    expect(cookieText).toContain("bara nödvändiga cookies");
    expect(cookieText).toContain("Innehåller aldrig personnummer");
  });
});
