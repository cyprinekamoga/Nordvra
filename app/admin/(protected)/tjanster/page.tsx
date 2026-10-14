import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { toggleServiceAction } from "@/lib/admin/config-actions";
import { Flash, ModelBadge, PageHeader, tableClasses, tdClasses, thClasses } from "@/components/admin/bits";

export const metadata = { title: "Tjänster & priser" };

export default async function ServicesPage({ searchParams }: PageProps<"/admin/tjanster">) {
  const sp = await searchParams;
  const supabase = await createServerSupabase();
  const [{ data: categories }, { data: services }, { data: ranges }] = await Promise.all([
    supabase.from("categories").select("*").order("sort"),
    supabase.from("services").select("*").order("sort"),
    supabase.from("price_ranges").select("service_id"),
  ]);
  const rangeCount = new Map<string, number>();
  for (const r of ranges ?? []) rangeCount.set(r.service_id, (rangeCount.get(r.service_id) ?? 0) + 1);

  return (
    <>
      <PageHeader title="Tjänster & priser">
        <p className="mt-1 max-w-2xl text-muted">
          Prisintervallen visas för kunden som ”vanligtvis …”. Ändringar syns på bokningssidan inom någon minut.
        </p>
      </PageHeader>
      <Flash params={sp} />
      {(categories ?? []).map((c) => (
        <section key={c.id} aria-labelledby={`cat-${c.id}`} className="mb-8">
          <h2 id={`cat-${c.id}`} className="mb-2 text-xl font-bold">
            {c.name}
          </h2>
          <div className="overflow-x-auto rounded-card border border-border bg-surface">
            <table className={tableClasses}>
              <thead>
                <tr>
                  <th scope="col" className={thClasses}>Tjänst</th>
                  <th scope="col" className={thClasses}>Typ</th>
                  <th scope="col" className={thClasses}>Prisrader</th>
                  <th scope="col" className={thClasses}>Visas för kunder</th>
                </tr>
              </thead>
              <tbody>
                {(services ?? [])
                  .filter((s) => s.category_id === c.id)
                  .map((s) => (
                    <tr key={s.id}>
                      <td className={tdClasses}>
                        <Link href={`/admin/tjanster/${s.id}`} className="link font-bold">
                          {s.name}
                        </Link>
                      </td>
                      <td className={tdClasses}>
                        <ModelBadge model={s.model} deduction={s.deduction_type} />
                      </td>
                      <td className={tdClasses}>{(rangeCount.get(s.id) ?? 0) || "Offert"}</td>
                      <td className={tdClasses}>
                        <form action={toggleServiceAction} className="flex items-center gap-3">
                          <input type="hidden" name="id" value={s.id} />
                          <input type="hidden" name="active" value={s.active ? "false" : "true"} />
                          <span>{s.active ? "Ja" : "Nej"}</span>
                          <button type="submit" className="link min-h-12">
                            {s.active ? "Dölj" : "Visa"}
                            <span className="sr-only"> {s.name}</span>
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </>
  );
}
