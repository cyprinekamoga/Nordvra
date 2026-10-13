import { cx } from "@/components/ui/cx";
import { Icon } from "@/components/ui/Icon";
import { t } from "@/lib/i18n";

/**
 * Visible notice on legal pages (Villkor, Integritetspolicy and the legal parts of
 * Så fungerar / Vad ger inte avdrag): "Ska granskas av jurist/skatterådgivare före lansering."
 * Remove once the texts have been reviewed.
 */
export function LegalReviewBanner({ className }: { className?: string }) {
  return (
    <div
      role="note"
      className={cx(
        "flex items-start gap-3 rounded-card border-2 border-warning-border bg-warning-soft p-4 font-semibold text-warning",
        className,
      )}
    >
      <Icon name="warning" size={24} className="mt-0.5" />
      <p>
        <span className="mr-2 inline-block rounded-full border border-warning-border px-2 text-sm uppercase">
          {t.common.badges.legalDraft}
        </span>
        {t.common.legal.reviewBanner}
      </p>
    </div>
  );
}
