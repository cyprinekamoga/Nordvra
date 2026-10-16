import { describe, expect, it } from "vitest";
import {
  FAQ_GROUPS,
  FAQ_PREVIEW_IDS,
  faqByGroup,
  faqJsonLd,
  faqPreview,
  getFaq,
  serializeJsonLd,
} from "@/lib/content/faq";
import { t } from "@/lib/i18n";
import { CURRENT_RULES, type TaxYearRules } from "@/lib/taxRules";

const text = (items: ReturnType<typeof getFaq>) =>
  items.map((i) => [i.question, ...i.answer, ...(i.links ?? []).map((l) => l.label)].join(" ")).join("\n");

describe("FAQ", () => {
  const items = getFaq();

  it("has at least 14 questions with unique ids", () => {
    expect(items.length).toBeGreaterThanOrEqual(14);
    expect(new Set(items.map((i) => i.id)).size).toBe(items.length);
    for (const item of items) {
      expect(item.question.endsWith("?")).toBe(true);
      expect(item.answer.length).toBeGreaterThan(0);
    }
  });

  it("covers the required topics", () => {
    const ids = items.map((i) => i.id);
    for (const id of [
      "vad-kostar-det", // price
      "bokningsavgift", // no booking fee
      "offert", // how quotes work
      "vem-kommer", // who comes
      "f-skatt-forsakring", // F-skatt/insurance
      "vem-har-ratt", // eligibility
      "personnummer", // personnummer/GDPR
      "angerratt", // ångerrätt
      "inte-nojd", // reklamation
      "betalning", // payment
      "flera-kopare", // several buyers
      "avboka", // cancellations
      "hela-sverige", // coverage
      "boka-per-telefon", // phone help
    ]) {
      expect(ids).toContain(id);
    }
  });

  it("uses the verbatim legal texts", () => {
    const all = text(items);
    expect(all).toContain(t.common.legal.notGuaranteed.body);
    expect(all).toContain(t.common.legal.personnummer.body);
    expect(all).toContain(t.common.legal.labourOnly.body);
  });

  it("derives rates and caps from the rules", () => {
    const rules: TaxYearRules = {
      ...CURRENT_RULES,
      rutRate: 0.45,
      rotRate: 0.25,
      combinedCapPerPerson: 80_000_00,
      rutCapPerPerson: 80_000_00,
      rotCapPerPerson: 40_000_00,
    };
    const all = text(getFaq({ rules }));
    expect(all).toContain("45 %");
    expect(all).toContain("25 %");
    expect(all).toContain("80\u00a0000\u00a0kr");
    expect(all).not.toMatch(/\b50 %|\b30 %|75 000|50 000/);
  });

  it("uses the quote validity it is given", () => {
    const offert = getFaq({ quoteValidHours: 72 }).find((i) => i.id === "offert")!;
    expect(offert.answer.join(" ")).toContain("72 timmar");
  });

  it("previews five existing questions", () => {
    expect(FAQ_PREVIEW_IDS).toHaveLength(5);
    expect(faqPreview().map((i) => i.id)).toEqual([...FAQ_PREVIEW_IDS]);
  });

  it("groups every question into a known group", () => {
    const grouped = faqByGroup(items);
    expect(grouped.map((g) => g.group.id)).toEqual(FAQ_GROUPS.map((g) => g.id));
    expect(grouped.reduce((n, g) => n + g.items.length, 0)).toBe(items.length);
  });

  it("links only to internal pages, tel: or https", () => {
    for (const link of items.flatMap((i) => i.links ?? [])) {
      expect(link.href).toMatch(/^(\/|tel:|https:\/\/)/);
    }
  });
});

describe("FAQ JSON-LD", () => {
  it("builds a FAQPage with one Question per item", () => {
    const items = getFaq();
    const data = faqJsonLd(items);
    expect(data["@type"]).toBe("FAQPage");
    expect(data.mainEntity).toHaveLength(items.length);
    expect(data.mainEntity[0]).toEqual({
      "@type": "Question",
      name: items[0].question,
      acceptedAnswer: { "@type": "Answer", text: items[0].answer.join(" ") },
    });
  });

  it("escapes characters that could break out of the script tag", () => {
    const LS = String.fromCharCode(0x2028);
    const PS = String.fromCharCode(0x2029);
    const input = { a: "</script><script>alert(1)</script>", b: `x${LS}y${PS}z` };
    const out = serializeJsonLd(input);
    expect(out).not.toContain("<");
    expect(out).not.toContain(LS);
    expect(out).not.toContain(PS);
    expect(JSON.parse(out)).toEqual(input);
  });
});
