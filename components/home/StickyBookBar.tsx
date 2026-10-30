"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCookieNoticeAcknowledged } from "@/components/layout/CookieBanner";
import { buttonClasses } from "@/components/ui/button-styles";
import { Icon } from "@/components/ui/Icon";
import { company } from "@/lib/company";
import { fmt, t } from "@/lib/i18n";

/** The sections that already have a big "Boka" button: while one is on screen the bar stays away. */
const OWN_BUTTON_SELECTOR = "[data-book-cta], footer";

/**
 * Phones only: "Boka på 2 minuter" and a call button fixed to the bottom of the screen, so the
 * next step is always under the thumb while scrolling the homepage. Not shown while the hero,
 * the closing call to action or the footer is visible, nor before the cookie notice is closed
 * (they would cover each other). Not rendered at all when hidden, so it is never tabbed to.
 */
export function StickyBookBar() {
  const cookieClosed = useCookieNoticeAcknowledged();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const targets = [...document.querySelectorAll(OWN_BUTTON_SELECTOR)];
    const onScreen = new Set<Element>();
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) onScreen.add(entry.target);
        else onScreen.delete(entry.target);
      }
      setVisible(onScreen.size === 0);
    });
    targets.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  if (!visible || !cookieClosed) return null;
  return (
    <div className="fade-in fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-raised backdrop-blur md:hidden">
      <div className="flex gap-2">
        <Link href="/boka" className={buttonClasses({ variant: "primary", className: "flex-1" })}>
          <span>{t.common.actions.bookInTwoMinutes}</span>
          <Icon name="arrow-right" />
        </Link>
        <a
          href={company.phoneHref}
          aria-label={fmt(t.common.phone.headerButtonLabel, { phone: company.phoneDisplay })}
          className={buttonClasses({ variant: "secondary", className: "px-4" })}
        >
          <Icon name="phone" />
        </a>
      </div>
    </div>
  );
}
