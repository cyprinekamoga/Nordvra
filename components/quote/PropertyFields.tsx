"use client";

import { TextField } from "@/components/ui";
import { t } from "@/lib/i18n";
import { FIELD, fieldId, type ApprovalInput } from "@/lib/quote/form";
import type { PropertyKind } from "@/lib/quote/quote";

const f = t.quote.form.property;

export type PropertyField = keyof ApprovalInput["property"];

/**
 * ROT property details Skatteverket needs: house (villa/fritidshus) → fastighetsbeteckning;
 * bostadsrätt → the association's organisationsnummer + lägenhetsnummer.
 */
export function PropertyFields({
  kind,
  value,
  errors,
  onChange,
  onBlur,
}: {
  kind: PropertyKind;
  value: ApprovalInput["property"];
  errors: Partial<Record<PropertyField, string>>;
  onChange: (field: PropertyField, value: string) => void;
  onBlur: (field: PropertyField) => void;
}) {
  return (
    <section aria-labelledby="offert-bostad-rubrik" className="space-y-4">
      <div className="space-y-1">
        <h3 id="offert-bostad-rubrik" className="text-xl font-bold text-ink">
          {f.title}
        </h3>
        <p className="text-muted">{f.hint}</p>
      </div>
      {kind === "fastighet" ? (
        <TextField
          id={fieldId(FIELD.fastighetsbeteckning)}
          name={FIELD.fastighetsbeteckning}
          label={f.fastighetsbeteckning}
          hint={f.fastighetsbeteckningHint}
          value={value.fastighetsbeteckning}
          onChange={(event) => onChange("fastighetsbeteckning", event.currentTarget.value)}
          onBlur={() => onBlur("fastighetsbeteckning")}
          error={errors.fastighetsbeteckning}
          autoComplete="off"
          maxLength={120}
          required
        />
      ) : (
        <>
          <TextField
            id={fieldId(FIELD.brfOrgNr)}
            name={FIELD.brfOrgNr}
            label={f.brfOrgNr}
            hint={f.brfOrgNrHint}
            value={value.brfOrgNr}
            onChange={(event) => onChange("brfOrgNr", event.currentTarget.value)}
            onBlur={() => onBlur("brfOrgNr")}
            error={errors.brfOrgNr}
            inputMode="text"
            autoComplete="off"
            spellCheck={false}
            maxLength={13}
            inputClassName="max-w-72 tabular-nums"
            required
          />
          <TextField
            id={fieldId(FIELD.lagenhetsnummer)}
            name={FIELD.lagenhetsnummer}
            label={f.lagenhetsnummer}
            hint={f.lagenhetsnummerHint}
            value={value.lagenhetsnummer}
            onChange={(event) => onChange("lagenhetsnummer", event.currentTarget.value)}
            onBlur={() => onBlur("lagenhetsnummer")}
            error={errors.lagenhetsnummer}
            autoComplete="off"
            spellCheck={false}
            maxLength={10}
            inputClassName="max-w-48"
            required
          />
        </>
      )}
    </section>
  );
}
