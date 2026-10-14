import { company } from "@/lib/company";
import { fmt, t } from "@/lib/i18n";
import type { DeductionType } from "@/lib/taxRules";
import type { QuoteData } from "./quote";

function capitalize(text: string): string {
  return text.charAt(0).toLocaleUpperCase("sv-SE") + text.slice(1);
}

/** "RUT-avdrag" / "ROT-avdrag". */
export function deductionName(type: DeductionType): string {
  return type === "rut" ? t.common.deduction.rutDeduction : t.common.deduction.rotDeduction;
}

/** "RUT-avdrag 50 %" / "ROT-avdrag 30 %" (never "halva priset"). */
export function deductionLabel(type: DeductionType, ratePct: number): string {
  return fmt(t.common.price.deduction, { type: t.common.deduction[type], rate: ratePct });
}

export interface CounterpartyText {
  /** "Avtalspart: …" */
  headline: string;
  /** Who does the work / invoices / applies for the deduction, and where to complain. */
  lines: string[];
}

/**
 * The "Avtalspart" block (SPEC §2, §5.8). Seller model: Nordvra is the counterparty
 * (+ the subcontractor's name when a partner does the job). Agent model: the partner is the
 * counterparty, "förmedlat av Nordvra", and invoices and applies for the deduction.
 */
export function counterpartyText(
  quote: Pick<QuoteData, "model" | "partnerName" | "partnerOrgNr" | "deductionType" | "eligibility">,
): CounterpartyText {
  const c = t.quote.counterparty;
  const legal = t.common.legal.counterparty;
  const deduction = deductionName(quote.deductionType);
  const withDeduction = quote.eligibility.eligible;

  if (quote.model === "seller") {
    const lines: string[] = [];
    if (quote.partnerName) lines.push(fmt(c.subcontractor, { partner: quote.partnerName }));
    lines.push(withDeduction ? fmt(c.sellerInvoice, { deduction }) : c.sellerInvoiceNoDeduction);
    lines.push(legal.complaint);
    return { headline: fmt(legal.seller, { legalName: company.legalName }), lines };
  }

  const partner = quote.partnerName ?? c.partnerFallback;
  const orgNr = quote.partnerOrgNr ?? c.orgNrMissing;
  return {
    headline: fmt(legal.agent, { partner, orgNr }),
    lines: [
      capitalize(
        withDeduction ? fmt(c.agentInvoice, { partner, deduction }) : fmt(c.agentInvoiceNoDeduction, { partner }),
      ),
      fmt(c.agentComplaint, { partner }),
    ],
  };
}
