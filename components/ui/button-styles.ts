import { cx } from "./cx";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "md" | "lg";

export interface ButtonStyleOptions {
  /** primary = filled brand green; secondary = outlined; ghost = text only; danger = red fill. */
  variant?: ButtonVariant;
  /** md ≈ 54px tall, lg ≈ 63px tall (both above the 48px minimum). */
  size?: ButtonSize;
  /** Stretch to the container width (typical on mobile). */
  fullWidth?: boolean;
  className?: string;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-control border-2 font-semibold leading-tight text-center no-underline transition-colors duration-150 select-none " +
  "aria-disabled:cursor-not-allowed disabled:cursor-not-allowed";

const variants: Record<ButtonVariant, string> = {
  primary:
    "border-brand bg-brand text-on-brand hover:border-brand-strong hover:bg-brand-strong " +
    "disabled:border-disabled disabled:bg-disabled aria-disabled:border-disabled aria-disabled:bg-disabled",
  secondary:
    "border-brand bg-surface text-brand hover:bg-brand-soft " +
    "disabled:border-disabled disabled:text-disabled aria-disabled:border-disabled aria-disabled:text-disabled aria-disabled:hover:bg-surface",
  ghost:
    "border-transparent bg-transparent text-brand underline decoration-1 underline-offset-4 hover:bg-brand-soft hover:decoration-2 " +
    "disabled:text-disabled aria-disabled:text-disabled aria-disabled:hover:bg-transparent",
  danger:
    "border-danger bg-danger text-on-brand hover:brightness-90 " +
    "disabled:border-disabled disabled:bg-disabled aria-disabled:border-disabled aria-disabled:bg-disabled",
};

const sizes: Record<ButtonSize, string> = {
  md: "min-h-12 px-5 py-2 text-base",
  lg: "min-h-14 px-7 py-3 text-lg",
};

/** Class string shared by Button, SubmitButton and LinkButton. */
export function buttonClasses({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
}: ButtonStyleOptions = {}): string {
  return cx(base, variants[variant], sizes[size], fullWidth && "w-full", className);
}
