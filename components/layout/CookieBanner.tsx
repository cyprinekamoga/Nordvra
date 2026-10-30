"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { t } from "@/lib/i18n";

/** localStorage key. Stores only "1" – no personal data. */
export const COOKIE_NOTICE_KEY = "nordvra-cookie-notice-v1";

const listeners = new Set<() => void>();
/** Fallback when storage is blocked (private mode, disabled site data): remember for this page view. */
let acknowledgedInMemory = false;

function subscribe(callback: () => void) {
  listeners.add(callback);
  const onStorage = (event: StorageEvent) => {
    if (event.key === COOKIE_NOTICE_KEY) callback();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot(): boolean {
  if (acknowledgedInMemory) return true;
  try {
    return window.localStorage.getItem(COOKIE_NOTICE_KEY) === "1";
  } catch {
    return false;
  }
}

/** On the server (and during hydration) the notice counts as acknowledged → nothing is rendered. */
function getServerSnapshot(): boolean {
  return true;
}

function acknowledge() {
  acknowledgedInMemory = true;
  try {
    window.localStorage.setItem(COOKIE_NOTICE_KEY, "1");
  } catch {
    // Storage unavailable – the in-memory flag hides the notice for this visit.
  }
  listeners.forEach((listener) => listener());
}

/** Whether the visitor has closed the cookie notice (true on the server, so nothing waits on it). */
export function useCookieNoticeAcknowledged(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Notice about necessary cookies only (no consent needed, so no "decline"). Renders nothing on
 * the server; appears after hydration until the visitor clicks "Jag förstår". Does not move focus.
 */
export function CookieBanner() {
  const acknowledged = useCookieNoticeAcknowledged();
  if (acknowledged) return null;
  return (
    <section
      aria-label={t.common.cookies.label}
      className="fixed inset-x-0 bottom-0 z-50 p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:p-4"
    >
      {/* One short row, so it covers as little as possible of a phone screen. */}
      <div className="mx-auto flex w-full max-w-page items-center justify-between gap-3 rounded-card bg-ink py-2 pr-2 pl-4 text-on-brand shadow-raised sm:p-4 sm:pl-5">
        <p>
          {t.common.cookies.text}{" "}
          <Link
            href="/integritetspolicy#cookies"
            className="font-semibold text-on-brand underline decoration-1 underline-offset-4 hover:decoration-2"
          >
            {t.common.cookies.link}
          </Link>
        </p>
        <button
          type="button"
          onClick={acknowledge}
          className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-control border-2 border-on-brand bg-surface px-4 font-semibold text-ink hover:bg-brand-soft sm:px-5"
        >
          {t.common.cookies.accept}
        </button>
      </div>
    </section>
  );
}
