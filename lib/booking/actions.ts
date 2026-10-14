"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import { stockholmDate } from "@/components/ui/calendar-utils";
import { getCatalog } from "@/lib/catalog/load";
import { company } from "@/lib/company";
import { sendEmailSafe } from "@/lib/email";
import { ownerNewRequest, requestReceived } from "@/lib/email/templates";
import { fmt, t } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import { siteUrl } from "@/lib/site";
import { sendSmsSafe } from "@/lib/sms";
import { requestReceivedSms } from "@/lib/sms/templates";
import { createAnonClient } from "@/lib/supabase/anon";
import type { Json } from "@/lib/supabase/database.types";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  BOOKING_NUMBER_RE,
  contactInputFromFormData,
  requestDraftSchema,
  validateContact,
  type SubmitState,
} from "./schema";
import { STEP_SERVICE, STEP_WHEN, buildSubmitPayload, type SubmitRequestPayload } from "./state";

const m = t.booking.submitErrors;
const phone = company.phoneDisplay;

type RpcErrorCode = "rate_limited" | "date_in_past" | "unknown_service" | "other";

/** Maps a `submit_request` error message to a known code (the message is never logged). */
function rpcErrorCode(message: string | undefined): RpcErrorCode {
  const text = message ?? "";
  if (text.includes("rate_limited")) return "rate_limited";
  if (text.includes("date_in_past")) return "date_in_past";
  if (text.includes("unknown_service")) return "unknown_service";
  return "other";
}

function failure(message: string, step?: number): SubmitState {
  return { ok: false, message, fieldErrors: {}, ...(step ? { step } : {}) };
}

function parseDraftField(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.length > 20_000) return null;
  try {
    const parsed = requestDraftSchema.safeParse(JSON.parse(value));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/** Customer confirmation + owner notification. Never throws; logs only masked data. */
async function notify(payload: SubmitRequestPayload, bookingNumber: string, serviceName: string) {
  const customer = requestReceived({
    name: payload.contact_name,
    bookingNumber,
    serviceName,
    preferredDate: payload.preferred_date,
  });
  await sendEmailSafe({ to: payload.contact_email, ...customer });
  await sendSmsSafe({ to: payload.contact_phone, text: requestReceivedSms({ bookingNumber }) });

  // The settings row is admin-only under RLS; with the anon client this returns the defaults.
  const settings = await getSettings(createAnonClient());
  const owner = ownerNewRequest({
    bookingNumber,
    serviceName,
    postcode: payload.postcode,
    preferredDate: payload.preferred_date,
    adminUrl: siteUrl("/admin/bokningar"),
  });
  await sendEmailSafe({ to: settings.notificationEmail, ...owner });
}

/**
 * Sends the request from step 8 (`useActionState`). Validates everything again with zod,
 * recomputes eligibility and the estimate from the catalogue, calls the `submit_request` RPC,
 * schedules the emails and redirects to `/boka/klart?nr=…`. Returns Swedish error messages
 * when something is wrong. Form data is never logged.
 */
export async function submitRequest(_previous: SubmitState, formData: FormData): Promise<SubmitState> {
  const contact = validateContact(contactInputFromFormData(formData));
  if (!contact.ok) {
    return { ok: false, message: m.invalidForm, fieldErrors: contact.errors };
  }

  const draft = parseDraftField(formData.get("draft"));
  if (!draft) return failure(fmt(m.incomplete, { step: STEP_SERVICE }), STEP_SERVICE);

  const catalog = await getCatalog();
  const today = stockholmDate(new Date());
  const built = buildSubmitPayload({ draft, contact: contact.data, catalog, today });
  if (!built.ok) {
    return failure(fmt(m.incomplete, { step: built.step }), built.step);
  }

  if (!isSupabaseConfigured()) {
    console.warn("[booking] submit_request skipped: Supabase is not configured");
    return failure(fmt(m.notConfigured, { phone }));
  }

  let bookingNumber: string;
  try {
    const { data, error } = await createAnonClient().rpc("submit_request", {
      p: built.payload as unknown as Json,
    });
    if (error) {
      const code = rpcErrorCode(error.message);
      console.warn(`[booking] submit_request failed: ${code} (${error.code ?? "no code"})`);
      if (code === "rate_limited") return failure(fmt(m.rateLimited, { phone }));
      if (code === "date_in_past") return failure(m.dateInPast, STEP_WHEN);
      if (code === "unknown_service") return failure(fmt(m.unknownService, { phone }), STEP_SERVICE);
      return failure(fmt(m.generic, { phone }));
    }
    if (typeof data !== "string" || !BOOKING_NUMBER_RE.test(data)) {
      console.warn("[booking] submit_request returned an unexpected booking number");
      return failure(fmt(m.generic, { phone }));
    }
    bookingNumber = data;
  } catch (error) {
    const name = error instanceof Error ? error.name : "unknown";
    console.warn(`[booking] submit_request threw: ${name}`);
    return failure(fmt(m.generic, { phone }));
  }

  // Emails/SMS go out after the response so a slow provider never delays or breaks the booking.
  const payload = built.payload;
  const serviceName = built.service.name;
  after(async () => {
    try {
      await notify(payload, bookingNumber, serviceName);
    } catch (error) {
      const name = error instanceof Error ? error.name : "unknown";
      console.warn(`[booking] notification failed: ${name}`);
    }
  });

  redirect(`/boka/klart?nr=${encodeURIComponent(bookingNumber)}`);
}
