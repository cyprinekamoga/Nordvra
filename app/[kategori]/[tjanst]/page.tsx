import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { ServicePageView, serviceTexts } from "@/components/services/ServiceViews";
import { getCatalog } from "@/lib/catalog/load";
import { activeCategories, findPageCategory, findPageService, serviceHref } from "@/lib/services/pages";

type Props = { params: Promise<{ kategori: string; tjanst: string }> };

/** One page per service (/stadning/flyttstadning …), prerendered from the catalogue. */
export async function generateStaticParams() {
  const catalog = await getCatalog();
  const categoryIds = new Set(activeCategories(catalog).map((c) => c.id));
  return catalog.services
    .filter((s) => s.active && categoryIds.has(s.categoryId) && serviceHref(catalog, s) === `/${s.categoryId}/${s.id}`)
    .map((s) => ({ kategori: s.categoryId, tjanst: s.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { kategori, tjanst } = await params;
  const catalog = await getCatalog();
  const service = findPageService(catalog, kategori, tjanst);
  if (!service) return {};
  const texts = serviceTexts(service);
  return {
    title: texts.metaTitle,
    description: texts.metaDescription,
    alternates: { canonical: serviceHref(catalog, service) },
  };
}

/** Unknown services get the 404 page (noindex); a non-canonical URL redirects to the canonical one. */
export default async function ServicePage({ params }: Props) {
  const { kategori, tjanst } = await params;
  const catalog = await getCatalog();
  const category = findPageCategory(catalog, kategori);
  const service = findPageService(catalog, kategori, tjanst);
  if (!category || !service) notFound();
  // The only service of its category lives at the category's URL.
  const canonical = serviceHref(catalog, service);
  if (canonical !== `/${kategori}/${tjanst}`) permanentRedirect(canonical);
  return <ServicePageView catalog={catalog} service={service} category={category} />;
}
