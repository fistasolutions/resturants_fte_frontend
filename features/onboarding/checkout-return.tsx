"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api-error";
import { checkoutReturnState, CONFIRM_RETRY_MS } from "@/lib/checkout";
import { PLAN_COOKIE } from "@/lib/pricing";
import { confirmCheckout } from "@/services/onboarding";

type View = { kind: "confirming" } | { kind: "processing" } | { kind: "failed"; message: string };

/**
 * Back from Stripe (SPEC-321): confirm the payment once, ask again while it settles, then
 * continue onboarding (connect Shopify). The webhook records the same payment independently —
 * the backend keeps one row whichever arrives first.
 */
export function CheckoutReturn({ sessionId }: { sessionId: string }) {
  const [view, setView] = useState<View>({ kind: "confirming" });
  const started = useRef(false);

  const run = useCallback(async (): Promise<void> => {
    for (let attempt = 1; ; attempt += 1) {
      let code: string | null = null;
      let message = "The payment could not be confirmed.";
      try {
        await confirmCheckout(sessionId);
      } catch (failure) {
        code = failure instanceof ApiError ? failure.code : "request_failed";
        if (failure instanceof Error && failure.message) message = failure.message;
      }
      const next = checkoutReturnState(code, attempt);
      if (next === "retry") {
        await new Promise((resolve) => window.setTimeout(resolve, CONFIRM_RETRY_MS));
        continue;
      }
      if (next === "done") {
        document.cookie = `${PLAN_COOKIE}=; Max-Age=0; path=/; SameSite=Lax`;
        window.location.replace("/onboarding");
      } else if (next === "processing") {
        setView({ kind: "processing" });
      } else {
        setView({ kind: "failed", message });
      }
      return;
    }
  }, [sessionId]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void run();
  }, [run]);

  if (view.kind === "confirming") {
    return (
      <p role="status" className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
        <LoaderCircle className="size-4 animate-spin" aria-hidden />
        Confirming your payment…
      </p>
    );
  }
  return (
    <div className="space-y-4 rounded-xl border border-border p-6 text-center">
      <p role="alert" className="text-sm">
        {view.kind === "processing"
          ? "Your payment is still processing. This usually takes a few seconds."
          : view.message}
      </p>
      <div className="flex justify-center gap-2">
        {view.kind === "processing" ? (
          <Button
            onClick={() => {
              setView({ kind: "confirming" });
              void run();
            }}
          >
            Check again
          </Button>
        ) : null}
        <Button variant="outline" asChild>
          <Link href="/onboarding" prefetch={false}>
            Back to plans
          </Link>
        </Button>
      </div>
    </div>
  );
}
