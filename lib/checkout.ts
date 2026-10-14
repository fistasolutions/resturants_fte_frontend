/**
 * Coming back from Stripe Checkout (SPEC-321) — pure. The confirm call can race Stripe: a
 * payment still settling answers `checkout_not_paid`, so the page asks again a few times before
 * saying it is still processing.
 */

export const MAX_CONFIRM_ATTEMPTS = 5;
export const CONFIRM_RETRY_MS = 2000;

export type CheckoutReturnState = "done" | "retry" | "processing" | "failed";

/** What to do after confirm attempt number `attempt` (1-based) ended with `code` (null = ok). */
export function checkoutReturnState(code: string | null, attempt: number): CheckoutReturnState {
  if (code === null) return "done";
  if (code === "checkout_not_paid") {
    return attempt < MAX_CONFIRM_ATTEMPTS ? "retry" : "processing";
  }
  return "failed";
}
