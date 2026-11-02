import { describe, expect, it } from "vitest";
import { seedCatalog } from "@/lib/catalog/seed";
import {
  activeCategories,
  bookHref,
  findPageCategory,
  findPageService,
  serviceHref,
  servicePrice,
  soleService,
} from "@/lib/services/pages";

const service = (id: string) => seedCatalog.services.find((s) => s.id === id)!;

describe("service page URLs", () => {
  it("puts a service under its main category", () => {
    expect(serviceHref(seedCatalog, service("flyttstadning"))).toBe("/stadning/flyttstadning");
    expect(serviceHref(seedCatalog, service("malning-inomhus"))).toBe("/maleri/malning-inomhus");
  });

  it("gives the only service of a category the category's URL", () => {
    const category = findPageCategory(seedCatalog, "fonsterputs")!;
    expect(soleService(seedCatalog, category)?.id).toBe("fonsterputs");
    expect(serviceHref(seedCatalog, service("fonsterputs"))).toBe("/fonsterputs");
  });

  it("finds a service only under its main category", () => {
    expect(findPageService(seedCatalog, "stadning", "flyttstadning")?.id).toBe("flyttstadning");
    expect(findPageService(seedCatalog, "flytt", "flyttstadning")).toBeNull();
    expect(findPageService(seedCatalog, "stadning", "finns-inte")).toBeNull();
    expect(findPageCategory(seedCatalog, "wp-admin")).toBeNull();
  });

  it("gives every active service a unique URL", () => {
    const ids = new Set(activeCategories(seedCatalog).map((c) => c.id));
    const urls = seedCatalog.services.filter((s) => s.active && ids.has(s.categoryId)).map((s) => serviceHref(seedCatalog, s));
    expect(new Set(urls).size).toBe(urls.length);
  });

  it("opens the booking flow on the service", () => {
    expect(bookHref(service("flyttstadning"))).toBe("/boka?tjanst=flyttstadning");
  });
});

describe("servicePrice", () => {
  it("lists a price per size of home, after the deduction", () => {
    const price = servicePrice(seedCatalog, service("flyttstadning"));
    expect(price.kind).toBe("total");
    if (price.kind !== "total") return;
    expect(price.rows).toHaveLength(7);
    // RUT halves the labour cost: the smallest home, 3 400–4 200 kr before, 1 700–2 100 kr after.
    expect(price.rows[0].before).toEqual([340000, 420000]);
    expect(price.rows[0].after).toEqual([170000, 210000]);
    expect(price.after[0]).toBe(170000);
  });

  it("shows hourly and per-window services as a rate", () => {
    const hourly = servicePrice(seedCatalog, service("varmepump"));
    expect(hourly).toMatchObject({ kind: "rate", unit: "hour" });
    const windows = servicePrice(seedCatalog, service("fonsterputs"));
    expect(windows).toMatchObject({ kind: "rate", unit: "window" });
  });
});
