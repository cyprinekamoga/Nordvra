import Link from "next/link";
import { connection } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatDateShort } from "@/lib/format";
import { LinkButton } from "@/components/ui";
import { Flash, PageHeader, tableClasses, tdClasses, thClasses } from "@/components/admin/bits";

export const metadata = { title: "Utförare" };

export default async function PartnersPage({ searchParams }: PageProps<"/admin/partners">) {
  await connection();
  const sp = await searchParams;
  const supabase = await createServerSupabase();
  const { data: partners } = await supabase.from("partners").select("*").order("name");
  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <PageHeader title="Utförare" actions={<LinkButton href="/admin/partners/ny">Ny utförare</LinkButton>} />
      <Flash params={sp} />
      <div className="overflow-x-auto rounded-card border border-border bg-surface">
        <table className={tableClasses}>
          <thead>
            <tr>
              <th scope="col" className={thClasses}>Namn</th>
              <th scope="col" className={thClasses}>Org.nr</th>
              <th scope="col" className={thClasses}>F-skatt</th>
              <th scope="col" className={thClasses}>Försäkring</th>
              <th scope="col" className={thClasses}>Område</th>
              <th scope="col" className={thClasses}>Betyg</th>
              <th scope="col" className={thClasses}>Avtal</th>
              <th scope="col" className={thClasses}>Aktiv</th>
            </tr>
          </thead>
          <tbody>
            {(partners ?? []).map((p) => {
              const insuranceExpired = p.insurance_valid_to != null && p.insurance_valid_to < today;
              return (
                <tr key={p.id}>
                  <td className={tdClasses}>
                    <Link href={`/admin/partners/${p.id}`} className="link font-bold">
                      {p.name}
                    </Link>
                    {p.is_own_company && <div className="text-sm text-muted">Egen personal</div>}
                  </td>
                  <td className={`${tdClasses} whitespace-nowrap`}>{p.org_nr}</td>
                  <td className={tdClasses}>
                    {p.f_skatt_verified ? (
                      <span className="text-success">Ja, {formatDateShort(p.f_skatt_checked_at)}</span>
                    ) : (
                      <strong className="text-danger">Ej verifierad</strong>
                    )}
                  </td>
                  <td className={tdClasses}>
                    {p.insurance_company ?? "–"}
                    {p.insurance_valid_to && (
                      <div className={insuranceExpired ? "font-bold text-danger" : "text-sm text-muted"}>
                        {insuranceExpired ? "Utgången " : "Till "}
                        {formatDateShort(p.insurance_valid_to)}
                      </div>
                    )}
                  </td>
                  <td className={tdClasses}>
                    {p.regions.length > 0 ? p.regions.join(", ") : "–"}
                    {p.postcode_prefixes.length > 0 && <div className="text-sm text-muted">Postnr: {p.postcode_prefixes.join(", ")}</div>}
                  </td>
                  <td className={tdClasses}>{p.rating ?? "–"}</td>
                  <td className={tdClasses}>{p.subcontractor_agreement_signed ? "Ja" : "Nej"}</td>
                  <td className={tdClasses}>{p.active ? "Ja" : "Nej"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
