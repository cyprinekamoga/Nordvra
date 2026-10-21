"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import { sendEmailSafe } from "@/lib/email";
import { reminderDue } from "@/lib/email/templates";
import { PHOTO_BUCKET } from "@/lib/quote/photoUrl";
import { siteUrl } from "@/lib/site";
import { createServerSupabase } from "@/lib/supabase/server";

/**
 * Admin actions for the trust features: photo reports (the browser uploads the file to the
 * "fotorapporter" bucket with the admin's session, then this registers it) and reminders.
 */

const id = z.string().uuid();
const PHOTO_PATH_RE = /^([0-9a-f-]{36})\/[0-9a-f-]{36}\.(jpg|png|webp)$/;

function backTo(bookingId: string, flash: string): never {
  redirect(`/admin/bokningar/${bookingId}?${flash}`);
}

/** Registers an uploaded photo. The path must belong to this booking. */
export async function addPhotoAction(input: {
  bookingId: string;
  path: string;
  kind: "fore" | "efter";
  caption: string;
}): Promise<{ ok: boolean; message?: string }> {
  const admin = await requireAdmin();
  const bookingId = id.safeParse(input.bookingId);
  const match = PHOTO_PATH_RE.exec(input.path);
  if (!bookingId.success || !match || match[1] !== bookingId.data) return { ok: false, message: "Ogiltig bild." };
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("booking_photos").insert({
    booking_id: bookingId.data,
    path: input.path,
    kind: input.kind === "fore" ? "fore" : "efter",
    caption: input.caption.trim().slice(0, 200) || null,
    uploaded_by: admin.email,
  });
  if (error) {
    await supabase.storage.from(PHOTO_BUCKET).remove([input.path]);
    return { ok: false, message: "Bilden kunde inte sparas." };
  }
  await supabase.from("booking_events").insert({
    booking_id: bookingId.data,
    actor: admin.email,
    kind: "photo_added",
    message: "Bild tillagd i fotorapporten",
  });
  return { ok: true };
}

export async function deletePhotoAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const bookingId = id.parse(formData.get("bookingId"));
  const photoId = id.parse(formData.get("photoId"));
  const supabase = await createServerSupabase();
  const { data: photo } = await supabase
    .from("booking_photos")
    .select("path")
    .eq("id", photoId)
    .eq("booking_id", bookingId)
    .maybeSingle();
  if (!photo) backTo(bookingId, "fel=fel");
  await supabase.storage.from(PHOTO_BUCKET).remove([photo.path]);
  const { error } = await supabase.from("booking_photos").delete().eq("id", photoId);
  backTo(bookingId, error ? "fel=fel" : "ok=sparad");
}

/** Sends the "dags igen?" email the customer asked for and marks it as sent. */
export async function sendReminderAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const bookingId = id.parse(formData.get("bookingId"));
  const supabase = await createServerSupabase();
  const { data: b } = await supabase
    .from("bookings")
    .select("contact_name,contact_email,service_name,reminder_sent_at")
    .eq("id", bookingId)
    .single();
  if (!b) redirect("/admin?fel=fel");
  if (!b.reminder_sent_at) {
    const sent = await sendEmailSafe({
      to: b.contact_email,
      ...reminderDue({ name: b.contact_name, serviceName: b.service_name, link: siteUrl("/boka") }),
    });
    if (!sent) redirect("/admin?fel=fel");
    await supabase.from("bookings").update({ reminder_sent_at: new Date().toISOString() }).eq("id", bookingId);
    await supabase.from("booking_events").insert({
      booking_id: bookingId,
      actor: admin.email,
      kind: "reminder_sent",
      message: "Påminnelse skickad till kunden",
    });
  }
  redirect(formData.get("from") === "detail" ? `/admin/bokningar/${bookingId}?ok=skickad` : "/admin?ok=skickad");
}

/** Stops a reminder (the customer said no thanks). */
export async function cancelReminderAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const bookingId = id.parse(formData.get("bookingId"));
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("bookings").update({ remind_on: null }).eq("id", bookingId);
  if (!error) {
    await supabase.from("booking_events").insert({
      booking_id: bookingId,
      actor: admin.email,
      kind: "reminder_cancelled",
      message: "Påminnelsen togs bort",
    });
  }
  backTo(bookingId, error ? "fel=fel" : "ok=sparad");
}
