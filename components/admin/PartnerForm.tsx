import type { Tables } from "@/lib/supabase/database.types";
import type { Catalog } from "@/lib/catalog/types";
import { SWEDISH_COUNTIES } from "@/lib/admin/partners";
import { savePartnerAction } from "@/lib/admin/config-actions";
import { selectClasses } from "@/components/admin/bits";

type Partner = Tables<"partners">;

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  hint,
  required,
  inputMode,
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  type?: string;
  hint?: string;
  required?: boolean;
  inputMode?: "decimal" | "numeric" | "email" | "tel";
}) {
  return (
    <label className="block">
      <span className="mb-1 block font-bold">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        required={required}
        inputMode={inputMode}
        className={selectClasses}
      />
      {hint && <span className="mt-1 block text-sm text-muted">{hint}</span>}
    </label>
  );
}

function Check({ label, name, defaultChecked }: { label: string; name: string; defaultChecked?: boolean }) {
  return (
    <label className="flex min-h-12 items-center gap-3">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="size-6 accent-brand" />
      <span>{label}</span>
    </label>
  );
}

export function PartnerForm({
  partner,
  catalog,
  defaultCommission,
}: {
  partner: Partner | null;
  catalog: Catalog;
  defaultCommission: number;
}) {
  const p = partner;
  return (
    <form action={savePartnerAction} className="space-y-6">
      {p && <input type="hidden" name="id" value={p.id} />}

      <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <legend className="mb-2 text-lg font-bold">Företag</legend>
        <Field label="Namn" name="name" defaultValue={p?.name} required />
        <Field label="Organisationsnummer" name="org_nr" defaultValue={p?.org_nr} required hint="Format 556036-0793. Skriv TODO tills det är känt." />
        <Field label="Kontaktperson" name="contact_name" defaultValue={p?.contact_name} />
        <Field label="Telefon" name="phone" type="tel" defaultValue={p?.phone} />
        <Field label="E-post" name="email" type="email" defaultValue={p?.email} />
        <Field label="Betyg 1–5" name="rating" inputMode="decimal" defaultValue={p?.rating} />
      </fieldset>

      <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <legend className="mb-2 text-lg font-bold">Kontroller</legend>
        <div className="sm:col-span-2">
          <Check label="F-skatt verifierad" name="f_skatt_verified" defaultChecked={p?.f_skatt_verified} />
          <p className="text-sm text-muted">
            Kontrollera hos{" "}
            <a className="link" href="https://www.skatteverket.se" target="_blank" rel="noopener noreferrer">
              Skatteverket
            </a>
            (e-tjänsten ”Kontrollera om företag har F-skatt”). Utan verifierad F-skatt kan utföraren inte tilldelas jobb.
          </p>
        </div>
        <Field label="F-skatt kontrollerad datum" name="f_skatt_checked_at" type="date" defaultValue={p?.f_skatt_checked_at} />
        <div>
          <Check label="Registrerad som arbetsgivare" name="employer_registered" defaultChecked={p?.employer_registered} />
          <Check label="Underleverantörsavtal signerat" name="subcontractor_agreement_signed" defaultChecked={p?.subcontractor_agreement_signed} />
        </div>
        <Field label="Försäkringsbolag" name="insurance_company" defaultValue={p?.insurance_company} />
        <Field label="Försäkring giltig till" name="insurance_valid_to" type="date" defaultValue={p?.insurance_valid_to} />
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-lg font-bold">Tjänster</legend>
        <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
          {catalog.categories.map((c) => (
            <div key={c.id} className="mb-3">
              <p className="font-bold">{c.name}</p>
              {catalog.services
                .filter((s) => s.categoryId === c.id)
                .map((s) => (
                  <label key={s.id} className="flex min-h-10 items-center gap-2">
                    <input
                      type="checkbox"
                      name="service_ids"
                      value={s.id}
                      defaultChecked={p?.service_ids.includes(s.id)}
                      className="size-5 accent-brand"
                    />
                    <span>{s.name}</span>
                  </label>
                ))}
            </div>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-lg font-bold">Område</legend>
        <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
          {SWEDISH_COUNTIES.map((county) => (
            <label key={county} className="flex min-h-10 items-center gap-2">
              <input type="checkbox" name="regions" value={county} defaultChecked={p?.regions.includes(county)} className="size-5 accent-brand" />
              <span>{county}</span>
            </label>
          ))}
        </div>
        <div className="mt-3 max-w-md">
          <Field
            label="Postnummer (början), kommaseparerat"
            name="postcode_prefixes"
            defaultValue={p?.postcode_prefixes.join(", ")}
            hint="T.ex. 63, 64. Tomt = hela Sverige. Används för att föreslå utförare."
          />
        </div>
      </fieldset>

      <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <legend className="mb-2 text-lg font-bold">Ekonomi och anteckningar</legend>
        <Field
          label="Provision på arbetskostnad (ROT), %"
          name="commission_pct"
          inputMode="decimal"
          defaultValue={p?.commission_pct ?? defaultCommission}
          hint="Visas aldrig för kunden."
        />
        <div />
        <label className="block sm:col-span-2">
          <span className="mb-1 block font-bold">Interna prisanteckningar</span>
          <textarea name="internal_price_notes" rows={3} defaultValue={p?.internal_price_notes ?? ""} className={selectClasses} />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block font-bold">Övriga anteckningar</span>
          <textarea name="notes" rows={3} defaultValue={p?.notes ?? ""} className={selectClasses} />
        </label>
        <Check label="Aktiv" name="active" defaultChecked={p ? p.active : true} />
      </fieldset>

      <button type="submit" className="min-h-12 rounded-control border-2 border-brand bg-brand px-6 font-semibold text-on-brand">
        Spara utförare
      </button>
    </form>
  );
}
