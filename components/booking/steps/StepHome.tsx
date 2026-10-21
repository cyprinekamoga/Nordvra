"use client";

import Link from "next/link";
import { Checkbox, ChipGroup, Stepper, YesNo, booleanToYesNo, yesNoToBoolean, type ChipOption } from "@/components/ui";
import {
  APPLIANCES,
  FLOORS_MAX,
  FLOORS_MIN,
  WINDOWS_MAX,
  WINDOWS_MIN,
  type Appliance,
} from "@/lib/booking/schema";
import { RECURRING_CHOICES, seasonalService, type RecurringChoice } from "@/lib/booking/extras";
import { effectiveFloors, effectiveWindows, housingOptions } from "@/lib/booking/state";
import { FREQUENCIES, SIZE_BANDS, type Frequency, type HousingType, type SizeBand } from "@/lib/catalog/types";
import { fmt, t } from "@/lib/i18n";
import type { StepProps } from "../types";

const s = t.booking.steps.home;
const c = t.common;

/**
 * Step 3 "Om bostaden": housing type and size for every service, plus the service-specific
 * questions (floors/pets, frequency, windows, appliances, add-ons), the move-out package and
 * the seasonal subscription.
 */
export function StepHome({ draft, derived, errors, update }: StepProps) {
  const { service, questions, companion } = derived;
  if (!service || !questions) return null;
  const seasonal = seasonalService(service);
  const recurringOptions: ChipOption<RecurringChoice>[] = seasonal
    ? RECURRING_CHOICES.map((value) => ({
        value,
        label: value === "once" ? t.booking.recurring.once : t.booking.recurring.season[seasonal],
      }))
    : [];
  const cleaningInPackage =
    service.formKind === "flyttstad" || (draft.packageAdd && companion?.formKind === "flyttstad");

  const housing: ChipOption<HousingType>[] = housingOptions(service.deductionType).map((value) => ({
    value,
    label: c.housing[value],
    hint: value === "foraldrar" ? c.housingHints.foraldrar : undefined,
  }));
  const sizes: ChipOption<SizeBand>[] = SIZE_BANDS.map((value) => ({ value, label: c.sizeBands[value] }));
  const frequencies: ChipOption<Frequency>[] = FREQUENCIES.map((value) => ({ value, label: c.frequencies[value] }));
  const appliances: ChipOption<Appliance>[] = APPLIANCES.map((value) => ({
    value,
    label: t.booking.appliances[value],
  }));
  const addons: ChipOption<string>[] = questions.addons.map((addon) => ({
    value: addon.id,
    label: addon.label,
    hint: addon.included ? s.includedHint : undefined,
  }));
  const addonKind = service.formKind === "flyttstad" || service.formKind === "fonster" ? service.formKind : "default";

  return (
    <div className="space-y-8">
      {companion ? (
        <fieldset className="space-y-3">
          <legend className="mb-2 text-lg font-bold text-ink">{t.booking.package.legend}</legend>
          <Checkbox
            name="packageAdd"
            boxed
            checked={draft.packageAdd}
            onChange={(event) => {
              const checked = event.currentTarget.checked;
              update((d) => ({ ...d, packageAdd: checked }));
            }}
            label={fmt(t.booking.package.label, { service: companion.name.toLocaleLowerCase("sv-SE") })}
            description={t.booking.package.hint}
          />
          {cleaningInPackage ? (
            <p className="text-muted">
              {c.legal.inspectionGuarantee.title}: {c.legal.inspectionGuarantee.body}{" "}
              <Link href="/flyttstadning-checklista" className="link">
                {c.legal.inspectionGuarantee.checklistLink}
              </Link>
            </p>
          ) : null}
        </fieldset>
      ) : null}

      {seasonal ? (
        <ChipGroup<RecurringChoice>
          name="recurring"
          legend={t.booking.recurring.legend}
          hint={t.booking.recurring.hint}
          options={recurringOptions}
          value={draft.recurring ?? "once"}
          onChange={(value) => update((d) => ({ ...d, recurring: value }))}
          layout="stack"
        />
      ) : null}

      <ChipGroup<HousingType>
        name="housingType"
        legend={s.housingLegend}
        options={housing}
        value={draft.housingType ?? null}
        onChange={(value) => update((d) => ({ ...d, housingType: value }))}
        error={errors.housingType}
        layout="stack"
        required
      />

      {questions.size ? (
        <ChipGroup<SizeBand>
          name="sizeBand"
          legend={s.sizeLegend}
          hint={questions.size === "required" ? s.sizeHint : s.sizeOptionalHint}
          options={sizes}
          value={draft.sizeBand ?? null}
          onChange={(value) => update((d) => ({ ...d, sizeBand: value }))}
          error={errors.sizeBand}
          layout="wrap"
          required={questions.size === "required"}
        />
      ) : null}

      {questions.frequency ? (
        <ChipGroup<Frequency>
          name="frequency"
          legend={s.frequencyLegend}
          options={frequencies}
          value={draft.frequency ?? null}
          onChange={(value) => update((d) => ({ ...d, frequency: value }))}
          error={errors.frequency}
          layout="grid"
          columns={2}
          required
        />
      ) : null}

      {questions.windows ? (
        <Stepper
          label={s.windowsLabel}
          hint={s.windowsHint}
          unit={s.windowsUnit}
          value={effectiveWindows(draft)}
          min={WINDOWS_MIN}
          max={WINDOWS_MAX}
          onChange={(value) => update((d) => ({ ...d, windows: value }))}
          error={errors.windows}
        />
      ) : null}

      {questions.appliances ? (
        <ChipGroup<Appliance>
          name="appliances"
          multiple
          legend={s.appliancesLegend}
          hint={s.appliancesHint}
          options={appliances}
          value={draft.appliances}
          onChange={(value) => update((d) => ({ ...d, appliances: value }))}
          error={errors.appliances}
          layout="wrap"
        />
      ) : null}

      {addons.length > 0 ? (
        <ChipGroup<string>
          name="addonIds"
          multiple
          legend={s.addonsLegend[addonKind]}
          hint={s.addonsHint[addonKind]}
          options={addons}
          value={draft.addonIds}
          onChange={(value) => update((d) => ({ ...d, addonIds: value }))}
          layout="wrap"
        />
      ) : null}

      {questions.homeDetails ? (
        <>
          <Stepper
            label={s.floorsLabel}
            hint={s.floorsHint}
            value={effectiveFloors(draft)}
            min={FLOORS_MIN}
            max={FLOORS_MAX}
            onChange={(value) => update((d) => ({ ...d, floors: value }))}
            error={errors.floors}
          />
          <YesNo
            name="pets"
            legend={s.petsLegend}
            hint={s.petsHint}
            value={booleanToYesNo(draft.pets)}
            onChange={(value) => update((d) => ({ ...d, pets: yesNoToBoolean(value) }))}
            error={errors.pets}
            required
          />
        </>
      ) : null}
    </div>
  );
}
