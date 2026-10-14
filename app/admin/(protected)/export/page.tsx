import { createServerSupabase } from "@/lib/supabase/server";
import { loadExportBookings, toExportBooking } from "@/lib/admin/export";
import { CSV_COLUMNS, buildRows } from "@/lib/admin/csv";
import { Card, InfoBox } from "@/components/ui";
import { PageHeader, selectClasses, tableClasses, tdClasses, thClasses } from "@/components/admin/bits";

export const metadata = { title: "Export" };

const iso = (v: string | string[] | undefined) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);

export default async function ExportPage({ searchParams }: PageProps<"/admin/export">) {
  const sp = await searchParams;
  const range = { from: iso(sp.fran), to: iso(sp.till) };
  const supabase = await createServerSupabase();
  const { rows, overrides } = await loadExportBookings(supabase, range);
  // Preview never shows personnummer – only the masked form.
  const preview = buildRows(
    rows.map((r) => toExportBooking(r, (b) => b.pnr_masked)),
    overrides,
  );
  const q = new URLSearchParams();
  if (range.from) q.set("fran", range.from);
  if (range.to) q.set("till", range.to);
  const csvHref = `/admin/export/csv${q.size ? `?${q}` : ""}`;

  return (
    <>
      <PageHeader title="Export för RUT/ROT-ansökan" />
      <Card className="mb-6">
        <p className="mb-4 max-w-3xl">
          Utförda jobb där TO Städ och Flytt är säljare (vi söker avdraget). Förmedlade ROT-jobb söker partnern själv och
          finns inte med. Filen innehåller personnummer – spara den säkert och radera den när ansökan är gjord.
        </p>
        <form method="get" className="flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="mb-1 block font-bold">Utfört från</span>
            <input type="date" name="fran" defaultValue={range.from ?? ""} className={selectClasses} />
          </label>
          <label className="block">
            <span className="mb-1 block font-bold">till</span>
            <input type="date" name="till" defaultValue={range.to ?? ""} className={selectClasses} />
          </label>
          <button type="submit" className="min-h-12 rounded-control border-2 border-brand bg-surface px-5 font-bold text-brand">
            Visa
          </button>
          <a href={csvHref} className="inline-flex min-h-12 items-center rounded-control border-2 border-brand bg-brand px-5 font-bold text-on-brand no-underline">
            Ladda ner CSV
          </a>
        </form>
      </Card>

      {preview.length === 0 ? (
        <InfoBox tone="info">Inga utförda RUT/ROT-jobb i perioden.</InfoBox>
      ) : (
        <div className="overflow-x-auto rounded-card border border-border bg-surface">
          <table className={tableClasses}>
            <thead>
              <tr>
                {CSV_COLUMNS.map((c) => (
                  <th key={c} scope="col" className={thClasses}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.map((r, i) => (
                <tr key={i}>
                  {r.map((cell, j) => (
                    <td key={j} className={`${tdClasses} whitespace-nowrap`}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
