"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { PlanCard } from "@/lib/onboarding";
import { AI_INCLUDED } from "@/lib/pricing";
import { cn } from "@/lib/utils";

/** The two surfaces the picker sits on: the pricing page's dark showcase card, and the app. */
const TONES = {
  showcase: {
    label: "text-showcase-muted",
    trigger: "border-showcase-border bg-showcase-card",
    sub: "text-showcase-muted",
  },
  app: {
    label: "text-muted-foreground",
    trigger: "border-border bg-card",
    sub: "text-muted-foreground",
  },
} as const;

/**
 * Choose a plan by annual revenue (SPEC-326, shared since SPEC-351): the revenue band in a
 * dropdown, then the price, what it comes to a day and what AI it includes — said without a
 * dollar figure. The pricing page and onboarding's Plan step draw the same picker; only what the
 * button under it does differs.
 */
export function PlanChoice({
  plans,
  value,
  onChange,
  tone = "app",
  id = "plan-revenue",
  perDay = true,
  align = "start",
}: {
  plans: PlanCard[];
  value: string;
  onChange: (key: string) => void;
  tone?: keyof typeof TONES;
  id?: string;
  /** Show what the plan comes to a day (the pricing page does; onboarding does not). */
  perDay?: boolean;
  /** Where the price and the AI line sit under the dropdown. */
  align?: "start" | "center";
}) {
  const plan = plans.find((p) => p.key === value) ?? plans[0];
  const t = TONES[tone];
  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <label htmlFor={id} className={cn("text-xs font-medium tracking-wide uppercase", t.label)}>
          Your store&apos;s annual revenue
        </label>
        <Select value={plan.key} onValueChange={onChange}>
          <SelectTrigger id={id} className={cn("w-full rounded-xl px-4 py-3 text-left data-[size=default]:h-auto", t.trigger)}>
            <SelectValue>
              <span className="flex flex-col items-start leading-tight">
                <span className="text-base font-semibold">{plan.name}</span>
                <span className={cn("text-xs", t.sub)}>{plan.band}</span>
              </span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent position="popper" className="w-(--radix-select-trigger-width)">
            {plans.map((p) => (
              // The item's text fills the row (`*:[span]:last:flex-1`), so every price lands in
              // one right-aligned column, clear of the check mark.
              <SelectItem key={p.key} value={p.key} className="py-2.5 pl-3 *:[span]:last:flex-1">
                <span className="grid w-full grid-cols-[minmax(0,1fr)_5.5rem] items-center gap-4">
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate font-medium">{p.name}</span>
                    <span className="truncate text-xs text-muted-foreground">{p.band}</span>
                  </span>
                  <span className="text-right text-muted-foreground tabular-nums">
                    {p.price}/{p.interval === "year" ? "yr" : "mo"}
                  </span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div aria-live="polite" className={cn(align === "center" && "text-center")}>
        <p className={cn("flex items-baseline gap-2", align === "center" && "justify-center")}>
          <span className="font-display text-5xl leading-none tracking-tight tabular-nums md:text-6xl">{plan.price}</span>
          <span className={cn("text-sm", t.sub)}>/ {plan.interval}</span>
        </p>
        {perDay ? (
          <p className={cn("mt-2 text-sm", t.sub)}>
            <span className="tabular-nums">{plan.perDay}</span> a day
          </p>
        ) : null}
        <p className={cn("text-sm", perDay ? "mt-1" : "mt-3", t.sub)}>{AI_INCLUDED}</p>
      </div>
    </div>
  );
}
