"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import { stockholmDate } from "@/components/ui/calendar-utils";
import { company } from "@/lib/company";
import { encryptPII, hashToken, isEncryptionConfigured } from "@/lib/crypto/pii";
import { sendEmailSafe } from "@/lib/email";
import { ownerQuoteAnswered, ownerRedoRequested } from "@/lib/email/templates";
import { fmt, t } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import { siteUrl } from "@/lib/site";
import { createAnonClient } from "@/lib/supabase/anon";
import type { Json } from "@/lib/supabase/database.types";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { acceptErrorAnswer, declineErrorAnswer, rpcErrorCode } from "./errors";
import {
  DECLINE_FIELD,
  approvalInputFromFormData,
  buildAcceptPayload,
  declineReasonText,
  validateApproval,
  type AcceptPayload,
  type QuoteActionState,
} from "./form";
import { loadQuote } from "./load";
import { isPlausibleToken, propertyKind, quoteView, withdrawalWaiverRequired } from "./quote";

/**
 * Server actions for the quote page. Both are bound to the link token on the page
 * (`acceptQuote.bind(null, token)`) and used with `useActionState`.
 *
 * Privacy: form data, personnummer, names and the token are never logged. Personnummer are
 * encrypted (AES-256-GCM) here, before anything is sent to the database; only the ciphertext
 * and the masked form "YYMMDD-XXXX" leave the server. Emails never contain personnummer.
 *
 * Emails: the owner gets `ownerQuoteAnswered` at the notification address. The customer's
 * `bookingConfirmed` email is NOT sent from here, because `get_quote` (the only data the
 * anonymous page may read) does not return the customer's e-mail address. The owner sends the
 * confirmation from the admin booking page ("Skicka bekräftelse"), which the owner email asks for.
 */

const m = t.quote.submitErrors;
const phone = company.phoneDisplay;

function quotePath(token: string): string {
  return `/offert/${encodeURIComponent(token)}`;
}

function failure(message: string, fieldErrors: Record<string, string> = {}): QuoteActionState {
  return { status: "error", message, fieldErrors };
}

function errorName(error: unknown): string {
  return error instanceof Error ? error.name : "unknown";
}

/** Owner notification (settings address, else the company address). Never throws. */
async function notifyOwner(bookingNumber: string, accepted: boolean): Promise<void> {
  try {
    // The settings row is admin-only under RLS; with the anon client this returns the defaults.
    const settings = await getSettings(createAnonClient());
    const to = settings.notificationEmail || company.email;
    const email = ownerQuoteAnswered({ bookingNumber, accepted, adminUrl: siteUrl("/admin/bokningar") });
    await sendEmailSafe({ to, ...email });
  } catch (error) {
    console.warn(`[quote] owner notification failed: ${errorName(error)}`);
  }
}

/** "Godkänn och boka": validates, encrypts the personnummer and calls accept_quote. */
export async function acceptQuote(
  token: string,
  _previous: QuoteActionState,
  formData: FormData,
): Promise<QuoteActionState> {
  if (!isPlausibleToken(token)) return failure(fmt(m.notFound, { phone }));
  if (!isSupabaseConfigured()) {
    console.warn("[quote] accept_quote skipped: Supabase is not configured");
    return failure(fmt(m.notConfigured, { phone }));
  }
  if (!isEncryptionConfigured()) {
    console.warn("[quote] accept_quote skipped: PII_ENCRYPTION_KEY is not configured");
    return failure(fmt(m.notConfigured, { phone }));
  }

  // Fresh read: the status, the job date and the property rules decide what is required.
  const lookup = await loadQuote(token);
  if (lookup.kind === "notFound") return failure(fmt(m.notFound, { phone }));
  if (lookup.kind === "unavailable") return failure(fmt(m.generic, { phone }));
  const { quote, tokenHash } = lookup;

  const now = new Date();
  const today = stockholmDate(now);
  // Expired, already approved or declined: show the page in its current state.
  if (quoteView(quote, now) !== "open") redirect(quotePath(token));

  const result = validateApproval(approvalInputFromFormData(formData), {
    propertyKind: propertyKind(quote),
    waiverRequired: withdrawalWaiverRequired(quote.scheduledDate, today),
    today: now,
  });
  if (!result.ok) return failure(m.invalidForm, result.errors);

  let payload: AcceptPayload;
  try {
    payload = buildAcceptPayload(result.data, encryptPII);
  } catch (error) {
    console.warn(`[quote] encryption failed: ${errorName(error)}`);
    return failure(fmt(m.generic, { phone }));
  }

  let bookingNumber = quote.bookingNumber;
  let reload = false;
  try {
    const { data, error } = await createAnonClient().rpc("accept_quote", {
      p_token_hash: tokenHash,
      p_buyers: payload.p_buyers as unknown as Json,
      p_rot_property: payload.p_rot_property as unknown as Json,
      p_consents: payload.p_consents as unknown as Json,
    });
    if (error) {
      const code = rpcErrorCode(error.message);
      console.warn(`[quote] accept_quote failed: ${code} (${error.code ?? "no code"})`);
      const answer = acceptErrorAnswer(code);
      if (!answer.reload) return failure(answer.message, answer.fieldErrors);
      reload = true;
    } else if (typeof data === "string" && data.trim() !== "") {
      bookingNumber = data.trim();
    }
  } catch (error) {
    console.warn(`[quote] accept_quote threw: ${errorName(error)}`);
    return failure(fmt(m.generic, { phone }));
  }

  if (!reload) {
    // After the response, so a slow email provider never delays or breaks the booking.
    after(() => notifyOwner(bookingNumber, true));
  }
  // Same URL: the page now renders the approved (or expired/answered) state.
  redirect(quotePath(token));
}

