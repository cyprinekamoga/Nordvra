import "server-only";

/*
 * Betalning för RUT/ROT: köparen måste själv betala, och betalningen måste ske elektroniskt.
 * Nordvra tar bara betalt mot faktura, med Swish eller banköverföring (inget kort, ingen
 * onlinebetalning). "kort" finns kvar som typ bara för äldre bokningar. Kontant betalning, eller betalning från någon annan än den
 * som ska få avdraget, gör att Skatteverket nekar avdraget. Därför stödjer vi bara elektroniska
 * betalsätt och sparar alltid betalsätt, belopp och datum på bokningen.
 *
 * Payments: only the seller model (Nordvra invoices) takes payment through us; in the
 * agent model (ROT) the partner invoices the customer directly.
 */

export type PaymentMethod = "swish" | "kort" | "overforing";
export type PaymentStatus = "manual" | "pending" | "paid" | "failed";

export type PaymentRequest = {
  bookingNumber: string;
  /** Amount the customer pays (after deduction), öre incl. VAT. */
  amountOre: number;
  method: PaymentMethod;
  /** Swish only: the buyer's own number (+46…). Never logged. */
  payerPhone?: string;
};

export type PaymentResult = { status: PaymentStatus; reference?: string };

export interface PaymentProvider {
  createPaymentRequest(req: PaymentRequest): Promise<PaymentResult>;
  getStatus(reference: string): Promise<PaymentResult>;
}

export const PAYMENT_METHODS: readonly PaymentMethod[] = ["swish", "kort", "overforing"];

/** Swedish labels for admin forms and exports. */
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  swish: "Swish",
  kort: "Kort",
  overforing: "Banköverföring",
};

export function isPaymentMethod(value: unknown): value is PaymentMethod {
  return typeof value === "string" && (PAYMENT_METHODS as readonly string[]).includes(value);
}

/**
 * Placeholder: no money moves through the app. The customer pays the invoice (Swish, card or
 * transfer) and the admin marks the booking as paid (amount, date, method) on the booking page.
 */
export class ManualPaymentProvider implements PaymentProvider {
  async createPaymentRequest(req: PaymentRequest): Promise<PaymentResult> {
    if (!Number.isInteger(req.amountOre) || req.amountOre <= 0 || !isPaymentMethod(req.method)) {
      return { status: "failed" };
    }
    return { status: "manual", reference: req.bookingNumber };
  }

  async getStatus(reference: string): Promise<PaymentResult> {
    return { status: "manual", reference };
  }
}

/**
 * Only the manual provider: Nordvra invoices and the customer pays the invoice with Swish or a
 * bank transfer; the owner marks it paid in admin. No card or online payment, by decision.
 */
export function getPaymentProvider(): PaymentProvider {
  return new ManualPaymentProvider();
}
