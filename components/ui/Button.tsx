"use client";

import type { ComponentPropsWithRef, MouseEvent, ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { buttonClasses, type ButtonStyleOptions } from "./button-styles";
import { Icon, type IconName } from "./Icon";

export interface ButtonProps extends ComponentPropsWithRef<"button">, ButtonStyleOptions {
  /** Icon before the text (decorative). */
  icon?: IconName;
  /** Icon after the text (decorative), e.g. "arrow-right" on "Fortsätt". */
  iconEnd?: IconName;
  /**
   * Shows a spinner and blocks clicks while keeping focus on the button
   * (uses `aria-disabled`, not `disabled`, so keyboard users don't lose their place).
   */
  loading?: boolean;
  /** Text shown while `loading`, e.g. "Skickar …". Defaults to the normal children. */
  loadingText?: ReactNode;
}

function Spinner() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      className="size-5 shrink-0 animate-spin"
      fill="none"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Button with variants primary/secondary/ghost/danger. Defaults to `type="button"`.
 * Pass `aria-disabled` instead of `disabled` when the button should stay focusable.
 */
export function Button({
  variant,
  size,
  fullWidth,
  className,
  icon,
  iconEnd,
  loading = false,
  loadingText,
  type = "button",
  children,
  onClick,
  "aria-disabled": ariaDisabled,
  ...rest
}: ButtonProps) {
  const blocked = loading || ariaDisabled === true || ariaDisabled === "true";
  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (blocked) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  }
  return (
    <button
      type={type}
      className={buttonClasses({ variant, size, fullWidth, className })}
      aria-disabled={blocked || undefined}
      aria-busy={loading || undefined}
      onClick={handleClick}
      {...rest}
    >
      {loading ? <Spinner /> : icon ? <Icon name={icon} /> : null}
      <span>{loading && loadingText ? loadingText : children}</span>
      {!loading && iconEnd ? <Icon name={iconEnd} /> : null}
    </button>
  );
}

export interface SubmitButtonProps extends Omit<ButtonProps, "type" | "loading"> {
  /** Text while the surrounding `<form action={…}>` is submitting, e.g. "Skickar …". */
  pendingText?: ReactNode;
  /** Force the loading state (e.g. while a client-side transition runs). */
  loading?: boolean;
}

/**
 * Submit button for forms that use a server action: shows the loading state automatically
 * while the form is pending (`useFormStatus`). Must be rendered inside the `<form>`.
 */
export function SubmitButton({ pendingText, loading, ...rest }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return <Button {...rest} type="submit" loading={pending || loading} loadingText={pendingText} />;
}
