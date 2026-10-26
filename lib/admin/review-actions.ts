"use server";

import { redirect } from "next/navigation";
import { updateTag } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import { createQuoteToken } from "@/lib/crypto/pii";
import { sendEmailSafe } from "@/lib/email";
import { reviewRequest } from "@/lib/email/templates";
import { REVIEWS_TAG } from "@/lib/reviews/load";
import { siteUrl } from "@/lib/site";
import { createServerSupabase } from "@/lib/supabase/server";

const id = z.string().uuid();
const DONE = ["utford", "betald", "rut_rot_begard", "avslutad"] as const;

/** Publishes or hides a review; the homepage updates at once. */
export async function setReviewStatusAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const reviewId = id.parse(formData.get("reviewId"));
  const status = formData.get("status") === "publicerad" ? "publicerad" : "dold";
  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("booking_reviews")
    .update({ status, published_at: status === "publicerad" ? new Date().toISOString() : null })
    .eq("id", reviewId);
  updateTag(REVIEWS_TAG);
  redirect(`/admin/omdomen?${error ? "fel=fel" : "ok=sparad"}`);
}

/**
 * "Be om omdöme": creates a review link for a completed job and emails it to the customer.
 * Only the SHA-256 hash of the link token is stored.
 */
export async function requestReviewAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const bookingId = id.parse(formData.get("bookingId"));
  const supabase = await createServerSupabase();
  const { data: b } = await supabase
    .from("bookings")
    .select("contact_name,contact_email,service_name,status")
    .eq("id", bookingId)
    .single();
  if (!b || !(DONE as readonly string[]).includes(b.status)) redirect(`/admin/bokningar/${bookingId}?fel=ogiltig`);
  const { token, hash } = createQuoteToken();
  const { error } = await supabase.from("bookings").update({ review_token_hash: hash }).eq("id", bookingId);
  if (error) redirect(`/admin/bokningar/${bookingId}?fel=fel`);
  const sent = await sendEmailSafe({
    to: b.contact_email,
    ...reviewRequest({
      name: b.contact_name.split(/\s+/)[0] ?? b.contact_name,
      serviceName: b.service_name,
      link: siteUrl(`/omdome/${token}`),
    }),
  });
  await supabase.from("booking_events").insert({
    booking_id: bookingId,
    actor: admin.email,
    kind: "review_requested",
    message: "Kunden ombads lämna ett omdöme",
  });
  redirect(`/admin/bokningar/${bookingId}?${sent ? "ok=skickad" : "fel=fel"}`);
}
