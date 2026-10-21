"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import { createServerSupabase } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";
import { siteUrl } from "@/lib/site";
import { createQuoteToken } from "@/lib/crypto/pii";
import { parseKrToOre } from "@/lib/format";
import { sendEmailSafe } from "@/lib/email";
import { bookingConfirmed, quoteSent } from "@/lib/email/templates";
import { sendSmsSafe } from "@/lib/sms";
import { bookingConfirmedSms, quoteSentSms, residentSms } from "@/lib/sms/templates";
import { BOOKING_STATUSES } from "@/lib/admin/filters";
import { Constants } from "@/lib/supabase/database.types";

export interface QuoteFormState {
  ok?: boolean;
  message?: string;
  /** Full customer link, shown once after sending (only the hash is stored). */
  link?: string;
}

const id = z.string().uuid();
const optionalDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .nullable()
  .catch(null);

function text(v: FormDataEntryValue | null): string | null {
  const s = typeof v === "string" ? v.trim() : "";
  return s === "" ? null : s;
}

function numberOrNull(v: FormDataEntryValue | null): number | null {
  const s = text(v);
  if (s === null) return null;
  const n = Number(s.replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function dbErrorMessage(error: { hint?: string | null; message: string }): string {
  if (error.hint === "partner_f_skatt" || /F-skatt/.test(error.message)) {
    return "Utföraren har inte verifierad F-skatt och kan inte tilldelas.";
  }
  if (error.hint === "partner_inactive") return "Utföraren är inaktiv.";
  return "Kunde inte spara. Kontrollera uppgifterna och försök igen.";
}

/** Saves the quote fields, and with intent=send also creates the link and notifies the customer. */
export async function saveQuoteAction(_prev: QuoteFormState, formData: FormData): Promise<QuoteFormState> {
  await requireAdmin();
  const bookingId = id.safeParse(formData.get("bookingId"));
  if (!bookingId.success) return { message: "Okänd bokning." };
  const intent = formData.get("intent") === "send" ? "send" : "save";

  const timeWindow = text(formData.get("scheduledTimeWindow"));
  const partnerId = text(formData.get("partnerId"));
  const update = {
    labour_ore: parseKrToOre(text(formData.get("labourKr"))),
    material_ore: parseKrToOre(text(formData.get("materialKr"))) ?? 0,
    travel_ore: parseKrToOre(text(formData.get("travelKr"))) ?? 0,
    hours: numberOrNull(formData.get("hours")),
    scheduled_date: optionalDate.parse(text(formData.get("scheduledDate"))),
    scheduled_time_window: (Constants.public.Enums.time_window as readonly string[]).includes(timeWindow ?? "")
      ? (timeWindow as (typeof Constants.public.Enums.time_window)[number])
      : null,
    partner_id: partnerId && id.safeParse(partnerId).success ? partnerId : null,
    commission_pct: numberOrNull(formData.get("commissionPct")),
    subcontractor_cost_ore: parseKrToOre(text(formData.get("subcontractorCostKr"))),
    quote_message: text(formData.get("quoteMessage"))?.slice(0, 2000) ?? null,
  };
  if (update.commission_pct !== null && update.commission_pct > 100) {
    return { message: "Provisionen måste vara mellan 0 och 100 %." };
  }

  const supabase = await createServerSupabase();
  const { data: booking, error } = await supabase
    .from("bookings")
    .update(update)
    .eq("id", bookingId.data)
    .select("id,booking_number,service_name,contact_name,contact_email,contact_phone,model,status")
    .single();
  if (error || !booking) return { message: error ? dbErrorMessage(error) : "Okänd bokning." };

  if (intent === "save") {
    refresh();
    return { ok: true, message: "Offerten är sparad (inte skickad)." };
  }

  if (update.labour_ore === null || update.labour_ore === 0) {
    return { message: "Ange arbetskostnaden innan du skickar offerten." };
  }
  if (!update.partner_id) {
    return { message: "Välj vem som utför arbetet innan du skickar offerten." };
  }
  if (!update.scheduled_date) {
    return { message: "Ange datum för arbetet innan du skickar offerten." };
  }

  // A re-sent quote starts fresh: buyers from an earlier approval are removed.
  await supabase.from("booking_buyers").delete().eq("booking_id", booking.id);

  const settings = await getSettings(supabase);
  const { token, hash } = createQuoteToken();
  const expiresAt = new Date(Date.now() + settings.quoteValidHours * 3_600_000).toISOString();
  const { error: sendError } = await supabase
    .from("bookings")
    .update({
      quote_token_hash: hash,
      quote_sent_at: new Date().toISOString(),
      quote_expires_at: expiresAt,
      status: "offert_skickad",
      approved_at: null,
      declined_at: null,
      decline_reason: null,
    })
    .eq("id", booking.id);
  if (sendError) return { message: dbErrorMessage(sendError) };

  await supabase.from("booking_events").insert({
    booking_id: booking.id,
    actor: (await requireAdmin()).email,
    kind: "quote_sent",
    message: "Offert skickad till kunden",
  });

  const link = siteUrl(`/offert/${token}`);
  await sendEmailSafe({
    to: booking.contact_email,
    ...quoteSent({
      name: booking.contact_name,
      bookingNumber: booking.booking_number,
      serviceName: booking.service_name,
      link,
      expiresAt,
    }),
  });
  await sendSmsSafe({
    to: booking.contact_phone,
    text: quoteSentSms({ bookingNumber: booking.booking_number, link, expiresAt }),
  });

  refresh();
  return {
    ok: true,
    message:
      "Offerten är skickad. E-post och SMS går via testleverantörer tills riktiga är inkopplade, så skicka gärna länken själv också.",
    link,
  };
}

async function backTo(bookingId: string, flash: string): Promise<never> {
  redirect(`/admin/bokningar/${bookingId}?${flash}`);
}

export async function setStatusAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const bookingId = id.parse(formData.get("bookingId"));
  const status = String(formData.get("status"));
  if (!(BOOKING_STATUSES as readonly string[]).includes(status)) return backTo(bookingId, "fel=ogiltig");
  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("bookings")
    .update({ status: status as (typeof BOOKING_STATUSES)[number] })
    .eq("id", bookingId);
  return backTo(bookingId, error ? "fel=fel" : "ok=sparad");
}

export async function addNoteAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const bookingId = id.parse(formData.get("bookingId"));
  const body = text(formData.get("body"))?.slice(0, 5000);
  if (!body) return backTo(bookingId, "fel=ogiltig");
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("booking_notes").insert({ booking_id: bookingId, author_email: admin.email, body });
  return backTo(bookingId, error ? "fel=fel" : "ok=sparad");
}

