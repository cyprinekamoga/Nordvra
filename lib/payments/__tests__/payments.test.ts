import { describe, expect, it } from "vitest";
import { ManualPaymentProvider, getPaymentProvider, isPaymentMethod } from "@/lib/payments/index";

describe("payments", () => {
  it("manual provider records a manual payment for valid requests", async () => {
    const provider = getPaymentProvider();
    expect(provider).toBeInstanceOf(ManualPaymentProvider);
    await expect(
      provider.createPaymentRequest({ bookingNumber: "NV-2026-00012", amountOre: 420000, method: "swish" }),
    ).resolves.toEqual({ status: "manual", reference: "NV-2026-00012" });
    await expect(provider.getStatus("NV-2026-00012")).resolves.toEqual({
      status: "manual",
      reference: "NV-2026-00012",
    });
  });

  it("rejects invalid amounts and methods (only electronic methods exist)", async () => {
    const provider = new ManualPaymentProvider();
    await expect(
      provider.createPaymentRequest({ bookingNumber: "NV-2026-00012", amountOre: 0, method: "kort" }),
    ).resolves.toEqual({ status: "failed" });
    await expect(
      provider.createPaymentRequest({
        bookingNumber: "NV-2026-00012",
        amountOre: 100,
        method: "kontant" as never,
      }),
    ).resolves.toEqual({ status: "failed" });
    expect(isPaymentMethod("overforing")).toBe(true);
    expect(isPaymentMethod("kontant")).toBe(false);
  });
});
