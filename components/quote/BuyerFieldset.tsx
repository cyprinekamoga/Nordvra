"use client";

import { Button, InfoBox, TextField } from "@/components/ui";
import { fmt, t } from "@/lib/i18n";
import { FIELD, fieldId, type BuyerInput } from "@/lib/quote/form";

const f = t.quote.form;

export type BuyerField = keyof BuyerInput;

export interface BuyerFieldsetProps {
  index: number;
  buyer: BuyerInput;
  /** Show the share field (only with two or more buyers; one buyer always pays 100 %). */
  showShare: boolean;
  canRemove: boolean;
  errors: Partial<Record<BuyerField, string>>;
  /** "Personen fyller inte 18 år i år …" when it applies, else null. */
  under18Warning: string | null;
  onChange: (index: number, field: BuyerField, value: string) => void;
  onBlur: (index: number, field: BuyerField) => void;
  onRemove: (index: number) => void;
}

/**
 * One buyer: full name, personnummer and (with several buyers) share in percent.
 * The personnummer field is a plain text field (the number contains a dash), with autocomplete
 * off; its value lives only in React state – never in storage, the URL or logs.
 */
export function BuyerFieldset({
  index,
  buyer,
  showShare,
  canRemove,
  errors,
  under18Warning,
  onChange,
  onBlur,
  onRemove,
}: BuyerFieldsetProps) {
  const n = index + 1;
  const nameField = FIELD.buyerName(index);
  const pnrField = FIELD.buyerPnr(index);
  const shareField = FIELD.buyerShare(index);
  return (
    <fieldset className="min-w-0 rounded-card border border-border bg-surface p-4 shadow-card sm:p-6">
      <legend className="float-left mb-4 w-full text-lg font-bold text-ink">{fmt(f.buyerLegend, { n })}</legend>
      <div className="clear-both space-y-5">
        <TextField
          id={fieldId(nameField)}
          name={nameField}
          label={f.name}
          value={buyer.name}
          onChange={(event) => onChange(index, "name", event.currentTarget.value)}
          onBlur={() => onBlur(index, "name")}
          error={errors.name}
          autoComplete={index === 0 ? "name" : "off"}
          autoCapitalize="words"
          maxLength={100}
          required
        />
        <TextField
          id={fieldId(pnrField)}
          name={pnrField}
          label={f.pnr}
          hint={f.pnrHint}
          value={buyer.pnr}
          onChange={(event) => onChange(index, "pnr", event.currentTarget.value)}
          onBlur={() => onBlur(index, "pnr")}
          error={errors.pnr}
          inputMode="text"
          pattern="[0-9]{6,8}[\-+]?[0-9]{4}"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          maxLength={15}
          inputClassName="max-w-72 tabular-nums tracking-wide"
          required
        />
        {under18Warning ? (
          <InfoBox tone="warning">
            <p>{under18Warning}</p>
          </InfoBox>
        ) : null}
        {showShare ? (
          <TextField
            id={fieldId(shareField)}
            name={shareField}
            label={f.share}
            hint={f.shareHint}
            value={buyer.share}
            onChange={(event) => onChange(index, "share", event.currentTarget.value)}
            onBlur={() => onBlur(index, "share")}
            error={errors.share}
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            maxLength={3}
            suffix={f.shareSuffix}
            inputClassName="max-w-28 tabular-nums"
            required
          />
        ) : (
          <input type="hidden" name={shareField} value="100" />
        )}
        {canRemove ? (
          <Button variant="ghost" icon="close" onClick={() => onRemove(index)}>
            {fmt(f.removeBuyer, { n })}
          </Button>
        ) : null}
      </div>
    </fieldset>
  );
}
