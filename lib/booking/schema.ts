import { z } from "zod";
import { FREQUENCIES, HOUSING_TYPES, SIZE_BANDS, TIME_WINDOWS } from "@/lib/catalog/types";
import { t } from "@/lib/i18n";
import { normalizePhone, parsePersonnummer } from "@/lib/validation/identity";

/**
 * Zod schemas for the request flow, shared by the browser (sessionStorage draft, inline
 * validation) and the server action (which validates everything again).
 *
 * Personnummer is never part of a request: the draft has no such field (unknown keys are
 * stripped) and the free-text note rejects anything that looks like one.
 */

const e = t.booking.errors;

/** Appliance keys for "Reparation av vitvaror" (labels in `t.booking.appliances`). */
export const APPLIANCES = [
  "tvattmaskin",
  "torktumlare",
  "diskmaskin",
  "kyl",
  "frys",
  "ugn",
  "spis",
  "koksflakt",
] as const;
export type Appliance = (typeof APPLIANCES)[number];

export const USED_THIS_YEAR = ["ja", "nej", "vet_inte"] as const;
export const INSPECTION_CHOICES = ["date", "unknown"] as const;
export type InspectionChoice = (typeof INSPECTION_CHOICES)[number];

/** Limits used by the steppers and validated again on the server. */
export const FLOORS_MIN = 1;
export const FLOORS_MAX = 5;
export const WINDOWS_MIN = 1;
export const WINDOWS_MAX = 60;
export const NOTE_MAX = 2000;

export const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
/** Same rule as the `bookings.contact_email` check constraint. */
export const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
export const BOOKING_NUMBER_RE = /^NV-\d{4}-\d{5}$/;

const isoDate = z.string().regex(ISO_DATE_RE);
const catalogId = z.string().min(1).max(100);

export const eligibilityAnswersSchema = z.object({
  age18: z.boolean().optional(),
  taxSweden: z.boolean().optional(),
  rutResidence: z.boolean().optional(),
  rotOwner: z.boolean().optional(),
  rotBuildingOver5: z.boolean().optional(),
  buyerCount: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
  usedThisYear: z.enum(USED_THIS_YEAR).optional(),
});

/** Contact fields as typed (step 8). Stored in the draft so going back never loses them. */
export const contactDraftSchema = z.object({
  name: z.string().max(200).optional(),
  phone: z.string().max(40).optional(),
  email: z.string().max(254).optional(),
  street: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  note: z.string().max(NOTE_MAX).optional(),
});
export type ContactDraft = z.infer<typeof contactDraftSchema>;

/**
 * Everything the customer has answered so far. All fields are optional because the draft is
 * saved after every click; `lib/booking/state.ts` decides which answers each step requires.
 */
export const requestDraftSchema = z.object({
  categoryId: catalogId.optional(),
  serviceId: catalogId.optional(),
  housingType: z.enum(HOUSING_TYPES).optional(),
  sizeBand: z.enum(SIZE_BANDS).optional(),
  floors: z.number().int().min(FLOORS_MIN).max(FLOORS_MAX).optional(),
  pets: z.boolean().optional(),
  addonIds: z.array(catalogId).max(50).default([]),
  windows: z.number().int().min(WINDOWS_MIN).max(WINDOWS_MAX).optional(),
  frequency: z.enum(FREQUENCIES).optional(),
  appliances: z.array(z.enum(APPLIANCES)).max(APPLIANCES.length).default([]),
  preferredDate: isoDate.optional(),
  timeWindow: z.enum(TIME_WINDOWS).optional(),
  inspection: z.enum(INSPECTION_CHOICES).optional(),
  inspectionDate: isoDate.optional(),
  flexible: z.boolean().default(false),
  /** Digits only; may be incomplete while the customer types. */
  postcode: z.string().regex(/^\d{0,5}$/).optional(),
  eligibility: eligibilityAnswersSchema.default({}),
  contact: contactDraftSchema.default({}),
});
export type RequestDraft = z.infer<typeof requestDraftSchema>;

/** What sessionStorage holds: a versioned envelope around the draft. */
export const storedDraftSchema = z.object({
  v: z.literal(1),
  draft: requestDraftSchema,
});

// ---------------------------------------------------------------------------------------------
// Personnummer guard for free text

