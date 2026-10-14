/**
 * Company constants (SPEC §1). Import these instead of hard-coding the phone number, e-mail
 * or company name anywhere in the app.
 */

/** Marker for values that must be filled in before launch. */
export const TODO_VALUE = "TODO" as const;

export const company = {
  brandName: "Nordvra",
  // TODO(före lansering): bolagets registrerade namn, t.ex. "Nordvra AB".
  legalName: "Nordvra",
  phoneDisplay: "076-113 43 84",
  phoneHref: "tel:+46761134384",
  email: "info@nordvra.se",
  emailHref: "mailto:info@nordvra.se",
  insurance: "If Skadeförsäkring",
  /** Customer-facing insurance copy. */
  insuranceCopy: "Försäkrade hos If",
  hasFSkatt: true,
  /** Customer-facing F-skatt copy. */
  fSkattCopy: "Godkänd för F-skatt",
  // TODO(före lansering): fyll i organisationsnummer och postadress.
  orgNr: TODO_VALUE as string,
  address: TODO_VALUE as string,
  hometown: "Stockholm",
  coverage: "Hela Sverige",
  /** Version of Villkor/Integritetspolicy the customer accepts (stored with each request). */
  termsVersion: "2026-10-13",
} as const;

export type Company = typeof company;

/** Rendered instead of values that are still TODO. */
export const PENDING_VALUE_TEXT = "(fylls i före lansering)";

/** True when a company value hasn't been filled in yet. */
export function isPending(value: string | null | undefined): boolean {
  return !value || value === TODO_VALUE;
}

/** The value, or "(fylls i före lansering)" while it is still TODO. */
export function displayValue(value: string | null | undefined): string {
  return isPending(value) ? PENDING_VALUE_TEXT : (value as string);
}

/** "Org.nr: (fylls i före lansering)" until the real number is filled in. */
export function orgNrLine(): string {
  return `Org.nr: ${displayValue(company.orgNr)}`;
}
