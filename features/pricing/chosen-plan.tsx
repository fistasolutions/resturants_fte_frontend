import Link from "next/link";

import type { PlanCard } from "@/lib/onboarding";

/** The plan chosen on /pricing, above the sign-up form (SPEC-320): what it is, and a way back. */
export function ChosenPlan({ plan }: { plan: PlanCard }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
      <span>
        <span className="font-mono text-xs tracking-widest text-muted-foreground uppercase">Your plan</span>
        <span className="mt-0.5 block font-medium">
          {plan.name} · {plan.price}/{plan.interval}
        </span>
      </span>
      <Link href="/pricing" prefetch={false} className="shrink-0 text-sm font-medium underline-offset-4 hover:underline">
        Change
      </Link>
    </div>
  );
}
