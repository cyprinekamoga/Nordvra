import { describe, expect, it } from "vitest";
import { priceView } from "@/lib/booking/price";
import type { RequestDraft } from "@/lib/booking/schema";
import { deriveRequest, emptyDraft } from "@/lib/booking/state";
import { seedCatalog as catalog } from "@/lib/catalog/seed";

const yesRut = { age18: true, taxSweden: true, rutResidence: true, buyerCount: 1 as const, usedThisYear: "nej" as const };
const yesRot = { age18: true, taxSweden: true, rotOwner: true, rotBuildingOver5: true, buyerCount: 1 as const, usedThisYear: "nej" as const };

function view(draft: Partial<RequestDraft>) {
  const v = priceView(deriveRequest({ ...emptyDraft(), preferredDate: "2026-10-20", ...draft }, catalog));
  if (!v) throw new Error("no price view");
  return v;
}

function allText(v: ReturnType<typeof view>): string {
  return [v.headline, v.quoteText, ...v.lines.flatMap((l) => [l.label, l.value, l.hint])].join(" | ");
}

describe("priceView", () => {
  it("RUT total: 'Vanligtvis … efter RUT-avdrag' with all lines", () => {
    const v = view({
      categoryId: "stadning",
      serviceId: "flyttstadning",
      housingType: "bostadsratt",
      sizeBand: "60-79",
      eligibility: yesRut,
    });
    expect(v.headline).toBe("Vanligtvis 2\u00a0300–3\u00a0600\u00a0kr efter RUT-avdrag");
    expect(v.lines.map((l) => [l.label, l.value])).toEqual([
      ["Arbetskostnad (före avdrag)", "4\u00a0600–7\u00a0200\u00a0kr"],
      ["Material / resor", "Tillkommer vid behov – visas i offerten"],
      ["RUT-avdrag 50 %", "−2\u00a0300–3\u00a0600\u00a0kr"],
      ["Ingen bokningsavgift", "0\u00a0kr"],
      ["Att betala", "2\u00a0300–3\u00a0600\u00a0kr"],
    ]);
    expect(v.lines.find((l) => l.key === "deduction")?.accent).toBe("rut");
  });

  it("recurring cleaning is per visit", () => {
    const v = view({
      categoryId: "stadning",
      serviceId: "hemstadning",
      housingType: "villa",
      sizeBand: "0-39",
      eligibility: yesRut,
    });
    expect(v.headline).toBe("Vanligtvis 600–900\u00a0kr per tillfälle efter RUT-avdrag");
    expect(v.lines.find((l) => l.key === "labour")?.hint).toMatch(/Per städtillfälle/);
  });

  it("ROT hourly rate: 30 % and kr/timme, never 'halva priset'", () => {
    const v = view({ categoryId: "el", serviceId: "eluttag", housingType: "villa", eligibility: yesRot });
    expect(v.kind).toBe("rate");
    expect(v.headline).toBe("Vanligtvis 525–665\u00a0kr/timme efter ROT-avdrag");
    expect(v.lines.find((l) => l.key === "deduction")?.label).toBe("ROT-avdrag 30 %");
    expect(allText(v)).not.toMatch(/halva priset/i);
  });

  it("ROT without a price range: the partner quotes", () => {
    const v = view({ categoryId: "tak-fasad", serviceId: "takbyte", housingType: "villa", eligibility: yesRot });
    expect(v.kind).toBe("quote");
    expect(v.headline).toBeNull();
    expect(v.quoteText).toBe("Pris efter offert från partnerföretag, oftast inom 48 h");
    expect(v.lines.map((l) => l.label)).toEqual(["Ingen bokningsavgift"]);
  });

  it("not eligible: full price and no deduction", () => {
    const v = view({
      categoryId: "el",
      serviceId: "eluttag",
      housingType: "hyresratt",
      eligibility: yesRot,
    });
    expect(v.eligible).toBe(false);
    expect(v.headline).toBe("Vanligtvis 750–950\u00a0kr/timme");
    expect(v.lines.find((l) => l.key === "deduction")?.value).toBe("Inget avdrag");
    expect(v.lines.find((l) => l.key === "toPay")?.value).toBe("750–950\u00a0kr/timme");
  });

  it("never mentions a service or booking fee other than 'Ingen bokningsavgift'", () => {
    const v = view({ categoryId: "tradgard", serviceId: "grasklippning", housingType: "villa", eligibility: yesRut });
    expect(allText(v)).not.toMatch(/serviceavgift/i);
    expect(allText(v)).toContain("Ingen bokningsavgift");
  });

  it("window prices don't repeat the 'per fönster' note; second-hand transport explains its deduction", () => {
    const windows = view({ categoryId: "fonsterputs", serviceId: "fonsterputs", housingType: "villa", eligibility: yesRut });
    expect(windows.lines.find((l) => l.key === "labour")?.hint).toBeUndefined();

    const transport = view({ categoryId: "flytt", serviceId: "secondhand-transport", housingType: "villa", eligibility: yesRut });
    expect(transport.lines.find((l) => l.key === "deduction")?.hint).toBe(
      "Avdraget räknas på 50 % av hela priset, eftersom den delen räknas som arbete.",
    );
  });
});
