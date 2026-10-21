import { t } from "@/lib/i18n";
import { photoUrl } from "@/lib/quote/photoUrl";
import type { QuotePhoto } from "@/lib/quote/quote";

const b = t.quote.booking;

/** Photo report from the finished job ("Före" / "Efter"). Nothing when there are no photos. */
export function QuotePhotos({
  photos,
  headingId = "fotorapport",
  headingLevel = 2,
}: {
  photos: QuotePhoto[];
  headingId?: string;
  headingLevel?: 2 | 4;
}) {
  const Heading = headingLevel === 2 ? "h2" : "h4";
  const shown = photos.flatMap((photo) => {
    const src = photoUrl(photo.path);
    return src ? [{ ...photo, src }] : [];
  });
  if (shown.length === 0) return null;
  return (
    <section aria-labelledby={headingId} className="space-y-3">
      <Heading id={headingId} className={headingLevel === 2 ? "text-xl font-bold text-ink" : "text-lg font-bold text-ink"}>
        {b.photosTitle}
      </Heading>
      <p className="text-muted">{b.photosLead}</p>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {shown.map((photo) => (
          <li key={photo.path}>
            <figure className="space-y-2">
              {/* Customer photos from storage; sizes are unknown, so a plain lazy image. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.src}
                alt={photo.caption ?? (photo.kind === "fore" ? b.photoBefore : b.photoAfter)}
                loading="lazy"
                className="aspect-[4/3] w-full rounded-card border border-border bg-surface-muted object-cover"
              />
              <figcaption className="text-ink">
                <span className="font-bold">{photo.kind === "fore" ? b.photoBefore : b.photoAfter}</span>
                {photo.caption ? `: ${photo.caption}` : null}
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </section>
  );
}
