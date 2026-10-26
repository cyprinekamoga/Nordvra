import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { PhoneCard } from "@/components/layout";
import { QuoteLoading } from "@/components/quote/QuoteLoading";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { Card, Container } from "@/components/ui";
import { hashToken } from "@/lib/crypto/pii";
import { t } from "@/lib/i18n";
import { submitReview } from "@/lib/reviews/actions";
import { loadReviewState } from "@/lib/reviews/load";

const r = t.common.reviews;

/** Reads the booking per request, so it may block. */
export const instant = false;

export const metadata: Metadata = {
  title: r.page.metaTitle,
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

const TOKEN_RE = /^[A-Za-z0-9_-]{20,128}$/;

type Params = Promise<{ token: string }>;

async function ReviewContent({ params }: { params: Params }) {
  const { token } = await params;
  await connection();
  const state = TOKEN_RE.test(token) ? await loadReviewState(hashToken(token)) : null;
  if (!state) {
    return (
      <Card>
        <p className="text-ink">{r.page.notFound}</p>
      </Card>
    );
  }
  if (state.reviewed) {
    return (
      <Card>
        <p className="text-ink">{r.form.errors.exists}</p>
      </Card>
    );
  }
  if (!state.canReview) {
    return (
      <Card>
        <p className="text-ink">{r.form.notYet}</p>
      </Card>
    );
  }
  return (
    <ReviewForm
      action={submitReview.bind(null, token)}
      serviceName={state.serviceName}
      suggestedName={state.suggestedName}
    />
  );
}

/** `/omdome/[token]`: the review link the owner emails after a completed job. */
export default function ReviewPage({ params }: { params: Params }) {
  return (
    <Container width="narrow" className="space-y-10 py-6 sm:py-10">
      <h1 className="text-3xl leading-tight font-bold text-ink">{r.page.metaTitle}</h1>
      <Suspense fallback={<QuoteLoading />}>
        <ReviewContent params={params} />
      </Suspense>
      <PhoneCard />
    </Container>
  );
}
