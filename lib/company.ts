/**
 * Company constants (SPEC §1). Import these instead of hard-coding the phone number, e-mail
 * or company name anywhere in the app.
 */

export const company = {
  brandName: "Nordvra",
  // TODO(före lansering): bolagets registrerade namn, t.ex. "Nordvra AB".
  legalName: "Nordvra",
  phoneDisplay: "072-222 88 00",
  phoneHref: "tel:+46722228800",
  email: "info@nordvra.se",
  emailHref: "mailto:info@nordvra.se",
  insurance: "If Skadeförsäkring",
  /** Customer-facing insurance copy. */
  insuranceCopy: "Försäkrade hos If",
  hasFSkatt: true,
  /** Customer-facing F-skatt copy. */
  fSkattCopy: "Godkänd för F-skatt",
  hometown: "Stockholm",
  coverage: "Hela Sverige",
  /** Version of Villkor/Integritetspolicy the customer accepts (stored with each request). */
  termsVersion: "2026-10-15",
} as const;

export type Company = typeof company;
