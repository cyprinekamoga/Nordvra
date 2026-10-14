import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { getCatalog } from "@/lib/catalog/load";
import { getSettings } from "@/lib/settings";
import { Card } from "@/components/ui";
import { Flash, PageHeader } from "@/components/admin/bits";
import { PartnerForm } from "@/components/admin/PartnerForm";

export const metadata = { title: "Ny utförare" };

export default async function NewPartnerPage({ searchParams }: PageProps<"/admin/partners/ny">) {
  const sp = await searchParams;
  const supabase = await createServerSupabase();
  const [catalog, settings] = await Promise.all([getCatalog(), getSettings(supabase)]);
  return (
    <>
      <p className="mb-2">
        <Link href="/admin/partners" className="link">
          ← Alla utförare
        </Link>
      </p>
      <PageHeader title="Ny utförare" />
      <Flash params={sp} />
      <Card>
        <PartnerForm partner={null} catalog={catalog} defaultCommission={settings.defaultCommissionPct} />
      </Card>
    </>
  );
}
