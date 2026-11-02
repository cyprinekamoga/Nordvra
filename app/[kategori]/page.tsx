import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryPageView, ServicePageView, categoryTexts, serviceTexts } from "@/components/services/ServiceViews";
import { getCatalog } from "@/lib/catalog/load";
import { activeCategories, categoryHref, findPageCategory, soleService } from "@/lib/services/pages";

type Props = { params: Promise<{ kategori: string }> };

/** One page per category (/stadning …), prerendered from the catalogue. */
export async function generateStaticParams() {
  const catalog = await getCatalog();
  return activeCategories(catalog).map((c) => ({ kategori: c.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { kategori } = await params;
  const catalog = await getCatalog();
  const category = findPageCategory(catalog, kategori);
  if (!category) return {};
  const sole = soleService(catalog, category);
  const texts = sole ? serviceTexts(sole) : categoryTexts(category);
  return {
    title: texts.metaTitle,
    description: texts.metaDescription,
    alternates: { canonical: categoryHref(category) },
  };
}

/**
 * Any unknown first path segment lands here: notFound() then renders the 404 page with
 * <meta name="robots" content="noindex">, so it is never indexed.
 */
export default async function CategoryPage({ params }: Props) {
  const { kategori } = await params;
  const catalog = await getCatalog();
  const category = findPageCategory(catalog, kategori);
  if (!category) notFound();
  // A category with one service of its own (Fönsterputs) shows that service directly.
  const sole = soleService(catalog, category);
  if (sole) return <ServicePageView catalog={catalog} service={sole} category={category} />;
  return <CategoryPageView catalog={catalog} category={category} />;
}
