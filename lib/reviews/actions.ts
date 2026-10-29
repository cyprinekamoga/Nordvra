"use server";

import { after } from "next/server";
import { company } from "@/lib/company";
import { hashToken } from "@/lib/crypto/pii";
import { sendEmailSafe } from "@/lib/email";
import { ownerNewReview } from "@/lib/email/templates";
import { fmt, t } from "@/lib/i18n";
import { getNotificationEmail } from "@/lib/settings";
import { siteUrl } from "@/lib/site";
import { createAnonClient } from "@/lib/supabase/anon";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { validateReview, type ReviewErrors } from "./reviews";

export type ReviewFormState =
  | { status: "idle" }
  | { status: "sent" }
  | { status: "error"; message: string | null; fieldErrors: ReviewErrors };

const e = t.common.reviews.form.errors;
const phone = company.phoneDisplay;
const TOKEN_RE = /^[A-Za-z0-9_-]{20,128}$/;

/**
 * "Skicka omdöme", bound to the booking link token (quote link or review link). The review is
 * saved as new; the owner publishes it in admin. The text and token are never logged.
 */
export async function submitReview(token: string, _prev: ReviewFormState, formData: FormData): Promise<ReviewFormState> {
  if (!TOKEN_RE.test(token) || !isSupabaseConfigured()) {
    return { status: "error", message: fmt(e.notAvailable, { phone }), fieldErrors: {} };
  }
  const result = validateReview({
    rating: formData.get("rating"),
    body: formData.get("body"),
    displayName: formData.get("displayName"),
  });
  if (!result.ok) return { status: "error", message: null, fieldErrors: result.errors };

  let bookingNumber: string | null = null;
  try {
    const { data, error } = await createAnonClient().rpc("submit_review", {
      p_token_hash: hashToken(token),
      p_rating: result.data.rating,
      p_body: result.data.body,
      p_display_name: result.data.displayName,
    });
    if (error) {
      const code = /review_exists|review_not_available|quote_not_found|invalid_review/.exec(error.message)?.[0] ?? "other";
      console.warn(`[reviews] submit_review failed: ${code}`);
      if (code === "review_exists") return { status: "error", message: e.exists, fieldErrors: {} };
      if (code === "other") return { status: "error", message: fmt(e.generic, { phone }), fieldErrors: {} };
      return { status: "error", message: fmt(e.notAvailable, { phone }), fieldErrors: {} };
    }
    bookingNumber = typeof data === "string" ? data : null;
  } catch {
    return { status: "error", message: fmt(e.generic, { phone }), fieldErrors: {} };
  }

  if (bookingNumber) {
    const number = bookingNumber;
    const rating = result.data.rating;
    after(async () => {
      const notificationEmail = await getNotificationEmail(createAnonClient());
      await sendEmailSafe({
        to: notificationEmail || company.email,
        ...ownerNewReview({ bookingNumber: number, rating, adminUrl: siteUrl("/admin/omdomen") }),
      });
    });
  }
  return { status: "sent" };
}
