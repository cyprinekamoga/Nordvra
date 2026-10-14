import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { getCatalog } from "@/lib/catalog/load";
import { getSettings } from "@/lib/settings";
import { Card } from "@/components/ui";
import { Flash, PageHeader } from "@/components/admin/bits";
import { PartnerForm } from "@/components/admin/PartnerForm";

export const metadata = { title: "Utförare" };

export default async function EditPartnerPage({ params, searchParams }: PageProps<"/admin/partners/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const supabase = await createServerSupabase();
  const [{ data: partner }, catalog, settings] = await Promise.all([
    supabase.from("partners").select("*").eq("id", id).maybeSingle(),
    getCatalog(),
    getSettings(supabase),
  ]);
  if (!partner) notFound();
  return (
    <>
      <p className="mb-2">
        <Link href="/admin/partners" className="link">
          ← Alla utförare
        </Link>
      </p>
      <PageHeader title={partner.name} />
      <Flash params={sp} />
      <Card>
        <PartnerForm partner={partner} catalog={catalog} defaultCommission={settings.defaultCommissionPct} />
      </Card>
    </>
  );
}
