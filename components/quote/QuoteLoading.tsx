import { t } from "@/lib/i18n";

/** Placeholder while the quote is read from the database (Suspense fallback). */
export function QuoteLoading() {
  return (
    <div aria-busy="true" className="space-y-6">
      <p role="status" className="text-lg font-semibold text-muted">
        {t.quote.loading}
      </p>
      <div aria-hidden="true" className="space-y-4">
        <div className="h-10 w-2/3 animate-pulse rounded-control bg-surface-muted motion-reduce:animate-none" />
        <div className="h-48 animate-pulse rounded-card bg-surface-muted motion-reduce:animate-none" />
        <div className="h-32 animate-pulse rounded-card bg-surface-muted motion-reduce:animate-none" />
      </div>
    </div>
  );
}
