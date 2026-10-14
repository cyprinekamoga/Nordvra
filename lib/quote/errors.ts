import { company } from "@/lib/company";
import { fmt, t } from "@/lib/i18n";
import { FIELD, type FieldErrors } from "./form";

/**
 * Error codes raised by the accept_quote / decline_quote RPCs (SPEC §7) and how the quote page
 * answers them in Swedish. Pure; the raw database message is never shown or logged.
 */

export const RPC_ERROR_CODES = [
  "quote_not_found",
  "quote_not_open",
  "quote_expired",
  "invalid_buyers",
  "invalid_shares",
  "missing_consent",
  "missing_withdrawal_waiver",
  "missing_property",
  "buyers_exist",
] as const;

export type RpcErrorCode = (typeof RPC_ERROR_CODES)[number] | "other";

/** Finds the known code in an RPC error message ("other" when there is none). */
export function rpcErrorCode(message: string | null | undefined): RpcErrorCode {
  const text = message ?? "";
  // Longest first, so "missing_withdrawal_waiver" never matches as something shorter.
  const known = [...RPC_ERROR_CODES].sort((a, b) => b.length - a.length).find((code) => text.includes(code));
  return known ?? "other";
}

export interface RpcErrorAnswer {
  /** Show the page again (its state changed – expired, already answered …) instead of a message. */
  reload: boolean;
  message: string;
  fieldErrors: FieldErrors;
}

/** What the approval form shows for an accept_quote error. */
export function acceptErrorAnswer(code: RpcErrorCode): RpcErrorAnswer {
  const m = t.quote.submitErrors;
  const phone = company.phoneDisplay;
  switch (code) {
    case "quote_not_found":
      return { reload: false, message: fmt(m.notFound, { phone }), fieldErrors: {} };
    case "quote_expired":
    case "quote_not_open":
      return { reload: true, message: fmt(code === "quote_expired" ? m.expired : m.notOpen, { phone }), fieldErrors: {} };
    case "invalid_buyers":
      return { reload: false, message: m.invalidBuyers, fieldErrors: {} };
    case "invalid_shares":
      return { reload: false, message: m.invalidShares, fieldErrors: { [FIELD.shares]: m.invalidShares } };
    case "missing_consent":
      return { reload: false, message: m.missingConsent, fieldErrors: {} };
    case "missing_withdrawal_waiver":
      return {
        reload: false,
        message: m.missingWaiver,
        fieldErrors: { [FIELD.consentWaiver]: t.quote.errors.waiverConsent },
      };
    case "missing_property":
      return { reload: false, message: m.missingProperty, fieldErrors: {} };
    default:
      return { reload: false, message: fmt(m.generic, { phone }), fieldErrors: {} };
  }
}

/** What the decline panel shows for a decline_quote error. */
export function declineErrorAnswer(code: RpcErrorCode): RpcErrorAnswer {
  const m = t.quote.submitErrors;
  const phone = company.phoneDisplay;
  if (code === "quote_not_found") return { reload: false, message: fmt(m.notFound, { phone }), fieldErrors: {} };
  if (code === "quote_not_open") return { reload: true, message: fmt(m.notOpen, { phone }), fieldErrors: {} };
  return { reload: false, message: fmt(m.declineGeneric, { phone }), fieldErrors: {} };
}
