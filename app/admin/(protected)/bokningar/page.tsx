import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { BOOKING_STATUSES, PAGE_SIZE, filtersToQuery, parseBookingFilters } from "@/lib/admin/filters";
import { formatDateShort, formatPostcode } from "@/lib/format";
import { t } from "@/lib/i18n";
import { LinkButton } from "@/components/ui";
import { Flash, ModelBadge, PageHeader, StatusBadge, selectClasses, tableClasses, tdClasses, thClasses } from "@/components/admin/bits";

export const metadata = { title: "Bokningar" };

export default async function BookingsPage({ searchParams }: PageProps<"/admin/bokningar">) {
  const sp = await searchParams;
  const filters = parseBookingFilters(sp);
  const supabase = await createServerSupabase();

  let query = supabase
    .from("bookings")
    .select(
      "id,booking_number,created_at,service_name,deduction_type,model,preferred_date,postcode,city,contact_name,status,booking_buyers(position,pnr_masked)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range((filters.page - 1) * PAGE_SIZE, filters.page * PAGE_SIZE - 1);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.service) query = query.eq("service_id", filters.service);
  if (filters.from) query = query.gte("preferred_date", filters.from);
  if (filters.to) query = query.lte("preferred_date", filters.to);
  if (filters.postcode) query = query.like("postcode", `${filters.postcode}%`);

  const [{ data: rows, count, error }, { data: services }] = await Promise.all([
    query,
    supabase.from("services").select("id,name").order("name"),
  ]);
  const total = count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <PageHeader title="Bokningar">
        <p className="mt-1 text-muted">{total} träffar</p>
      </PageHeader>
      <Flash params={sp} />

      <form method="get" className="mb-6 grid grid-cols-1 gap-3 rounded-card border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-5">
        <label className="block">
          <span className="mb-1 block font-bold">Status</span>
          <select name="status" defaultValue={filters.status ?? ""} className={selectClasses}>
            <option value="">Alla</option>
            {BOOKING_STATUSES.map((s) => (
              <option key={s} value={s}>
                {t.common.status[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block font-bold">Tjänst</span>
          <select name="tjanst" defaultValue={filters.service ?? ""} className={selectClasses}>
            <option value="">Alla</option>
            {(services ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block font-bold">Önskat datum från</span>
          <input type="date" name="fran" defaultValue={filters.from ?? ""} className={selectClasses} />
        </label>
        <label className="block">
          <span className="mb-1 block font-bold">till</span>
          <input type="date" name="till" defaultValue={filters.to ?? ""} className={selectClasses} />
        </label>
        <label className="block">
          <span className="mb-1 block font-bold">Postnummer börjar på</span>
          <input
            name="postnr"
            inputMode="numeric"
            pattern="[0-9 ]*"
            defaultValue={filters.postcode ?? ""}
            className={selectClasses}
          />
        </label>
        <div className="flex flex-wrap gap-3 sm:col-span-2 lg:col-span-5">
          <button type="submit" className="min-h-12 rounded-control border-2 border-brand bg-brand px-5 font-semibold text-on-brand">
            Filtrera
          </button>
          <LinkButton href="/admin/bokningar" variant="ghost">
            Rensa filter
          </LinkButton>
        </div>
      </form>

      {error && <p role="alert" className="mb-4 text-danger">Kunde inte hämta bokningar.</p>}

      <div className="overflow-x-auto rounded-card border border-border bg-surface">
        <table className={tableClasses}>
          <thead>
            <tr>
              <th scope="col" className={thClasses}>Nummer</th>
              <th scope="col" className={thClasses}>Skapad</th>
              <th scope="col" className={thClasses}>Tjänst</th>
              <th scope="col" className={thClasses}>Önskat datum</th>
              <th scope="col" className={thClasses}>Ort</th>
              <th scope="col" className={thClasses}>Kund</th>
              <th scope="col" className={thClasses}>Personnr</th>
              <th scope="col" className={thClasses}>Status</th>
            </tr>
          </thead>
          <tbody>
            {(rows ?? []).map((b) => {
              const buyer1 = b.booking_buyers?.find((x) => x.position === 1);
              return (
                <tr key={b.id}>
                  <td className={tdClasses}>
                    <Link href={`/admin/bokningar/${b.id}`} className="link font-bold whitespace-nowrap">
                      {b.booking_number}
                    </Link>
                  </td>
                  <td className={`${tdClasses} whitespace-nowrap`}>{formatDateShort(b.created_at)}</td>
                  <td className={tdClasses}>
                    <div>{b.service_name}</div>
                    <ModelBadge model={b.model} deduction={b.deduction_type} />
                  </td>
                  <td className={`${tdClasses} whitespace-nowrap`}>{formatDateShort(b.preferred_date)}</td>
                  <td className={tdClasses}>
                    {formatPostcode(b.postcode)} {b.city}
                  </td>
                  <td className={tdClasses}>{b.contact_name}</td>
                  <td className={`${tdClasses} font-mono whitespace-nowrap`}>{buyer1?.pnr_masked ?? "–"}</td>
                  <td className={tdClasses}>
                    <StatusBadge status={b.status} />
                  </td>
                </tr>
              );
            })}
            {(rows ?? []).length === 0 && (
              <tr>
                <td colSpan={8} className={`${tdClasses} py-8 text-center text-muted`}>
                  Inga bokningar matchar filtret.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <nav aria-label="Sidor" className="mt-4 flex items-center gap-4">
          {filters.page > 1 && (
            <Link className="link min-h-12 inline-flex items-center" href={`/admin/bokningar${filtersToQuery(filters, { page: filters.page - 1 })}`}>
              ← Föregående
            </Link>
          )}
          <span>
            Sida {filters.page} av {pages}
          </span>
          {filters.page < pages && (
            <Link className="link min-h-12 inline-flex items-center" href={`/admin/bokningar${filtersToQuery(filters, { page: filters.page + 1 })}`}>
              Nästa →
            </Link>
          )}
        </nav>
      )}
    </>
  );
}
