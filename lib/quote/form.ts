import { z } from "zod";
import { redactPersonnummer } from "@/lib/booking/schema";
import { fmt, t } from "@/lib/i18n";
import {
  calculatePrice,
  evenShares,
  sharesAreValid,
  type CapReason,
  type PriceLines,
} from "@/lib/pricing/calculate";
import type { DeductionType, TaxYearRules } from "@/lib/taxRules";
import {
  ageDuringYear,
  looksLikeFastighetsbeteckning,
  parseOrgNr,
  parsePersonnummer,
  type PersonnummerError,
} from "@/lib/validation/identity";
import { MAX_BUYERS, MIN_BUYERS, type PropertyKind } from "./quote";

/**
 * The approval form on the quote page: field names, parsing of FormData, validation with
 * Swedish messages, the per-buyer deduction preview and the accept_quote payload.
 *
 * Pure and safe in the browser (instant feedback) and on the server (validated again in
 * lib/quote/actions.ts). Encryption is passed in, so this module never imports the key.
 * Never log the input or the parsed personnummer.
 */

const e = t.quote.errors;

// ── Field names and ids ────────────────────────────────────────────────────────────────────

export const FIELD = {
  buyerCount: "buyer_count",
  buyerName: (i: number) => `buyers.${i}.name`,
  buyerPnr: (i: number) => `buyers.${i}.pnr`,
  buyerShare: (i: number) => `buyers.${i}.share`,
  shares: "shares",
  fastighetsbeteckning: "property.fastighetsbeteckning",
  brfOrgNr: "property.brf_org_nr",
  lagenhetsnummer: "property.lagenhetsnummer",
  consentDeduction: "consent.deduction",
  consentWaiver: "consent.withdrawal_waiver",
  consentTerms: "consent.terms",
} as const;

/** DOM id for a field name, e.g. "buyers.0.pnr" → "offert-buyers-0-pnr". */
export function fieldId(name: string): string {
  return `offert-${name.replace(/[^A-Za-z0-9]+/g, "-")}`;
}

/** Field name → Swedish error message. "shares" is the share total of all buyers. */
export type FieldErrors = Record<string, string>;

// ── Raw input ──────────────────────────────────────────────────────────────────────────────

export interface BuyerInput {
  name: string;
  pnr: string;
  /** As typed, e.g. "50". */
  share: string;
}

export interface ApprovalInput {
  buyers: BuyerInput[];
  property: { fastighetsbeteckning: string; brfOrgNr: string; lagenhetsnummer: string };
  consents: { deduction: boolean; withdrawalWaiver: boolean; terms: boolean };
}

const text = (max: number) => z.string().max(max).catch("");

/** Shape check of the raw form (lengths, counts). Semantic checks follow in validateApproval. */
export const approvalInputSchema = z.object({
  buyers: z
    .array(z.object({ name: text(200), pnr: text(40), share: text(10) }))
    .min(MIN_BUYERS)
    .max(MAX_BUYERS),
  property: z.object({
    fastighetsbeteckning: text(200),
    brfOrgNr: text(40),
    lagenhetsnummer: text(40),
  }),
  consents: z.object({ deduction: z.boolean(), withdrawalWaiver: z.boolean(), terms: z.boolean() }),
});

