/**
 * Swedish personnummer / samordningsnummer and organisationsnummer checks.
 * Pure functions – safe to use in the browser for instant feedback and again on the server.
 * Never log the input or the result of these functions.
 */

export function luhnValid(digits: string): boolean {
  if (!/^\d+$/.test(digits)) return false;
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

export type PersonnummerError = "format" | "date" | "checksum";

export type PersonnummerResult =
  | {
      ok: true;
      /** YYYYMMDDNNNN – the only form we store (encrypted). */
      normalized: string;
      /** YYMMDD-XXXX – safe to show in lists. */
      masked: string;
      birthDate: { year: number; month: number; day: number };
      isSamordningsnummer: boolean;
    }
  | { ok: false; error: PersonnummerError };

function validDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1) return false;
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day;
}

/**
 * Accepts YYYYMMDD-NNNN, YYYYMMDDNNNN, YYMMDD-NNNN, YYMMDDNNNN and YYMMDD+NNNN (100+ years).
 */
export function parsePersonnummer(input: string, today: Date = new Date()): PersonnummerResult {
  const raw = input.trim().replace(/\s/g, "");
  const m = raw.match(/^(\d{2})?(\d{2})(\d{2})(\d{2})([-+]?)(\d{4})$/);
  if (!m) return { ok: false, error: "format" };
  const [, century, yy, mm, dd, sep, last4] = m;

  let fullYear: number;
  if (century) {
    fullYear = Number(century + yy);
  } else {
    // Most recent century in which the birth date is not in the future.
    const thisYear = today.getFullYear();
    let candidate = Math.floor(thisYear / 100) * 100 + Number(yy);
    const dayOfMonth = Number(dd) > 60 ? Number(dd) - 60 : Number(dd);
    const birth = Date.UTC(candidate, Number(mm) - 1, dayOfMonth);
    if (birth > today.getTime()) candidate -= 100;
    if (sep === "+") candidate -= 100;
    fullYear = candidate;
  }

  const month = Number(mm);
  let day = Number(dd);
  const isSamordningsnummer = day > 60;
  if (isSamordningsnummer) day -= 60;

  if (!validDate(fullYear, month, day)) return { ok: false, error: "date" };
  if (!luhnValid(`${yy}${mm}${dd}${last4}`)) return { ok: false, error: "checksum" };

  return {
    ok: true,
    normalized: `${fullYear}${mm}${dd}${last4}`,
    masked: `${yy}${mm}${dd}-XXXX`,
    birthDate: { year: fullYear, month, day },
    isSamordningsnummer,
  };
}

/** Age the person turns during `year` (RUT/ROT requires 18 during the income year). */
export function ageDuringYear(birthYear: number, year: number): number {
  return year - birthYear;
}

/** 10-digit organisationsnummer (e.g. a bostadsrättsförening), with or without hyphen. */
export function parseOrgNr(input: string): { ok: true; normalized: string } | { ok: false } {
  const digits = input.trim().replace(/[\s-]/g, "");
  if (!/^\d{10}$/.test(digits)) return { ok: false };
  if (Number(digits[2]) < 2) return { ok: false };
  if (!luhnValid(digits)) return { ok: false };
  return { ok: true, normalized: `${digits.slice(0, 6)}-${digits.slice(6)}` };
}

/**
 * Fastighetsbeteckning, e.g. "Nacka Sicklaön 123:4". We only check the shape
 * (name + block:unit); the exact designation is verified when the claim is filed.
 */
export function looksLikeFastighetsbeteckning(input: string): boolean {
  return /^[\p{L}][\p{L}\s.-]+\s\d+:\d+$/u.test(input.trim());
}

/** Swedish phone number: 07X…, +46…, 0X… – digits, spaces and dashes allowed. */
export function normalizePhone(input: string): string | null {
  const cleaned = input.replace(/[\s()-]/g, "");
  if (/^\+46\d{7,10}$/.test(cleaned)) return cleaned;
  if (/^0\d{6,10}$/.test(cleaned)) return `+46${cleaned.slice(1)}`;
  return null;
}

export function isPostcode(input: string): boolean {
  return /^\d{5}$/.test(input.replace(/\s/g, ""));
}
