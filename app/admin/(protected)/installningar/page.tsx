import { connection } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";
import { TAX_RULES, getTaxRules, knownTaxYears, type TaxRuleOverride } from "@/lib/taxRules";
import { formatDateShort, formatKr } from "@/lib/format";
import { Card, InfoBox } from "@/components/ui";
import { Flash, PageHeader, selectClasses } from "@/components/admin/bits";
import { addAdminAction, removeAdminAction, saveSettingsAction, saveTaxOverrideAction } from "@/lib/admin/config-actions";
import { requireAdmin } from "@/lib/auth/admin";

export const metadata = { title: "Inställningar" };

function NumField({ label, name, value, hint }: { label: string; name: string; value: number | string; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block font-bold">{label}</span>
      <input name={name} defaultValue={String(value)} inputMode="decimal" required className={selectClasses} />
      {hint && <span className="mt-1 block text-sm text-muted">{hint}</span>}
    </label>
  );
}

export default async function SettingsPage({ searchParams }: PageProps<"/admin/installningar">) {
  await connection();
  const sp = await searchParams;
  const admin = await requireAdmin();
  const supabase = await createServerSupabase();
  const [settings, { data: overrides }, { data: admins }] = await Promise.all([
    getSettings(supabase),
    supabase.from("tax_rule_overrides").select("*").order("year"),
    supabase.from("admin_users").select("*").order("email"),
  ]);
  const thisYear = new Date().getFullYear();
  const years = [...new Set([...knownTaxYears(), thisYear, thisYear + 1, ...(overrides ?? []).map((o) => o.year)])].sort();

  return (
    <>
      <PageHeader title="Inställningar" />
      <Flash params={sp} />

      <Card as="section" aria-labelledby="allmant" className="mb-6">
        <h2 id="allmant" className="mb-3 text-xl font-bold">Allmänt</h2>
        <form action={saveSettingsAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <NumField label="Offertlänk giltig, timmar" name="quote_valid_hours" value={settings.quoteValidHours} />
          <label className="block">
            <span className="mb-1 block font-bold">E-post för notiser</span>
            <input name="notification_email" type="email" defaultValue={settings.notificationEmail} required className={selectClasses} />
          </label>
          <NumField
            label="Spara personnummer, år efter beslut från Skatteverket"
            name="pnr_retention_years"
            value={settings.pnrRetentionYears}
            hint="TODO: bekräfta med revisor (bokföringslagen, normalt 7 år)."
          />
          <NumField
            label="Spara personnummer, dagar för jobb utan eget avdrag"
            name="pnr_unused_retention_days"
            value={settings.pnrUnusedRetentionDays}
            hint="Avbokade, nekade och förmedlade (ROT) jobb."
          />
          <NumField label="Standardprovision ROT-partner, %" name="default_commission_pct" value={settings.defaultCommissionPct} />
          <div />
          <NumField label="Tillägg för husdjur, %" name="pets_surcharge_pct" value={settings.petsSurchargePct} hint="Påverkar prisintervallet för städning." />
          <NumField label="Tillägg per extra våningsplan, %" name="extra_floor_surcharge_pct" value={settings.extraFloorSurchargePct} />
          <div className="sm:col-span-2">
            <button type="submit" className="min-h-12 rounded-control border-2 border-brand bg-brand px-6 font-semibold text-on-brand">
              Spara inställningar
            </button>
          </div>
        </form>
      </Card>

      <Card as="section" aria-labelledby="skatt" className="mb-6">
        <h2 id="skatt" className="mb-1 text-xl font-bold">Skatteregler för RUT och ROT</h2>
        <p className="mb-4 max-w-3xl text-muted">
          Grundvärdena finns i <code>lib/taxRules.ts</code> och uppdateras i koden varje år. Här kan du tillfälligt ändra ett år
          utan att vänta på en ny version. Lämna fält tomma för att använda värdet från koden. Budgetpropositionen för nästa år
          läggs normalt fram i september–november.
        </p>
        <div className="space-y-6">
          {years.map((year) => {
            const o = (overrides ?? []).find((x) => x.year === year);
            const override: TaxRuleOverride[] = o
              ? [
                  {
                    year,
                    ...(o.rut_rate != null && { rutRate: Number(o.rut_rate) }),
                    ...(o.rot_rate != null && { rotRate: Number(o.rot_rate) }),
                    ...(o.rut_cap_ore != null && { rutCapPerPerson: o.rut_cap_ore }),
                    ...(o.rot_cap_ore != null && { rotCapPerPerson: o.rot_cap_ore }),
                    ...(o.combined_cap_ore != null && { combinedCapPerPerson: o.combined_cap_ore }),
                  },
                ]
              : [];
            const effective = getTaxRules(year, override);
            const file = TAX_RULES[year];
            return (
              <div key={year} className="rounded-card border border-border p-4">
                <h3 className="mb-2 text-lg font-bold">{year}</h3>
                <p className="mb-2">
                  Gäller: RUT {Math.round(effective.rutRate * 100)} %, ROT {Math.round(effective.rotRate * 100)} %, tak RUT{" "}
                  {formatKr(effective.rutCapPerPerson)}, ROT {formatKr(effective.rotCapPerPerson)}, totalt{" "}
                  {formatKr(effective.combinedCapPerPerson)} per person.
                </p>
                {!file && (
                  <InfoBox tone="warning">
                    Det finns inga regler för {year} i koden ännu – värdena från närmaste tidigare år används. Uppdatera{" "}
                    <code>lib/taxRules.ts</code> när beslutet är klart.
                  </InfoBox>
                )}
                {effective.isOverridden && (
                  <InfoBox tone="warning">
                    Avviker från koden. Senast ändrat {o?.updated_at ? formatDateShort(o.updated_at) : ""} av {o?.updated_by}.
                  </InfoBox>
                )}
                <form action={saveTaxOverrideAction} className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                  <input type="hidden" name="year" value={year} />
                  {(
                    [
                      ["rut_rate", "RUT %", o?.rut_rate != null ? Number(o.rut_rate) * 100 : ""],
                      ["rot_rate", "ROT %", o?.rot_rate != null ? Number(o.rot_rate) * 100 : ""],
                      ["rut_cap", "Tak RUT kr", o?.rut_cap_ore != null ? o.rut_cap_ore / 100 : ""],
                      ["rot_cap", "Tak ROT kr", o?.rot_cap_ore != null ? o.rot_cap_ore / 100 : ""],
                      ["combined_cap", "Tak totalt kr", o?.combined_cap_ore != null ? o.combined_cap_ore / 100 : ""],
                    ] as const
                  ).map(([name, label, value]) => (
                    <label key={name} className="block">
                      <span className="mb-1 block text-sm font-bold">{label}</span>
                      <input name={name} defaultValue={String(value)} inputMode="decimal" className={selectClasses} placeholder="Från koden" />
                    </label>
                  ))}
                  <div className="flex items-end">
                    <button type="submit" className="min-h-12 rounded-control border-2 border-brand bg-surface px-4 font-semibold text-brand">
                      Spara {year}
                    </button>
                  </div>
                </form>
              </div>
            );
          })}
        </div>
      </Card>

      <Card as="section" aria-labelledby="admins">
        <h2 id="admins" className="mb-3 text-xl font-bold">Administratörer</h2>
        <ul className="mb-4 space-y-2">
          {(admins ?? []).map((a) => (
            <li key={a.email} className="flex flex-wrap items-center gap-3">
              <span className="font-bold">{a.email}</span>
              {a.email === admin.email.toLowerCase() ? (
                <span className="text-sm text-muted">(du)</span>
              ) : (
                <form action={removeAdminAction}>
                  <input type="hidden" name="email" value={a.email} />
                  <button type="submit" className="link min-h-12 text-danger">
                    Ta bort<span className="sr-only"> {a.email}</span>
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
        <form action={addAdminAction} className="flex flex-wrap items-end gap-3">
          <label className="block grow">
            <span className="mb-1 block font-bold">Lägg till administratör (e-post)</span>
            <input name="email" type="email" required className={selectClasses} />
          </label>
          <button type="submit" className="min-h-12 rounded-control border-2 border-brand bg-brand px-5 font-semibold text-on-brand">
            Lägg till
          </button>
        </form>
        <p className="mt-2 text-sm text-muted">Personen skapar sedan ett konto via ”Skapa konto första gången” på inloggningssidan.</p>
      </Card>
    </>
  );
}