/**
 * Candidates that look like a personnummer: YYMMDD-NNNN / YYMMDD+NNNN, or 12 digits starting
 * with 19/20 (optionally with a hyphen). Ten digits without a separator are left alone because
 * they are usually phone numbers.
 */
const PNR_CANDIDATE = /(?<!\d)(?:\d{6}[-+]\d{4}|(?:19|20)\d{6}-?\d{4})(?!\d)/g;

/** True when the text contains a valid personnummer/samordningsnummer (date + checksum). */
export function containsPersonnummer(text: string | null | undefined): boolean {
  if (!text) return false;
  for (const match of text.matchAll(PNR_CANDIDATE)) {
    if (parsePersonnummer(match[0]).ok) return true;
  }
  return false;
}

/** Replaces anything that looks like a valid personnummer (used before writing to storage). */
export function redactPersonnummer(text: string): string {
  return text.replace(PNR_CANDIDATE, (match) => (parsePersonnummer(match).ok ? "" : match));
}

// ---------------------------------------------------------------------------------------------
// Contact form (step 8) – the server validates exactly the same rules

export const CONTACT_FIELDS = [
  "name",
  "phone",
  "email",
  "street",
  "postcode",
  "city",
  "note",
  "acceptTerms",
] as const;
export type ContactField = (typeof CONTACT_FIELDS)[number];

export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { error: e.nameRequired })
    .max(200, { error: e.nameTooLong }),
  phone: z
    .string()
    .trim()
    .refine((value) => normalizePhone(value) !== null, { error: e.phoneInvalid })
    .transform((value) => normalizePhone(value) ?? value),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(254, { error: e.emailInvalid })
    .regex(EMAIL_RE, { error: e.emailInvalid }),
  street: z
    .string()
    .trim()
    .min(2, { error: e.streetRequired })
    .max(200, { error: e.streetTooLong }),
  postcode: z
    .string()
    .transform((value) => value.replace(/\s/g, ""))
    .pipe(z.string().regex(/^\d{5}$/, { error: e.postcodeInvalid })),
  city: z
    .string()
    .trim()
    .min(2, { error: e.cityRequired })
    .max(100, { error: e.cityTooLong }),
  note: z
    .string()
    .trim()
    .max(NOTE_MAX, { error: e.noteTooLong })
    .refine((value) => !containsPersonnummer(value), { error: e.notePersonnummer }),
  acceptTerms: z.literal(true, { error: e.termsRequired }),
});
/** Raw values from the form (the terms box may still be unticked). */
export type ContactFormValues = Omit<z.input<typeof contactSchema>, "acceptTerms"> & {
  acceptTerms: boolean;
};
export type Contact = z.output<typeof contactSchema>;

export type ContactErrors = Partial<Record<ContactField, string>>;

/** First error message per field, in field order. */
export function contactErrors(error: z.ZodError): ContactErrors {
  const out: ContactErrors = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && (CONTACT_FIELDS as readonly string[]).includes(field)) {
      const key = field as ContactField;
      out[key] ??= issue.message;
    }
  }
  return out;
}

/** Validates the step 8 fields. Never logs or echoes the values. */
export function validateContact(
  input: ContactFormValues,
): { ok: true; data: Contact } | { ok: false; errors: ContactErrors } {
  const result = contactSchema.safeParse(input);
  return result.success ? { ok: true, data: result.data } : { ok: false, errors: contactErrors(result.error) };
}

/** Reads the step 8 fields from a submitted form. */
export function contactInputFromFormData(formData: FormData): ContactFormValues {
  const text = (name: string) => {
    const value = formData.get(name);
    return typeof value === "string" ? value : "";
  };
  return {
    name: text("name"),
    phone: text("phone"),
    email: text("email"),
    street: text("street"),
    postcode: text("postcode"),
    city: text("city"),
    note: text("note"),
    acceptTerms: formData.get("acceptTerms") === "on",
  };
}

// ---------------------------------------------------------------------------------------------
// Server action result

/** Returned by `submitRequest` when the request was not sent (success redirects instead). */
export type SubmitState = {
  ok: false;
  /** Swedish message for the error summary (null when only field errors). */
  message: string | null;
  fieldErrors: ContactErrors;
  /** Step the customer should go back to, when the problem is in an earlier step. */
  step?: number;
} | null;
