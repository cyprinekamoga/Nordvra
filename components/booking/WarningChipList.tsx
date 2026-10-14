"use client";

import { useId } from "react";
import { WarningChip } from "@/components/ui";
import { notDeductibleById } from "@/lib/content/notDeductible";
import { fmt, t } from "@/lib/i18n";
import type { DeductionType } from "@/lib/taxRules";

const s = t.booking.warnings;

/**
 * "Det här ger inte RUT-avdrag" / "… ROT-avdrag" with warning chips linking to
 * /vad-ger-inte-avdrag. Grouped by deduction type so that e.g. "Byggstädning" (no RUT) is never
 * read as contradicting the ROT service "Byggstädning efter ROT-arbete". Unknown ids are skipped.
 */
export function WarningChipList({ ids, lead }: { ids: readonly string[]; lead?: string }) {
  const baseId = useId();
  const items = [...new Set(ids)].map((id) => notDeductibleById(id)).filter((item) => item !== undefined);
  if (items.length === 0) return null;
  const groups = (["rut", "rot"] as const satisfies readonly DeductionType[])
    .map((type) => ({ type, items: items.filter((item) => item.type === type) }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="space-y-6">
      {groups.map((group, index) => {
        const headingId = `${baseId}-${group.type}`;
        return (
          <section key={group.type} aria-labelledby={headingId} className="space-y-3">
            <h2 id={headingId} className="text-xl font-bold text-ink">
              {fmt(s.title, { deduction: t.common.deduction[group.type === "rut" ? "rutDeduction" : "rotDeduction"] })}
            </h2>
            {lead && index === 0 ? <p className="text-muted">{lead}</p> : null}
            <ul className="flex flex-wrap gap-2">
              {group.items.map((item) => (
                <li key={item.id}>
                  <WarningChip id={item.id} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
