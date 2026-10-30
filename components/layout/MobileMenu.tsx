"use client";

import Link from "next/link";
import { Suspense, useEffect, useId, useRef, useState } from "react";
import { buttonClasses } from "@/components/ui/button-styles";
import { cx } from "@/components/ui/cx";
import { Icon } from "@/components/ui/Icon";
import { company } from "@/lib/company";
import { fmt, t } from "@/lib/i18n";
import { BOOK_HREF, mainNav } from "./nav";
import { NavLinks } from "./NavLinks";
import { NavList } from "./NavList";

/**
 * Disclosure menu for small screens: a "Meny" button (`aria-expanded`) that shows the
 * navigation, the "Boka" button and the phone number below the header. Escape closes it and
 * returns focus to the button; following a link closes it.
 */
export function MobileMenu({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div className={className}>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex min-h-12 items-center gap-2 rounded-control border-2 border-brand bg-brand px-3 font-semibold text-on-brand hover:bg-brand-strong aria-expanded:bg-brand-strong"
      >
        <Icon name={open ? "close" : "menu"} size={22} />
        <span>{t.common.nav.menu}</span>
      </button>
      <div
        id={panelId}
        hidden={!open}
        className="absolute inset-x-0 top-full z-40 max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain border-b-2 border-brand bg-surface shadow-raised"
      >
        <nav aria-label={t.common.nav.label} className="mx-auto w-full max-w-page px-4 pt-2 pb-5 sm:px-6">
          <Suspense fallback={<NavList items={mainNav} variant="mobile" onNavigate={close} />}>
            <NavLinks items={mainNav} variant="mobile" onNavigate={close} />
          </Suspense>
          <div className="mt-4 flex flex-col gap-3">
            <Link
              href={BOOK_HREF}
              onClick={close}
              className={buttonClasses({ variant: "primary", size: "lg", fullWidth: true })}
            >
              <span>{t.common.nav.book}</span>
              <Icon name="arrow-right" />
            </Link>
            <a
              href={company.phoneHref}
              onClick={close}
              className={cx(buttonClasses({ variant: "secondary", fullWidth: true }))}
            >
              <Icon name="phone" />
              <span>{fmt(t.common.phone.ctaWithNumber, { phone: company.phoneDisplay })}</span>
            </a>
          </div>
        </nav>
      </div>
    </div>
  );
}
