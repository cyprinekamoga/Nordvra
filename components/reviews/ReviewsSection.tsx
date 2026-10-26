import { Card, Container, Icon } from "@/components/ui";
import { fmt, t } from "@/lib/i18n";
import { getPublishedReviews } from "@/lib/reviews/load";

const r = t.common.reviews;

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex gap-0.5 text-accent" role="img" aria-label={fmt(r.stars, { rating })}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} aria-hidden="true" className={n <= rating ? "" : "opacity-25"}>
          ★
        </span>
      ))}
    </span>
  );
}

/**
 * "Vad våra kunder säger": only reviews from real customers with a completed job, published by
 * the owner. Until there are any, a short honest note instead of placeholders.
 */
export async function ReviewsSection() {
  const reviews = await getPublishedReviews();
  const average =
    reviews.average !== null && reviews.count > 0
      ? fmt(reviews.count === 1 ? r.averageOne : r.average, {
          average: reviews.average.toLocaleString("sv-SE", { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
          count: reviews.count,
        })
      : null;
  return (
    <section aria-labelledby="omdomen-rubrik" className="py-12 sm:py-16">
      <Container className="space-y-6">
        <div className="space-y-2">
          <h2 id="omdomen-rubrik" className="text-2xl text-ink sm:text-3xl">
            {r.title}
          </h2>
          {average ? <p className="text-lg font-semibold text-ink">{average}</p> : null}
        </div>
        {reviews.items.length === 0 ? (
          <Card tone="outline" padding="md" className="flex items-start gap-4">
            <Icon name="users" size={26} className="mt-0.5 shrink-0 text-muted" />
            <p className="text-muted">{r.empty}</p>
          </Card>
        ) : (
          <>
            <p className="text-muted">{r.lead}</p>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {reviews.items.map((review, i) => (
                <Card as="li" key={i} padding="md" className="space-y-3">
                  <Stars rating={review.rating} />
                  <blockquote className="break-words whitespace-pre-line text-ink">{review.body}</blockquote>
                  <p className="font-semibold text-ink">
                    {review.displayName}
                    {review.serviceName ? <span className="font-normal text-muted">, {review.serviceName}</span> : null}
                  </p>
                </Card>
              ))}
            </ul>
          </>
        )}
      </Container>
    </section>
  );
}
