import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { categories } from "@/lib/catalog/seed";
import { categoryPhotos, photos } from "@/lib/content/photos";

describe("photos", () => {
  it("every booking category has a photo", () => {
    for (const c of categories) expect(categoryPhotos[c.id], c.id).toBeDefined();
  });

  it("every photo file exists and is stored in 4K", () => {
    for (const [key, p] of Object.entries(photos)) {
      expect(existsSync(join(process.cwd(), "public", p.src)), key).toBe(true);
      expect(Math.max(p.width, p.height), key).toBeGreaterThanOrEqual(3840);
    }
  });
});