function formString(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function formChecked(formData: FormData, name: string): boolean {
  const value = formData.get(name);
  return typeof value === "string" && value !== "";
}

/** Reads the approval form. The buyer count comes from the hidden `buyer_count` field. */
export function approvalInputFromFormData(formData: FormData): ApprovalInput {
  const count = Number(formString(formData, FIELD.buyerCount));
  const n = Number.isInteger(count) ? Math.min(MAX_BUYERS + 1, Math.max(0, count)) : 0;
  const buyers: BuyerInput[] = Array.from({ length: n }, (_, i) => ({
    name: formString(formData, FIELD.buyerName(i)),
    pnr: formString(formData, FIELD.buyerPnr(i)),
    share: formString(formData, FIELD.buyerShare(i)),
  }));
  return {
    buyers,
    property: {
      fastighetsbeteckning: formString(formData, FIELD.fastighetsbeteckning),
      brfOrgNr: formString(formData, FIELD.brfOrgNr),
      lagenhetsnummer: formString(formData, FIELD.lagenhetsnummer),
    },
    consents: {
      deduction: formChecked(formData, FIELD.consentDeduction),
      withdrawalWaiver: formChecked(formData, FIELD.consentWaiver),
      terms: formChecked(formData, FIELD.consentTerms),
    },
  };
}

// ── Shares ─────────────────────────────────────────────────────────────────────────────────

/** "50" / " 50 % " → 50. Whole percent 1–100 only; anything else → null. */
export function parseShare(input: string): number | null {
  const cleaned = input.replace(/[\s%]/g, "");
  if (!/^\d{1,3}$/.test(cleaned)) return null;
  const n = Number(cleaned);
  return n >= 1 && n <= 100 ? n : null;
}

/** Sum of the shares that parse (invalid ones count as 0). */
export function sharesSum(buyers: readonly Pick<BuyerInput, "share">[]): number {
  return buyers.reduce((sum, b) => sum + (parseShare(b.share) ?? 0), 0);
}

/** Even split as form strings, e.g. 3 → ["34", "33", "33"]. */
export function evenShareStrings(count: number): string[] {
  return evenShares(count).map(String);
}

// ── Validation ─────────────────────────────────────────────────────────────────────────────

const PNR_MESSAGES: Record<PersonnummerError, string> = {
  format: e.pnrFormat,
  date: e.pnrDate,
  checksum: e.pnrChecksum,
};

/** Swedish message for a personnummer error code. */
export function personnummerMessage(error: PersonnummerError): string {
  return PNR_MESSAGES[error];
}

const NAME_MAX = 100;

/** Error for a full name, or null. Needs a first and a last name (letters). */
export function nameError(input: string): string | null {
  const name = input.trim().replace(/\s+/g, " ");
  if (name === "") return e.nameRequired;
  if (name.length > NAME_MAX) return e.nameTooLong;
  // Same rule as the database: a name never starts like a spreadsheet formula.
  if (/^[=+@-]/.test(name)) return e.nameFull;
  const parts = name.split(" ").filter((part) => /\p{L}/u.test(part));
  return parts.length >= 2 ? null : e.nameFull;
}

const LAGENHET_RE = /^[\p{L}\d]{1,10}$/u;

export interface ApprovalContext {
  /** Which ROT property fields are required (null = none). */
  propertyKind: PropertyKind | null;
  /** The job starts within the 14-day ångerfrist. */
  waiverRequired: boolean;
  /** "Today" for reading 10-digit personnummer (century). */
  today: Date;
}

export interface ValidBuyer {
  fullName: string;
  /** YYYYMMDDNNNN – encrypt before it leaves the server. */
  normalized: string;
  /** YYMMDD-XXXX. */
  masked: string;
  birthYear: number;
  sharePct: number;
}

export type RotPropertyPayload =
  | { fastighetsbeteckning: string }
  | { brf_org_nr: string; lagenhetsnummer: string };

export interface ValidApproval {
  buyers: ValidBuyer[];
  property: RotPropertyPayload | null;
  consents: { deduction: true; terms: true; withdrawalWaiver: boolean };
}

export type ApprovalResult = { ok: true; data: ValidApproval } | { ok: false; errors: FieldErrors };

/**
 * Validates the whole approval form. Returns all errors at once (keyed by field name) so the
 * form can show an error summary. The same function runs in the browser and on the server.
 */
export function validateApproval(raw: ApprovalInput, ctx: ApprovalContext): ApprovalResult {
  const shape = approvalInputSchema.safeParse(raw);
  if (!shape.success) return { ok: false, errors: { [FIELD.shares]: e.buyersCount } };
  const input = shape.data;
  const errors: FieldErrors = {};
  const buyers: ValidBuyer[] = [];
  const single = input.buyers.length === 1;
  const seen = new Map<string, number>();

  input.buyers.forEach((buyer, i) => {
    const nameMessage = nameError(buyer.name);
    if (nameMessage) errors[FIELD.buyerName(i)] = nameMessage;

    let pnr: ReturnType<typeof parsePersonnummer> | null = null;
    if (buyer.pnr.trim() === "") {
      errors[FIELD.buyerPnr(i)] = e.pnrRequired;
    } else {
      pnr = parsePersonnummer(buyer.pnr, ctx.today);
      if (!pnr.ok) {
        errors[FIELD.buyerPnr(i)] = personnummerMessage(pnr.error);
      } else if (seen.has(pnr.normalized)) {
        errors[FIELD.buyerPnr(i)] = fmt(e.pnrDuplicate, { n: (seen.get(pnr.normalized) ?? 0) + 1 });
      } else {
        seen.set(pnr.normalized, i);
      }
    }

    // One buyer always pays 100 %, whatever the (hidden) share field says.
    const share = single ? 100 : parseShare(buyer.share);
    if (share === null) {
      errors[FIELD.buyerShare(i)] = buyer.share.trim() === "" ? e.shareRequired : e.shareRange;
    }

    if (!nameMessage && pnr?.ok && share !== null && !errors[FIELD.buyerPnr(i)]) {
      buyers.push({
        fullName: buyer.name.trim().replace(/\s+/g, " "),
        normalized: pnr.normalized,
        masked: pnr.masked,
        birthYear: pnr.birthDate.year,
        sharePct: share,
      });
    }
  });

  if (!single) {
    const allParse = input.buyers.every((b) => parseShare(b.share) !== null);
    const sum = sharesSum(input.buyers);
    if (allParse && sum !== 100) errors[FIELD.shares] = fmt(e.sharesTotal, { sum });
  }

  let property: RotPropertyPayload | null = null;
  if (ctx.propertyKind === "fastighet") {
    const value = input.property.fastighetsbeteckning.trim().replace(/\s+/g, " ");
    if (value === "") errors[FIELD.fastighetsbeteckning] = e.fastighetRequired;
    else if (!looksLikeFastighetsbeteckning(value)) errors[FIELD.fastighetsbeteckning] = e.fastighetFormat;
    else property = { fastighetsbeteckning: value };
  } else if (ctx.propertyKind === "brf") {
    const orgInput = input.property.brfOrgNr.trim();
    const org = parseOrgNr(orgInput);
    if (orgInput === "") errors[FIELD.brfOrgNr] = e.brfRequired;
    else if (!org.ok) errors[FIELD.brfOrgNr] = e.brfInvalid;
    const lgh = input.property.lagenhetsnummer.trim().replace(/\s+/g, "");
    if (lgh === "") errors[FIELD.lagenhetsnummer] = e.lagenhetRequired;
    else if (!LAGENHET_RE.test(lgh)) errors[FIELD.lagenhetsnummer] = e.lagenhetInvalid;
    if (org.ok && !errors[FIELD.lagenhetsnummer]) {
      property = { brf_org_nr: org.normalized, lagenhetsnummer: lgh };
    }
  }

  if (!input.consents.deduction) errors[FIELD.consentDeduction] = e.deductionConsent;
  if (ctx.waiverRequired && !input.consents.withdrawalWaiver) errors[FIELD.consentWaiver] = e.waiverConsent;
  if (!input.consents.terms) errors[FIELD.consentTerms] = e.termsConsent;

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    data: {
      buyers,
      property,
      consents: {
        deduction: true,
        terms: true,
        withdrawalWaiver: ctx.waiverRequired ? true : input.consents.withdrawalWaiver,
      },
    },
  };
}

