import type { Tables } from "@/lib/supabase/database.types";

export type PartnerRow = Tables<"partners">;

export interface PartnerOption {
  partner: PartnerRow;
  matches: boolean;
  /** Why the partner can't be assigned, or null when it can. */
  blockedReason: string | null;
}

/** A partner covers a postcode when it lists no prefixes (all of Sweden) or one prefix matches. */
export function coversPostcode(partner: Pick<PartnerRow, "postcode_prefixes">, postcode: string): boolean {
  const prefixes = partner.postcode_prefixes.filter(Boolean);
  if (prefixes.length === 0) return true;
  return prefixes.some((p) => postcode.startsWith(p));
}

export function assignBlockedReason(
  partner: Pick<PartnerRow, "active" | "f_skatt_verified">,
): string | null {
  if (!partner.active) return "Inaktiv";
  if (!partner.f_skatt_verified) return "F-skatt ej verifierad";
  return null;
}

/**
 * Partners for the booking's partner picker: matching ones (offers the service and covers the
 * postcode) first, then the rest; each with the reason it can't be assigned, if any.
 */
export function rankPartners(partners: PartnerRow[], serviceId: string, postcode: string): PartnerOption[] {
  return partners
    .map((partner) => ({
      partner,
      matches: partner.service_ids.includes(serviceId) && coversPostcode(partner, postcode),
      blockedReason: assignBlockedReason(partner),
    }))
    .sort((a, b) => {
      if (a.matches !== b.matches) return a.matches ? -1 : 1;
      if (!a.blockedReason !== !b.blockedReason) return a.blockedReason ? 1 : -1;
      return (b.partner.rating ?? 0) - (a.partner.rating ?? 0) || a.partner.name.localeCompare(b.partner.name, "sv");
    });
}

/** "63, 64 1" → ["63", "641"]: digits only, 1–5 long, unique. */
export function parsePostcodePrefixes(input: string): string[] {
  const out = input
    .split(/[,;\n]/)
    .map((s) => s.replace(/\D/g, ""))
    .filter((s) => s.length >= 1 && s.length <= 5);
  return [...new Set(out)];
}

export const SWEDISH_COUNTIES = [
  "Blekinge län",
  "Dalarnas län",
  "Gotlands län",
  "Gävleborgs län",
  "Hallands län",
  "Jämtlands län",
  "Jönköpings län",
  "Kalmar län",
  "Kronobergs län",
  "Norrbottens län",
  "Skåne län",
  "Stockholms län",
  "Södermanlands län",
  "Uppsala län",
  "Värmlands län",
  "Västerbottens län",
  "Västernorrlands län",
  "Västmanlands län",
  "Västra Götalands län",
  "Örebro län",
  "Östergötlands län",
] as const;