export async function saveClaimAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const bookingId = id.parse(formData.get("bookingId"));
  const method = text(formData.get("paymentMethod"));
  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("bookings")
    .update({
      completed_at: optionalDate.parse(text(formData.get("completedAt"))),
      invoice_number: text(formData.get("invoiceNumber"))?.slice(0, 100) ?? null,
      invoice_date: optionalDate.parse(text(formData.get("invoiceDate"))),
      paid_amount_ore: parseKrToOre(text(formData.get("paidKr"))),
      paid_at: optionalDate.parse(text(formData.get("paidAt"))),
      payment_method: method && ["kort", "swish", "overforing"].includes(method) ? method : null,
      claim_requested_ore: parseKrToOre(text(formData.get("claimRequestedKr"))),
      claim_requested_at: optionalDate.parse(text(formData.get("claimRequestedAt"))),
      claim_settled_at: optionalDate.parse(text(formData.get("claimSettledAt"))),
      claim_approved_ore: parseKrToOre(text(formData.get("claimApprovedKr"))),
    })
    .eq("id", bookingId);
  return backTo(bookingId, error ? "fel=fel" : "ok=sparad");
}

export async function sendConfirmationAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const bookingId = id.parse(formData.get("bookingId"));
  const supabase = await createServerSupabase();
  const { data: b } = await supabase
    .from("bookings")
    .select(
      "booking_number,service_name,contact_name,contact_email,contact_phone,scheduled_date,scheduled_time_window,resident_phone,partners(name)",
    )
    .eq("id", bookingId)
    .single();
  if (!b) return backTo(bookingId, "fel=fel");
  await sendEmailSafe({
    to: b.contact_email,
    ...bookingConfirmed({
      name: b.contact_name,
      bookingNumber: b.booking_number,
      serviceName: b.service_name,
      scheduledDate: b.scheduled_date,
      timeWindow: b.scheduled_time_window,
    }),
  });
  await sendSmsSafe({
    to: b.contact_phone,
    text: bookingConfirmedSms({
      bookingNumber: b.booking_number,
      scheduledDate: b.scheduled_date,
      timeWindow: b.scheduled_time_window,
    }),
  });
  // Booked by a relative: the person who lives there learns who is coming and when.
  if (b.resident_phone) {
    await sendSmsSafe({
      to: b.resident_phone,
      text: residentSms({
        serviceName: b.service_name,
        scheduledDate: b.scheduled_date,
        timeWindow: b.scheduled_time_window,
        partnerName: b.partners?.name ?? null,
      }),
    });
  }
  await supabase.from("booking_events").insert({
    booking_id: bookingId,
    actor: admin.email,
    kind: "confirmation_sent",
    message: "Bekräftelse skickad till kunden",
  });
  return backTo(bookingId, "ok=skickad");
}