/** Field names in the order they appear on the page (for the error summary). */
export function fieldOrder(buyerCount: number): string[] {
  const names: string[] = [];
  for (let i = 0; i < buyerCount; i++) {
    names.push(FIELD.buyerName(i), FIELD.buyerPnr(i), FIELD.buyerShare(i));
  }
  names.push(
    FIELD.shares,
    FIELD.fastighetsbeteckning,
    FIELD.brfOrgNr,
    FIELD.lagenhetsnummer,
    FIELD.consentDeduction,
    FIELD.consentWaiver,
    FIELD.consentTerms,
  );
  return names;
}

/** Errors as [field, message] pairs in page order. */
export function orderedErrors(errors: FieldErrors, buyerCount: number): [string, string][] {
  const order = fieldOrder(buyerCount);
  const known = order.filter((name) => errors[name]).map((name) => [name, errors[name]] as [string, string]);
  const rest = Object.entries(errors).filter(([name]) => !order.includes(name));
  return [...known, ...rest];
}

// ── Age ────────────────────────────────────────────────────────────────────────────────────

/** True when the person turns less than `rules.minimumAge` (18) during the tax year. */
export function isUnderMinimumAge(birthYear: number, taxYear: number, rules: Pick<TaxYearRules, "minimumAge">): boolean {
  return ageDuringYear(birthYear, taxYear) < rules.minimumAge;
}

/** Birth year of a typed personnummer, or null while it isn't valid. Nothing else leaves here. */
export function birthYearOf(pnr: string, today: Date): number | null {
  if (pnr.trim() === "") return null;
  const parsed = parsePersonnummer(pnr, today);
  return parsed.ok ? parsed.birthDate.year : null;
}

// ── Per-buyer preview ──────────────────────────────────────────────────────────────────────

export interface PreviewRow {
  sharePct: number;
  deduction: number;
  cappedBy: CapReason | null;
  under18: boolean;
}

export type BuyerPreview =
  | { valid: false }
  | { valid: true; rows: PreviewRow[]; total: number; deduction: number; toPay: number };

