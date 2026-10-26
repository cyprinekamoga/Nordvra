import Link from "next/link";
import { connection } from "next/server";
import { Card } from "@/components/ui";
import { Flash, PageHeader } from "@/components/admin/bits";
import { formatDateTime } from "@/lib/format";
import { setReviewStatusAction } from "@/lib/admin/review-actions";
import { createServerSupabase } from "@/lib/supabase/server";

export const metadata = { title: "Omdömen" };

const STATUS_LABEL: Record<string, string> = { ny: "Ny, väntar på dig", publicerad: "Publicerad", dold: "Dold" };

/** Reviews from customers: nothing is on the site until it is published here. */
export default async function ReviewsAdminPage({ searchParams }: PageProps<"/admin/omdomen">) {
  const sp = await searchParams;
  await connection();
  const supabase = await createServerSupabase();
  const { data: reviews } = await supabase
    .from("booking_reviews")
    .select("id,rating,body,display_name,service_name,status,created_at,published_at,booking_id,bookings(booking_number)")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <>
      <PageHeader title="Omdömen">
        <p className="mt-2 text-muted">
          Bara kunder med ett utfört jobb kan lämna omdöme. Inget syns på webbplatsen förrän du publicerar det.
          Publicera omdömen som de är, även de som inte är bara positiva.
        </p>
      </PageHeader>
      <Flash params={sp} />
      {(reviews ?? []).length === 0 ? (
        <p className="text-muted">Inga omdömen ännu. Be kunden om ett omdöme från bokningen när jobbet är utfört.</p>
      ) : (
        <ul className="space-y-4">
          {(reviews ?? []).map((review) => (
            <Card as="li" key={review.id} className="space-y-2">
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="text-accent" aria-label={`${review.rating} av 5`}>
                  {"★".repeat(review.rating)}
                  <span className="opacity-25">{"★".repeat(5 - review.rating)}</span>
                </span>
                <strong>{review.display_name}</strong>
                <span className="text-muted">{review.service_name}</span>
                <Link href={`/admin/bokningar/${review.booking_id}`} className="link">
                  {review.bookings?.booking_number ?? "Bokning"}
                </Link>
              </p>
              <p className="whitespace-pre-wrap">{review.body}</p>
              <p className="text-sm text-muted">
                {STATUS_LABEL[review.status] ?? review.status} · inkom {formatDateTime(review.created_at)}
              </p>
              <form action={setReviewStatusAction} className="flex flex-wrap gap-3">
                <input type="hidden" name="reviewId" value={review.id} />
                {review.status !== "publicerad" ? (
                  <button
                    type="submit"
                    name="status"
                    value="publicerad"
                    className="min-h-12 rounded-control border-2 border-brand bg-brand px-5 font-semibold text-on-brand"
                  >
                    Publicera
                  </button>
                ) : null}
                {review.status !== "dold" ? (
                  <button
                    type="submit"
                    name="status"
                    value="dold"
                    className="min-h-12 rounded-control border-2 border-brand bg-surface px-5 font-semibold text-brand"
                  >
                    Dölj
                  </button>
                ) : null}
              </form>
            </Card>
          ))}
        </ul>
      )}
    </>
  );
}
