import { t } from "@/lib/i18n";

/** Id of the `<main>` element in app/layout.tsx. */
export const MAIN_CONTENT_ID = "innehall";

/** "Hoppa till innehållet" – first focusable element on every page; visible when focused. */
export function SkipLink() {
  return (
    <a
      href={`#${MAIN_CONTENT_ID}`}
      className="sr-only rounded-control bg-brand px-5 py-3 font-bold text-on-brand focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60]"
    >
      {t.common.skipLink}
    </a>
  );
}
