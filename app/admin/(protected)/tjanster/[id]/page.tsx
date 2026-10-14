import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { calculateRange, roundRange } from "@/lib/pricing/calculate";
import { CURRENT_RULES } from "@/lib/taxRules";
import { formatKrRange } from "@/lib/format";
import { t } from "@/lib/i18n";
import { notDeductible } from "@/lib/content/notDeductible";
import { Constants } from "@/lib/supabase/database.types";
import { Card } from "@/components/ui";
import { Flash, PageHeader, selectClasses, tableClasses, tdClasses, thClasses } from "@/components/admin/bits";
import { deleteRangeAction, saveAddonAction, saveRangeAction, saveServiceAction } from "@/lib/admin/config-actions";

export const metadata = { title: "Tjänst" };

const kr = (ore: number) => String(Math.round(ore / 100));
const small = "min-h-12 w-24 rounded-control border-2 border-control bg-surface px-2 text-base";

export default async function ServicePage({ params, searchParams }: PageProps<"/admin/tjanster/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  if (!/^[a-z0-9-]+$/.test(id)) notFound();
  const supabase = await createServerSupabase();
  const [{ data: s }, { data: ranges }, { data: addons }] = await Promise.all([
    supabase.from("services").select("*").eq("id", id).maybeSingle(),
    supabase.from("price_ranges").select("*").eq("service_id", id).order("id"),
    supabase.from("service_addons").select("*").eq("service_id", id).order("sort"),
  ]);
  if (!s) notFound();

  const after = (r: NonNullable<typeof ranges>[number]) => {
    const range = calculateRange({
      deductionType: s.deduction_type,
      rules: CURRENT_RULES,
      eligible: true,
      labourShareOfTotal: s.labour_share_of_total == null ? null : Number(s.labour_share_of_total),
      min: { labour: r.labour_min_ore, material: r.material_min_ore, travel: r.travel_min_ore },
      max: { labour: r.labour_max_ore, material: r.material_max_ore, travel: r.travel_max_ore },
    });
    const step = s.pricing_unit === "hour" || s.pricing_unit === "m2" || s.pricing_unit === "window" ? 5 : 100;
    return formatKrRange(roundRange(range.after, step));
  };
  const unitText = { job: "per jobb", visit: "per tillfälle", hour: "per timme", window: "per fönster", m2: "per m²" }[s.pricing_unit];
  const warnings = notDeductible.filter((w) => w.type === s.deduction_type);

  return (
    <>
      <p className="mb-2">
        <Link href="/admin/tjanster" className="link">
          ← Alla tjänster
        </Link>
      </p>
      <PageHeader title={s.name}>
        <p className="mt-1 text-muted">
          {s.deduction_type.toUpperCase()} · {s.model === "seller" ? "Säljare (vi fakturerar)" : "Förmedlare (partnern fakturerar)"} · Arbetstyp hos Skatteverket: {s.skv_work_type}
        </p>
      </PageHeader>
      <Flash params={sp} />

      <Card as="section" aria-labelledby="grund" className="mb-6">
        <h2 id="grund" className="mb-3 text-xl font-bold">Grunduppgifter</h2>
        <form action={saveServiceAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <input type="hidden" name="id" value={s.id} />
          <label className="block">
            <span className="mb-1 block font-bold">Namn</span>
            <input name="name" defaultValue={s.name} required className={selectClasses} />
          </label>
          <label className="block">
            <span className="mb-1 block font-bold">Affärsmodell</span>
            <select name="model" defaultValue={s.model} className={selectClasses}>
              <option value="seller">Säljare – TO Städ och Flytt fakturerar och söker avdraget</option>
              <option value="agent">Förmedlare – partnern fakturerar och söker avdraget</option>
            </select>
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block font-bold">Beskrivning (visas för kunden)</span>
            <textarea name="description" rows={2} defaultValue={s.description} className={selectClasses} />
          </label>
          {s.deduction_type === "rot" && (
            <label className="block">
              <span className="mb-1 block font-bold">Typ av ROT-arbete</span>
              <select name="rot_kind" defaultValue={s.rot_kind ?? "repair"} className={selectClasses}>
                <option value="repair">Reparation/underhåll (oavsett husets ålder)</option>
                <option value="rebuild">Om-/tillbyggnad (huset måste vara minst 5 år)</option>
              </select>
            </label>
          )}
          <label className="block sm:col-span-2">
            <span className="mb-1 block font-bold">Varningar (id, kommaseparerade)</span>
            <input name="warning_ids" defaultValue={s.warning_ids.join(", ")} className={selectClasses} />
            <span className="mt-1 block text-sm text-muted">Möjliga: {warnings.map((w) => w.id).join(", ")}</span>
          </label>
          <label className="flex min-h-12 items-center gap-3">
            <input type="checkbox" name="active" defaultChecked={s.active} className="size-6 accent-brand" />
            <span>Visas för kunder</span>
          </label>
          <div className="sm:col-span-2">
            <button type="submit" className="min-h-12 rounded-control border-2 border-brand bg-brand px-6 font-bold text-on-brand">
              Spara tjänst
            </button>
          </div>
        </form>
      </Card>

      <Card as="section" aria-labelledby="priser" className="mb-6">
        <h2 id="priser" className="mb-1 text-xl font-bold">Prisintervall ({unitText})</h2>
        <p className="mb-4 text-muted">
          Ange kronor inkl. moms <strong>före</strong> avdrag. Kolumnen ”Kunden ser” visar vad kunden betalar efter{" "}
          {s.deduction_type.toUpperCase()}-avdrag. Utan prisrad visas ”Pris efter offert”.
        </p>
        <div className="overflow-x-auto">
          <table className={tableClasses}>
            <thead>
              <tr>
                <th scope="col" className={thClasses}>Storlek</th>
                <th scope="col" className={thClasses}>Arbete min–max</th>
                <th scope="col" className={thClasses}>Material min–max</th>
                <th scope="col" className={thClasses}>Resor min–max</th>
                <th scope="col" className={thClasses}>Notering</th>
                <th scope="col" className={thClasses}>Kunden ser</th>
                <th scope="col" className={thClasses}><span className="sr-only">Åtgärder</span></th>
              </tr>
            </thead>
            <tbody>
              {(ranges ?? []).map((r) => {
                const formId = `range-${r.id}`;
                return (
                  <tr key={r.id}>
                    <td className={tdClasses}>
                      <form id={formId} action={saveRangeAction}>
                        <input type="hidden" name="service_id" value={s.id} />
                        <input type="hidden" name="range_id" value={r.id} />
                        <input type="hidden" name="size_band" value={r.size_band ?? ""} />
                      </form>
                      {r.size_band ? t.common.sizeBands[r.size_band] : "Alla storlekar"}
                    </td>
                    {(["labour", "material", "travel"] as const).map((k) => (
                      <td key={k} className={`${tdClasses} whitespace-nowrap`}>
                        <input form={formId} name={`${k}_min`} defaultValue={kr(r[`${k}_min_ore`])} inputMode="decimal" aria-label={`${k} min`} className={small} />{" "}
                        –{" "}
                        <input form={formId} name={`${k}_max`} defaultValue={kr(r[`${k}_max_ore`])} inputMode="decimal" aria-label={`${k} max`} className={small} />
                      </td>
                    ))}
                    <td className={tdClasses}>
                      <input form={formId} name="note" defaultValue={r.note ?? ""} aria-label="Notering" className={`${small} w-56`} />
                    </td>
                    <td className={`${tdClasses} font-bold whitespace-nowrap`}>{after(r)}</td>
                    <td className={`${tdClasses} whitespace-nowrap`}>
                      <button form={formId} type="submit" className="link min-h-12 mr-3">
                        Spara
                      </button>
                      <form action={deleteRangeAction} className="inline">
                        <input type="hidden" name="service_id" value={s.id} />
                        <input type="hidden" name="range_id" value={r.id} />
                        <button type="submit" className="link min-h-12 text-danger">
                          Ta bort
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <form action={saveRangeAction} className="mt-6 grid grid-cols-1 gap-3 rounded-card border border-border p-4 sm:grid-cols-4">
          <h3 className="font-bold sm:col-span-4">Lägg till prisrad</h3>
          <input type="hidden" name="service_id" value={s.id} />
          <label className="block">
            <span className="mb-1 block font-bold">Storlek</span>
            <select name="size_band" className={selectClasses}>
              <option value="">Alla storlekar</option>
              {Constants.public.Enums.size_band.map((b) => (
                <option key={b} value={b}>
                  {t.common.sizeBands[b]}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block font-bold">Arbete min, kr</span>
            <input name="labour_min" inputMode="decimal" required className={selectClasses} />
          </label>
          <label className="block">
            <span className="mb-1 block font-bold">Arbete max, kr</span>
            <input name="labour_max" inputMode="decimal" required className={selectClasses} />
          </label>
          <label className="block">
            <span className="mb-1 block font-bold">Notering</span>
            <input name="note" className={selectClasses} />
          </label>
          <div className="sm:col-span-4">
            <button type="submit" className="min-h-12 rounded-control border-2 border-brand bg-surface px-5 font-bold text-brand">
              Lägg till
            </button>
          </div>
        </form>
      </Card>

      {(addons ?? []).length > 0 && (
        <Card as="section" aria-labelledby="tillval">
          <h2 id="tillval" className="mb-3 text-xl font-bold">Tillval</h2>
          <ul className="space-y-3">
            {(addons ?? []).map((a) => (
              <li key={a.id}>
                <form action={saveAddonAction} className="flex flex-wrap items-end gap-3">
                  <input type="hidden" name="service_id" value={s.id} />
                  <input type="hidden" name="id" value={a.id} />
                  <label className="block">
                    <span className="mb-1 block font-bold">Namn</span>
                    <input name="label" defaultValue={a.label} className={selectClasses} />
                  </label>
                  <label className="block">
                    <span className="mb-1 block font-bold">Arbete min, kr{a.per_window ? " per fönster" : ""}</span>
                    <input name="labour_min" defaultValue={kr(a.labour_min_ore)} inputMode="decimal" className={small} />
                  </label>
                  <label className="block">
                    <span className="mb-1 block font-bold">max, kr</span>
                    <input name="labour_max" defaultValue={kr(a.labour_max_ore)} inputMode="decimal" className={small} />
                  </label>
                  <label className="flex min-h-12 items-center gap-2">
                    <input type="checkbox" name="included" defaultChecked={a.included} className="size-6 accent-brand" />
                    <span>Ingår i grundpriset</span>
                  </label>
                  <button type="submit" className="link min-h-12">
                    Spara
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
