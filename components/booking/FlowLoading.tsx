import { t } from "@/lib/i18n";

/**
 * Placeholder while the request flow loads in the browser (Suspense fallback and before the
 * saved answers have been read). Server-component safe.
 */
export function FlowLoading() {
  return (
    <div className="min-h-[60vh]">
      <h1 className="text-3xl font-bold text-ink">{t.booking.pageTitle}</h1>
      <p role="status" className="mt-4 flex items-center gap-3 text-muted">
        <svg
          aria-hidden="true"
          focusable="false"
          viewBox="0 0 24 24"
          className="size-6 shrink-0 animate-spin text-brand motion-reduce:animate-none"
          fill="none"
        >
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
          <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
        <span>{t.booking.loading}</span>
      </p>
    </div>
  );
}