/** "Nej tack" → "Ja, tacka nej": stores the optional reason and calls decline_quote. */
export async function declineQuote(
  token: string,
  _previous: QuoteActionState,
  formData: FormData,
): Promise<QuoteActionState> {
  if (!isPlausibleToken(token)) return failure(fmt(m.notFound, { phone }));
  if (!isSupabaseConfigured()) {
    console.warn("[quote] decline_quote skipped: Supabase is not configured");
    return failure(fmt(m.notConfigured, { phone }));
  }

  const reasons = formData.getAll(DECLINE_FIELD.reason).filter((v): v is string => typeof v === "string");
  const other = formData.get(DECLINE_FIELD.other);
  const reason = declineReasonText(reasons, typeof other === "string" ? other : "");

  let bookingNumber: string | null = null;
  let reload = false;
  try {
    const { data, error } = await createAnonClient().rpc("decline_quote", {
      p_token_hash: hashToken(token),
      p_reason: reason ?? "",
    });
    if (error) {
      const code = rpcErrorCode(error.message);
      console.warn(`[quote] decline_quote failed: ${code} (${error.code ?? "no code"})`);
      const answer = declineErrorAnswer(code);
      if (!answer.reload) return failure(answer.message);
      reload = true;
    } else if (typeof data === "string" && data.trim() !== "") {
      bookingNumber = data.trim();
    }
  } catch (error) {
    console.warn(`[quote] decline_quote threw: ${errorName(error)}`);
    return failure(fmt(m.declineGeneric, { phone }));
  }

  if (!reload && bookingNumber) {
    const number = bookingNumber;
    after(() => notifyOwner(number, false));
  }
  redirect(quotePath(token));
}

/** Owner notification for a re-clean request. Never throws. */
async function notifyOwnerRedo(bookingNumber: string): Promise<void> {
  try {
    const settings = await getSettings(createAnonClient());
    const to = settings.notificationEmail || company.email;
    await sendEmailSafe({ to, ...ownerRedoRequested({ bookingNumber, adminUrl: siteUrl("/admin/bokningar") }) });
  } catch (error) {
    console.warn(`[quote] redo notification failed: ${errorName(error)}`);
  }
}

/** "Anmäl omstädning" (besiktningsgaranti): calls request_redo and tells the owner. */
export async function requestRedo(
  token: string,
  _previous: QuoteActionState,
  formData: FormData,
): Promise<QuoteActionState> {
  const r = t.quote.booking.redo;
  if (!isPlausibleToken(token)) return failure(fmt(m.notFound, { phone }));
  if (!isSupabaseConfigured()) return failure(fmt(m.notConfigured, { phone }));

  const raw = formData.get("message");
  const message = typeof raw === "string" ? raw.trim().slice(0, 2000) : "";
  let bookingNumber: string | null = null;
  try {
    const { data, error } = await createAnonClient().rpc("request_redo", {
      p_token_hash: hashToken(token),
      p_message: message,
    });
    if (error) {
      const known = /redo_not_available|redo_already_requested|quote_not_found/.exec(error.message)?.[0] ?? "other";
      console.warn(`[quote] request_redo failed: ${known}`);
      // Already requested: the page shows that state.
      if (known !== "redo_already_requested") {
        return failure(fmt(known === "other" ? r.errorGeneric : r.errorNotAvailable, { phone }));
      }
    } else {
      bookingNumber = typeof data === "string" ? data : null;
    }
  } catch (error) {
    console.warn(`[quote] request_redo threw: ${errorName(error)}`);
    return failure(fmt(r.errorGeneric, { phone }));
  }

  if (bookingNumber) {
    const number = bookingNumber;
    after(() => notifyOwnerRedo(number));
  }
  redirect(quotePath(token));
}