/**
 * Deduction per buyer for the shares typed so far (via `calculatePrice`). Buyers who turn
 * under 18 during the tax year get no deduction. `valid: false` until the shares add up to 100.
 */
export function buyerPreview(params: {
  deductionType: DeductionType;
  lines: PriceLines;
  rules: TaxYearRules;
  eligible: boolean;
  labourShareOfTotal: number | null;
  taxYear: number;
  buyers: readonly { share: string; birthYear: number | null }[];
}): BuyerPreview {
  const { buyers } = params;
  const shares = buyers.length === 1 ? [100] : buyers.map((b) => parseShare(b.share));
  if (shares.some((s) => s === null)) return { valid: false };
  const priced = shares.map((sharePct) => ({ sharePct: sharePct as number }));
  if (!sharesAreValid(priced)) return { valid: false };

  const breakdown = calculatePrice({
    deductionType: params.deductionType,
    lines: params.lines,
    rules: params.rules,
    eligible: params.eligible,
    buyers: priced,
    labourShareOfTotal: params.labourShareOfTotal,
  });

  const rows: PreviewRow[] = breakdown.buyers.map((b, i) => {
    const birthYear = buyers[i]?.birthYear ?? null;
    const under18 = params.eligible && birthYear !== null && isUnderMinimumAge(birthYear, params.taxYear, params.rules);
    return {
      sharePct: b.sharePct,
      deduction: under18 ? 0 : b.deduction,
      cappedBy: under18 ? null : b.cappedBy,
      under18,
    };
  });
  const deduction = rows.reduce((sum, r) => sum + r.deduction, 0);
  return { valid: true, rows, total: breakdown.total, deduction, toPay: breakdown.total - deduction };
}

// ── accept_quote payload ───────────────────────────────────────────────────────────────────

export interface AcceptBuyerPayload {
  full_name: string;
  pnr_encrypted: string;
  pnr_masked: string;
  share_pct: number;
}

export interface AcceptPayload {
  p_buyers: AcceptBuyerPayload[];
  p_rot_property: RotPropertyPayload | null;
  p_consents: { deduction: boolean; terms: boolean; withdrawal_waiver: boolean };
}

/**
 * Arguments for the accept_quote RPC (without the token hash). The personnummer is encrypted
 * with `encrypt` (lib/crypto/pii.ts `encryptPII` on the server); only the ciphertext and the
 * masked form leave this function.
 */
export function buildAcceptPayload(data: ValidApproval, encrypt: (plaintext: string) => string): AcceptPayload {
  return {
    p_buyers: data.buyers.map((b) => ({
      full_name: b.fullName,
      pnr_encrypted: encrypt(b.normalized),
      pnr_masked: b.masked,
      share_pct: b.sharePct,
    })),
    p_rot_property: data.property,
    p_consents: {
      deduction: data.consents.deduction,
      terms: data.consents.terms,
      withdrawal_waiver: data.consents.withdrawalWaiver,
    },
  };
}

// ── Decline ────────────────────────────────────────────────────────────────────────────────

export const DECLINE_REASONS = ["too_expensive", "wrong_time", "found_other", "other"] as const;
export type DeclineReason = (typeof DECLINE_REASONS)[number];

export const DECLINE_FIELD = { reason: "reason", other: "reason_other" } as const;
export const DECLINE_OTHER_MAX = 300;

/**
 * The text stored as `decline_reason`, e.g. "För dyrt, Annat: Vi väntar till våren".
 * Unknown reason keys are ignored; the free text is only kept with "Annat", and anything that
 * looks like a personnummer is removed from it. Null when empty.
 */
export function declineReasonText(reasons: readonly string[], other: string): string | null {
  const labels = t.quote.decline.reasons;
  const chosen = DECLINE_REASONS.filter((r) => reasons.includes(r));
  const parts = chosen.map((r) => {
    if (r !== "other") return labels[r];
    const note = redactPersonnummer(other.slice(0, DECLINE_OTHER_MAX)).replace(/\s+/g, " ").trim();
    return note ? `${labels.other}: ${note}` : labels.other;
  });
  return parts.length > 0 ? parts.join(", ") : null;
}

// ── Server action state ────────────────────────────────────────────────────────────────────

/** State returned by the acceptQuote / declineQuote server actions (`useActionState`). */
export type QuoteActionState =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors: FieldErrors };

export const IDLE_STATE: QuoteActionState = { status: "idle" };

/** A server action already bound to the quote token. */
export type QuoteAction = (previous: QuoteActionState, formData: FormData) => Promise<QuoteActionState>;
