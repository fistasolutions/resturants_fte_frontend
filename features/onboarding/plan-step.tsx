"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FormAlert } from "@/features/auth/form-alert";
import { PlanChoice } from "@/features/pricing/plan-choice";
import { defaultPlanKey, type PaymentMode, type PlanCard } from "@/lib/onboarding";
import { PLAN_COOKIE } from "@/lib/pricing";
import { choosePlan, startCheckout } from "@/services/onboarding";

const PREVIEW: PaymentMode = { provider: "preview", testMode: false };

/** The plan by annual revenue — the pricing page's own picker (SPEC-351) — then one confirm:
 * Stripe Checkout when payments are on (SPEC-321), a no-card start in the preview. */
export function PlanStep({
  plans,
  initial = null,
  payment = PREVIEW,
  cancelled = false,
}: {
  plans: PlanCard[];
  initial?: string | null;
  payment?: PaymentMode;
  /** Back from Stripe's cancel link. */
  cancelled?: boolean;
}) {
  const stripe = payment.provider === "stripe";
  const router = useRouter();
  // SPEC-320: a plan chosen on /pricing opens already selected; otherwise the first band.
  const [chosen, setChosen] = useState<string>(() => defaultPlanKey(plans, initial));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const plan = plans.find((p) => p.key === chosen) ?? null;
  const per = plan ? (plan.interval === "year" ? "year" : "month") : "";

  async function confirm() {
    if (!plan) return;
    setBusy(true);
    setError(null);
    try {
      if (stripe) {
        // SPEC-321: pay on Stripe; onboarding continues on the page Stripe returns to.
        window.location.assign(await startCheckout(plan.key));
        return;
      }
      await choosePlan(plan.key);
      // The plan is started: forget the one remembered from /pricing.
      document.cookie = `${PLAN_COOKIE}=; Max-Age=0; path=/; SameSite=Lax`;
      router.refresh();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not start the plan.");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {cancelled ? (
        <p role="status" className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
          Payment cancelled — nothing was charged. Your plan is still selected.
        </p>
      ) : null}
      {plan ? (
        <div className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <PlanChoice plans={plans} value={plan.key} onChange={setChosen} id="onboarding-revenue" perDay={false} align="center" />
          <div className="space-y-3 border-t border-border pt-4">
            {!stripe ? (
              <p className="text-center text-xs text-muted-foreground">No card is needed during the preview; billing starts when payments open.</p>
            ) : null}
            {/* Only with Stripe's test keys — never shown on a live account. */}
            {stripe && payment.testMode ? (
              <p className="text-center text-xs text-muted-foreground">Test mode: card 4242 4242 4242 4242, any future date, any CVC.</p>
            ) : null}
            <FormAlert message={error} />
            <Button className="h-11 w-full" disabled={busy} onClick={() => void confirm()}>
              {busy ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : null}
              {stripe
                ? busy
                  ? "Opening checkout…"
                  : `Continue to payment — ${plan.price}/${per}`
                : `Start this plan — ${plan.price}/${per}`}
              {!busy ? <ArrowRight className="size-4" aria-hidden /> : null}
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-center text-sm text-muted-foreground">No plans are available right now. Please try again in a moment.</p>
      )}

    </div>
  );
}
