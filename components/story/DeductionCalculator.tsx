"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { ChipGroup } from "@/components/ui/ChipGroup";
import { deductionBadgeText } from "@/components/ui/DeductionBadge";
import { PriceLine, PriceList } from "@/components/ui/PriceLine";
import { cx } from "@/components/ui/cx";
import { formatKr } from "@/lib/format";
import { fmt, t } from "@/lib/i18n";
import { calculatePrice } from "@/lib/pricing/calculate";
import { CURRENT_RULES, ratePercent, type DeductionType } from "@/lib/taxRules";

const k = t.content.home.didYouKnow.calculator;

/** Slider range in whole kronor; the top lets both caps (RUT 150 000, ROT ~167 000) be reached. */
const MIN_KR = 500;
const MAX_KR = 200_000;
const STEP_KR = 100;

export interface DeductionCalculatorProps {
  defaultType: DeductionType;
  /** Labour in whole kronor the slider starts at, e.g. the page's own example. */
  defaultLabourKr: number;
  /** Line under the lead saying what the start value is. */
  startHint?: string;
  headingLevel?: 2 | 3;
  className?: string;
}

/**
 * "Räkna själv": pick RUT or ROT, drag the labour cost, see the deduction and what you pay.
 * Uses calculatePrice and the current tax rules, so caps and rounding match real quotes.
 * Starts on the page's example, so the numbers are there before any interaction.
 */
export function DeductionCalculator({
  defaultType,
  defaultLabourKr,
  startHint,
  headingLevel = 3,
  className,
}: DeductionCalculatorProps) {
  const id = useId();
  const [type, setType] = useState<DeductionType>(defaultType);
  const [labourKr, setLabourKr] = useState(defaultLabourKr);
  const [touched, setTouched] = useState(false);

  const breakdown = useMemo(
    () =>
      calculatePrice({
        deductionType: type,
        lines: { labour: labourKr * 100, material: 0, travel: 0 },
        rules: CURRENT_RULES,
        eligible: true,
      }),
    [type, labourKr],
  );
  const name = type.toUpperCase();
  const rate = `${ratePercent(CURRENT_RULES, type)} %`;
  const payShare = breakdown.total > 0 ? (breakdown.toPay / breakdown.total) * 100 : 100;
  const summary = `${k.youPay} ${formatKr(breakdown.toPay)}. ${fmt(k.deduction, { type: name, rate })} ${formatKr(breakdown.deduction)}.`;

  // One calm announcement after the slider stops, instead of one per step (none on page load).
  const [announced, setAnnounced] = useState("");
  useEffect(() => {
    if (!touched) return;
    const timer = setTimeout(() => setAnnounced(summary), 700);
    return () => clearTimeout(timer);
  }, [summary, touched]);

  const Heading = `h${headingLevel}` as const;
  return (
    <section
      aria-labelledby={`${id}-title`}
      className={cx("@container rounded-card border-2 border-control bg-surface p-5 sm:p-8", className)}
    >
      <div className="max-w-text space-y-2">
        <Heading id={`${id}-title`} className="text-2xl text-ink">
          {k.title}
        </Heading>
        <p className="text-lg">{k.lead}</p>
        {startHint ? <p className="text-muted">{startHint}</p> : null}
      </div>

      {/* Two columns only when the card itself is wide (homepage), one on reading-width pages. */}
      <div className="mt-6 grid gap-8 @3xl:grid-cols-2 @3xl:gap-10">
        <div className="min-w-0 space-y-6">
          <ChipGroup<DeductionType>
            name={`${id}-type`}
            legend={k.typeLegend}
            legendStyle="label"
            layout="stack"
            value={type}
            onChange={(value) => {
              setType(value);
              setTouched(true);
            }}
            options={[
              { value: "rut", label: k.rut, hint: deductionBadgeText("rut") },
              { value: "rot", label: k.rot, hint: deductionBadgeText("rot") },
            ]}
          />
          <div className="space-y-2">
            <label htmlFor={`${id}-labour`} className="block font-bold text-ink">
              {k.labourLabel}
            </label>
            <output htmlFor={`${id}-labour`} className="price block text-3xl text-brand">
              {formatKr(labourKr * 100)}
            </output>
            <input
              id={`${id}-labour`}
              type="range"
              min={MIN_KR}
              max={MAX_KR}
              step={STEP_KR}
              value={labourKr}
              aria-valuetext={formatKr(labourKr * 100)}
              onChange={(e) => {
                setLabourKr(Number(e.currentTarget.value));
                setTouched(true);
              }}
              className="h-12 w-full cursor-pointer accent-brand"
            />
            <div className="flex justify-between text-muted" aria-hidden="true">
              <span className="price font-normal">{formatKr(MIN_KR * 100)}</span>
              <span className="price font-normal">{formatKr(MAX_KR * 100)}</span>
            </div>
          </div>
        </div>

        <div className="min-w-0 space-y-4">
          <div>
            <p className="font-bold text-muted">{k.youPay}</p>
            <p className="price text-4xl text-ink">{formatKr(breakdown.toPay)}</p>
          </div>
          <div aria-hidden="true" className="space-y-2">
            <div className="flex h-5 overflow-hidden rounded-full border border-border bg-surface-muted">
              <span className="bg-brand transition-[width] duration-300" style={{ width: `${payShare}%` }} />
              <span
                className="transition-[width] duration-300"
                style={{
                  width: `${100 - payShare}%`,
                  backgroundImage:
                    "repeating-linear-gradient(135deg, var(--color-accent) 0 6px, color-mix(in srgb, var(--color-accent) 70%, white) 6px 12px)",
                }}
              />
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1">
              <span className="inline-flex items-center gap-2">
                <i className="inline-block size-4 rounded bg-brand" />
                {k.youPay}
              </span>
              <span className="inline-flex items-center gap-2">
                <i className="inline-block size-4 rounded bg-accent" />
                {k.taxAgencyPays}
              </span>
            </div>
          </div>
          <PriceList>
            <PriceLine label={k.labour} ore={breakdown.lines.labour} />
            <PriceLine
              label={fmt(k.deduction, { type: name, rate })}
              hint={breakdown.capped ? k.capped : undefined}
              ore={breakdown.deduction}
              negative
              accent={type}
            />
            <PriceLine label={k.youPay} ore={breakdown.toPay} emphasis="total" />
          </PriceList>
          <p className="text-muted">{t.content.home.didYouKnow.exampleNote}</p>
          <p className="sr-only" aria-live="polite" aria-atomic="true">
            {announced}
          </p>
        </div>
      </div>
    </section>
  );
}
