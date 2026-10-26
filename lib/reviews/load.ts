import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createAnonClient } from "@/lib/supabase/anon";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { EMPTY_REVIEWS, parsePublishedReviews, parseReviewState, type PublishedReviews, type ReviewState } from "./reviews";

/** Cache tag for published reviews; publishing or hiding one in admin calls `updateTag`. */
export const REVIEWS_TAG = "reviews";

/** Published reviews for the homepage. Cached; empty when unavailable (never breaks the page). */
export async function getPublishedReviews(): Promise<PublishedReviews> {
  "use cache";
  cacheLife("hours");
  cacheTag(REVIEWS_TAG);
  if (!isSupabaseConfigured()) return EMPTY_REVIEWS;
  try {
    const { data, error } = await createAnonClient().rpc("get_published_reviews");
    if (error) {
      console.warn(`[reviews] get_published_reviews failed (${error.code ?? "no code"})`);
      return EMPTY_REVIEWS;
    }
    return parsePublishedReviews(data);
  } catch (error) {
    console.warn(`[reviews] get_published_reviews threw: ${error instanceof Error ? error.name : "unknown"}`);
    return EMPTY_REVIEWS;
  }
}

/** Whether the booking behind a link token can be reviewed. Null when unknown or unavailable. */
export async function loadReviewState(tokenHash: string): Promise<ReviewState | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await createAnonClient().rpc("get_review_state", { p_token_hash: tokenHash });
    if (error) {
      console.warn(`[reviews] get_review_state failed (${error.code ?? "no code"})`);
      return null;
    }
    return parseReviewState(data);
  } catch {
    return null;
  }
}
