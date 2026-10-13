import Link from "next/link";
import type { ComponentPropsWithRef } from "react";
import { t } from "@/lib/i18n";
import { buttonClasses, type ButtonStyleOptions } from "./button-styles";
import { Icon, type IconName } from "./Icon";

export interface LinkButtonProps
  extends Omit<ComponentPropsWithRef<"a">, "href">,
    ButtonStyleOptions {
  /** Internal path ("/boka"), or tel:/mailto:/https: URL (rendered as a plain `<a>`). */
  href: string;
  /** Icon before the text (decorative). */
  icon?: IconName;
  /** Icon after the text (decorative). */
  iconEnd?: IconName;
  /** Opens in a new tab and tells screen-reader users so. Use for external sites only. */
  newTab?: boolean;
  /** Passed to next/link for internal links. */
  prefetch?: boolean;
}

function isPlainHref(href: string): boolean {
  return /^(tel:|mailto:|sms:|https?:\/\/|#)/i.test(href);
}

/** A link that looks like a Button. Server-component safe. */
export function LinkButton({
  href,
  variant,
  size,
  fullWidth,
  className,
  icon,
  iconEnd,
  newTab = false,
  prefetch,
  children,
  ...rest
}: LinkButtonProps) {
  const classes = buttonClasses({ variant, size, fullWidth, className });
  const content = (
    <>
      {icon ? <Icon name={icon} /> : null}
      <span>{children}</span>
      {iconEnd ? <Icon name={iconEnd} /> : null}
      {newTab ? (
        <>
          <Icon name="external" size="1em" />
          <span className="sr-only"> {t.common.external.newTab}</span>
        </>
      ) : null}
    </>
  );
  const tabProps = newTab ? { target: "_blank", rel: "noopener noreferrer" } : {};

  if (isPlainHref(href)) {
    return (
      <a href={href} className={classes} {...tabProps} {...rest}>
        {content}
      </a>
    );
  }
  return (
    <Link href={href} className={classes} prefetch={prefetch} {...tabProps} {...rest}>
      {content}
    </Link>
  );
}
