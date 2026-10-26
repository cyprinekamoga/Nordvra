import { containsPersonnummer } from "@/lib/booking/schema";
import { toNullableNumber } from "@/lib/catalog/map";
import { t } from "@/lib/i18n";

/**
 * Customer reviews: parsing the RPC results and validating the form. Pure, so it is unit-tested.
 * Only customers with a completed job can review, and the owner publishes each review by hand.
 */

export const REVIEW_BODY_MIN = 10;
export const REVIEW_BODY_MAX = 1000;
export const REVIEW_NAME_MAX = 60;

export interface PublishedReview {
  rating: number;
  body: string;
  displayName: string;
  serviceName: string;
  publishedAt: string | null;
}

export interface PublishedReviews {
  count: number;
  average: number | null;
  items: PublishedReview[];
}

export interface ReviewState {
  bookingNumber: string;
  serviceName: string;
  /** First name and city, to suggest "Anna, Eskilstuna". */
  suggestedName: string;
  canReview: boolean;
  reviewed: boolean;
}

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export const EMPTY_REVIEWS: PublishedReviews = { count: 0, average: null, items: [] };

export function parsePublishedReviews(raw: unknown): PublishedReviews {
  const r = record(raw);
  if (!r) return EMPTY_REVIEWS;
  const items = Array.isArray(r.items)
    ? r.items.flatMap((item): PublishedReview[] => {
        const x = record(item);
        const rating = toNullableNumber(x?.rating);
        const body = text(x?.body);
        const displayName = text(x?.display_name);
        if (!x || rating === null || rating < 1 || rating > 5 || !body || !displayName) return [];
        return [
          {
            rating: Math.round(rating),
            body,
            displayName,
            serviceName: text(x.service_name),
            publishedAt: text(x.published_at) || null,
          },
        ];
      })
    : [];
  const count = toNullableNumber(r.count);
  const average = toNullableNumber(r.average);
  return {
    count: count !== null && count >= 0 ? Math.round(count) : items.length,
    average: average !== null && average >= 1 && average <= 5 ? average : null,
    items,
  };
}

export function parseReviewState(raw: unknown): ReviewState | null {
  const r = record(raw);
  const bookingNumber = text(r?.booking_number);
  if (!r || !bookingNumber) return null;
  const first = text(r.contact_name);
  const city = text(r.city);
  return {
    bookingNumber,
    serviceName: text(r.service_name),
    suggestedName: [first, city].filter(Boolean).join(", ").slice(0, REVIEW_NAME_MAX),
    canReview: r.can_review === true,
    reviewed: r.reviewed === true,
  };
}

export interface ReviewInput {
  rating: number;
  body: string;
  displayName: string;
}

export type ReviewErrors = Partial<Record<keyof ReviewInput, string>>;

const e = t.common.reviews.form.errors;

export function validateReview(input: {
  rating: unknown;
  body: unknown;
  displayName: unknown;
}): { ok: true; data: ReviewInput } | { ok: false; errors: ReviewErrors } {
  const errors: ReviewErrors = {};
  const rating = Number(input.rating);
  const body = typeof input.body === "string" ? input.body.trim() : "";
  const displayName = typeof input.displayName === "string" ? input.displayName.trim().replace(/\s+/g, " ") : "";
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) errors.rating = e.rating;
  if (body.length < REVIEW_BODY_MIN) errors.body = e.bodyShort;
  else if (body.length > REVIEW_BODY_MAX) errors.body = e.bodyLong;
  else if (containsPersonnummer(body)) errors.body = e.personnummer;
  if (displayName.length < 2 || displayName.length > REVIEW_NAME_MAX || containsPersonnummer(displayName)) {
    errors.displayName = e.name;
  }
  return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true, data: { rating, body, displayName } };
}
