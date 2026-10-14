"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

import { PlanChoice } from "@/features/pricing/plan-choice";
import type { PlanCard } from "@/lib/onboarding";
import { YOU_GET, choosePlanHref } from "@/lib/pricing";

/**
 * The one pricing card (SPEC-326): choose your store's annual revenue and the price, the daily
 * cost and the AI included change in place — the picker is `PlanChoice`, shared with
 * onboarding's Plan step (SPEC-351). "Choose this plan" goes exactly where each plan's
 * card went before (`choosePlanHref`), so the sign-up journey and the remembered plan are
 * unchanged.
 */
export function PlanPicker({ plans, signedIn }: { plans: PlanCard[]; signedIn: boolean }) {
  const [key, setKey] = useState(plans[0].key);
  const plan = plans.find((p) => p.key === key) ?? plans[0];

  return (
    <div className="mx-auto grid max-w-3xl overflow-hidden rounded-3xl bg-showcase-card text-showcase-foreground shadow-xl md:grid-cols-2">
      <div className="flex flex-col gap-5 border-b border-showcase-border p-6 md:border-r md:border-b-0 md:p-7">
        <PlanChoice plans={plans} value={key} onChange={setKey} tone="showcase" id="pricing-revenue" />

        <Link
          href={choosePlanHref(plan.key, signedIn)}
          prefetch={false}
          aria-label={`Choose the ${plan.name} plan`}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-showcase-band px-5 text-sm font-semibold text-showcase-band-foreground outline-none transition-colors hover:bg-showcase-foreground hover:text-showcase focus-visible:ring-2 focus-visible:ring-showcase-foreground focus-visible:ring-offset-2"
        >
          Choose this plan
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>

      <div className="bg-showcase-tile p-6 md:p-7">
        <p className="text-xs font-semibold tracking-widest text-showcase-muted uppercase">You get</p>
        <ul className="mt-4 space-y-3 text-sm">
          {YOU_GET.map((item) => (
            <li key={item} className="flex gap-2.5">
              <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
