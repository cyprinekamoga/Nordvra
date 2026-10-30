"use client";

import { useId } from "react";
import { FieldError, Tile } from "@/components/ui";
import { selectCategory } from "@/lib/booking/state";
import { categoryPhotos } from "@/lib/content/photos";
import { t } from "@/lib/i18n";
import type { StepProps } from "../types";

const s = t.booking.steps.category;

/** Step 1: 13 category tiles, each with a photo of the work. Choosing one saves it and moves on (`onPicked`). */
export function StepCategory({
  catalog,
  draft,
  errors,
  update,
  onPicked,
}: StepProps & { onPicked: (categoryId: string) => void }) {
  const errorId = useId();
  const categories = [...catalog.categories].filter((c) => c.active).sort((a, b) => a.sort - b.sort);
  return (
    <div className="space-y-4">
      {errors.categoryId ? <FieldError id={errorId}>{errors.categoryId}</FieldError> : null}
      <ul aria-label={s.listLabel} className="grid gap-2 sm:grid-cols-2 sm:gap-3">
        {categories.map((category) => (
          <li key={category.id}>
            <Tile
              title={category.name}
              icon={category.icon}
              photo={categoryPhotos[category.id]}
              deduction={category.deductionType}
              selected={draft.categoryId === category.id}
              aria-describedby={errors.categoryId ? errorId : undefined}
              data-invalid={errors.categoryId ? "true" : undefined}
              className="h-full"
              onClick={() => {
                update((d) => selectCategory(d, category.id, catalog));
                onPicked(category.id);
              }}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
