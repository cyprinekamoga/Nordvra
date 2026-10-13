import { CURRENT_RULES, ratePercent, type DeductionType, type TaxYearRules } from "@/lib/taxRules";
import { fmt, t } from "@/lib/i18n";
import { cx } from "./cx";

export interface DeductionBadgeProps {
  /** "rut" → "RUT 50 %", "rot" → "ROT 30 %". */
  type: DeductionType;
  /** Rules to read the rate from. Defaults to `CURRENT_RULES` (the latest year in lib/taxRules.ts). */
  rules?: TaxYearRules;
  /** soft = tinted background (default); solid = filled (for use on photos/colour). */
  variant?: "soft" | "solid";
  size?: "sm" | "md";
  className?: string;
}

/** The text a badge shows, e.g. "RUT 50 %". Useful for option labels and tests. */
export function deductionBadgeText(type: DeductionType, rules: TaxYearRules = CURRENT_RULES): string {
  const rate = ratePercent(rules, type);
  return fmt(type === "rut" ? t.common.badges.rut : t.common.badges.rot, { rate });
}

/**
 * "RUT 50 %" / "ROT 30 %" badge. Screen readers hear the long form
 * ("RUT-avdrag 50 % på arbetskostnaden").
 */
export function DeductionBadge({
  type,
  rules = CURRENT_RULES,
  variant = "soft",
  size = "md",
  className,
}: DeductionBadgeProps) {
  const rate = ratePercent(rules, type);
  const short = deductionBadgeText(type, rules);
  const long = fmt(type === "rut" ? t.common.badges.rutLong : t.common.badges.rotLong, { rate });
  const tone =
    variant === "solid"
      ? type === "rut"
        ? "bg-rut text-on-brand border-rut"
        : "bg-rot text-on-brand border-rot"
      : type === "rut"
        ? "bg-rut-soft text-rut border-rut"
        : "bg-rot-soft text-rot-strong border-rot";
  return (
    <span
      className={cx(
        "inline-flex items-center whitespace-nowrap rounded-full border font-bold leading-none",
        size === "sm" ? "px-2 py-1 text-sm" : "px-3 py-1.5 text-base",
        tone,
        className,
      )}
    >
      <span aria-hidden="true">{short}</span>
      <span className="sr-only">{long}</span>
    </span>
  );
}
