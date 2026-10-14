"use client";

import { Calendar, Checkbox, ChipGroup, type ChipOption } from "@/components/ui";
import type { InspectionChoice } from "@/lib/booking/schema";
import { dateBounds } from "@/lib/booking/state";
import { TIME_WINDOWS, type TimeWindow } from "@/lib/catalog/types";
import { t } from "@/lib/i18n";
import type { StepProps } from "../types";

const s = t.booking.steps.when;

/**
 * Step 4 "När?": calendar (tomorrow up to six months ahead), time of day, flyttstäd inspection
 * date (optional) and the "Jag är flexibel" wish (an internal note – no discount).
 */
export function StepWhen({ draft, derived, today, errors, update }: StepProps) {
  const { min, max } = dateBounds(today);
  const timeWindows: ChipOption<TimeWindow>[] = TIME_WINDOWS.map((value) => ({
    value,
    label: t.common.timeWindows[value],
  }));
  const inspectionChoices: ChipOption<InspectionChoice>[] = [
    { value: "date", label: s.inspectionKnown },
    { value: "unknown", label: s.inspectionUnknown },
  ];

  return (
    <div className="space-y-8">
      <div data-invalid={errors.preferredDate ? "true" : undefined}>
        <Calendar
          label={s.dateLabel}
          value={draft.preferredDate ?? null}
          onChange={(value) => update((d) => ({ ...d, preferredDate: value }))}
          min={min}
          max={max}
          today={today}
          error={errors.preferredDate}
        />
      </div>

      <ChipGroup<TimeWindow>
        name="timeWindow"
        legend={s.timeLegend}
        options={timeWindows}
        value={draft.timeWindow ?? null}
        onChange={(value) => update((d) => ({ ...d, timeWindow: value }))}
        error={errors.timeWindow}
        layout="wrap"
        required
      />

      {derived.questions?.inspection ? (
        <div className="space-y-4">
          <ChipGroup<InspectionChoice>
            name="inspection"
            legend={s.inspectionLegend}
            hint={s.inspectionHint}
            options={inspectionChoices}
            value={draft.inspection ?? null}
            onChange={(value) =>
              update((d) => ({
                ...d,
                inspection: value,
                inspectionDate: value === "date" ? d.inspectionDate : undefined,
              }))
            }
            layout="grid"
            columns={2}
          />
          {draft.inspection === "date" ? (
            <div data-invalid={errors.inspectionDate ? "true" : undefined}>
              <Calendar
                label={s.inspectionDateLabel}
                value={draft.inspectionDate ?? null}
                onChange={(value) => update((d) => ({ ...d, inspectionDate: value }))}
                min={min}
                max={max}
                today={today}
                error={errors.inspectionDate}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      <Checkbox
        name="flexible"
        label={s.flexibleLabel}
        description={s.flexibleDescription}
        checked={draft.flexible}
        onChange={(event) => {
          const checked = event.currentTarget.checked;
          update((d) => ({ ...d, flexible: checked }));
        }}
        boxed
      />
    </div>
  );
}
