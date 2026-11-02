import type { MetadataRoute } from "next";
import { getCatalog } from "@/lib/catalog/load";
import { company } from "@/lib/company";
import { activeCategories, categoryHref, serviceHref } from "@/lib/services/pages";
import { siteUrl } from "@/lib/site";

/** Date the content pages were last changed. Update when the copy changes. */
const CONTENT_UPDATED = "2026-10-13";
/** Date the service pages were last changed. */
const SERVICE_PAGES_UPDATED = "2026-11-02";

type Entry = {
  path: string;
  priority: number;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
  lastModified: string;
};

/** Public, indexable routes only (no /admin, /offert or /boka/klart). */
const PUBLIC_ROUTES: readonly Entry[] = [
  { path: "/", priority: 1, changeFrequency: "weekly", lastModified: CONTENT_UPDATED },
  { path: "/boka", priority: 0.9, changeFrequency: "monthly", lastModified: CONTENT_UPDATED },
  { path: "/tjanster", priority: 0.9, changeFrequency: "monthly", lastModified: SERVICE_PAGES_UPDATED },
  { path: "/sa-fungerar-rut-och-rot", priority: 0.8, changeFrequency: "monthly", lastModified: CONTENT_UPDATED },
  { path: "/flyttstadning-checklista", priority: 0.6, changeFrequency: "yearly", lastModified: "2026-10-21" },
  { path: "/vad-ger-inte-avdrag", priority: 0.7, changeFrequency: "monthly", lastModified: CONTENT_UPDATED },
  { path: "/vanliga-fragor", priority: 0.8, changeFrequency: "monthly", lastModified: CONTENT_UPDATED },
  { path: "/om-oss", priority: 0.5, changeFrequency: "yearly", lastModified: CONTENT_UPDATED },
  { path: "/kontakt", priority: 0.6, changeFrequency: "yearly", lastModified: CONTENT_UPDATED },
  { path: "/villkor", priority: 0.3, changeFrequency: "yearly", lastModified: company.termsVersion },
  { path: "/integritetspolicy", priority: 0.3, changeFrequency: "yearly", lastModified: company.termsVersion },
];

/** One page per category and per service, from the catalogue (see lib/services/pages.ts). */
async function serviceRoutes(): Promise<Entry[]> {
  const catalog = await getCatalog();
  const categories = activeCategories(catalog);
  const ids = new Set(categories.map((c) => c.id));
  const paths = new Set([
    ...categories.map(categoryHref),
    ...catalog.services.filter((s) => s.active && ids.has(s.categoryId)).map((s) => serviceHref(catalog, s)),
  ]);
  return [...paths].map((path) => ({
    path,
    priority: path.split("/").length === 2 ? 0.8 : 0.7,
    changeFrequency: "monthly",
    lastModified: SERVICE_PAGES_UPDATED,
  }));
}

/** /sitemap.xml. Absolute URLs from NEXT_PUBLIC_SITE_URL (falls back to localhost in dev). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return [...PUBLIC_ROUTES, ...(await serviceRoutes())].map((route) => ({
    url: siteUrl(route.path),
    lastModified: route.lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
