import "server-only";

/*
 * Betalning för RUT/ROT: köparen måste själv betala, och betalningen måste ske elektroniskt
 * (kort, Swish eller banköverföring). Kontant betalning, eller betalning från någon annan än den
 * som ska få avdraget, gör att Skatteverket nekar avdraget. Därför stödjer vi bara elektroniska
 * betalsätt och sparar alltid betalsätt, belopp och datum på bokningen.
 *
 * Payments: only the seller model (TO Städ och Flytt invoices) takes payment through us; in the
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

// TODO(senare): SwishHandelPaymentProvider (Swish Handel/Commerce API with certificate from the
// bank; payment request to payerPhone, callback URL → mark booking paid) and a card provider
// (e.g. a PSP with Checkout). Both must confirm that the payer is the buyer.

/** Only the manual provider exists today. */
export function getPaymentProvider(): PaymentProvider {
  return new ManualPaymentProvider();
}
