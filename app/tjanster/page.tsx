import type { Metadata } from "next";
import { ServicesOverview } from "@/components/services/ServiceViews";
import { getCatalog } from "@/lib/catalog/load";
import { t } from "@/lib/i18n";

const o = t.content.servicePages.overview;

export const metadata: Metadata = {
  title: o.metaTitle,
  description: o.metaDescription,
  alternates: { canonical: "/tjanster" },
};

/** Every category with its services, each linking to its own page. */
export default async function ServicesPage() {
  const catalog = await getCatalog();
  return <ServicesOverview catalog={catalog} />;
}
