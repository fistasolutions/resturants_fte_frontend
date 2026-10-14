import { describe, expect, it } from "vitest";

import { checkoutReturnState, MAX_CONFIRM_ATTEMPTS } from "@/lib/checkout";
import { paymentMode } from "@/lib/onboarding";

describe("SPEC-321 payment mode", () => {
  it("reads Stripe and test mode, and treats a missing field as the preview", () => {
    expect(paymentMode({ plans: [], payment: { provider: "stripe", test_mode: true } })).toEqual({ provider: "stripe", testMode: true });
    expect(paymentMode({ plans: [], payment: { provider: "stripe", test_mode: false } })).toEqual({ provider: "stripe", testMode: false });
    expect(paymentMode({ plans: [] })).toEqual({ provider: "preview", testMode: false });
    expect(paymentMode(null)).toEqual({ provider: "preview", testMode: false });
    expect(paymentMode({ plans: [], payment: { provider: "paypal", test_mode: true } })).toEqual({ provider: "preview", testMode: false });
  });
});

describe("SPEC-321 coming back from Stripe", () => {
  it("is done on success", () => {
    expect(checkoutReturnState(null, 1)).toBe("done");
  });

  it("asks again while the payment settles, then says it is processing", () => {
    for (let attempt = 1; attempt < MAX_CONFIRM_ATTEMPTS; attempt += 1) {
      expect(checkoutReturnState("checkout_not_paid", attempt)).toBe("retry");
    }
    expect(checkoutReturnState("checkout_not_paid", MAX_CONFIRM_ATTEMPTS)).toBe("processing");
  });

  it("fails on anything else", () => {
    expect(checkoutReturnState("checkout_not_found", 1)).toBe("failed");
    expect(checkoutReturnState("payment_unavailable", 1)).toBe("failed");
  });
});
