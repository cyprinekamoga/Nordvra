"use client";

import { useId } from "react";
import { FieldError, InfoBox, Tile } from "@/components/ui";
import { selectService } from "@/lib/booking/state";
import { fmt, t } from "@/lib/i18n";
import type { StepProps } from "../types";
import { WarningChipList } from "../WarningChipList";

const s = t.booking.steps.service;

/**
 * Step 2: the services in the chosen category, each with its own RUT/ROT badge. Below the list,
 * warning chips for things in this category that don't give a deduction.
 */
export function StepService({
  catalog,
  draft,
  derived,
  errors,
  update,
  onPicked,
}: StepProps & { onPicked: () => void }) {
  const errorId = useId();
  const { category, services } = derived;
  const warningIds = services.flatMap((service) => service.warningIds);

  if (category && services.length === 0) {
    return <InfoBox tone="info">{s.empty}</InfoBox>;
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        {errors.serviceId ? <FieldError id={errorId}>{errors.serviceId}</FieldError> : null}
        <ul aria-label={fmt(s.listLabel, { category: category?.name ?? "" })} className="grid gap-3">
          {services.map((service) => (
            <li key={service.id}>
              <Tile
                title={service.name}
                deduction={service.deductionType}
                description={service.description}
                selected={draft.serviceId === service.id}
                aria-describedby={errors.serviceId ? errorId : undefined}
                data-invalid={errors.serviceId ? "true" : undefined}
                onClick={() => {
                  update((d) => selectService(d, service.id, catalog));
                  onPicked();
                }}
              />
            </li>
          ))}
        </ul>
      </div>

      <WarningChipList ids={warningIds} lead={s.warningsLead} />
    </div>
  );
}
