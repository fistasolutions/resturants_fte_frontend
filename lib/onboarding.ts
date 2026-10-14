/**
 * Onboarding (SPEC-313) — pure. The step is always the backend's (`GET /onboarding`);
 * this module only turns it and the backend's payloads into what the screens draw.
 */

export type OnboardingStep = "organization" | "plan" | "connect_store" | "syncing" | "ready";

export const RAIL: { step: Exclude<OnboardingStep, "ready">; label: string }[] = [
  { step: "organization", label: "Company" },
  { step: "plan", label: "Plan" },
  { step: "connect_store", label: "Store" },
  { step: "syncing", label: "First sync" },
];

export type RailState = "done" | "current" | "next";

export function railStates(step: OnboardingStep): { label: string; state: RailState }[] {
  const at = step === "ready" ? RAIL.length : RAIL.findIndex((r) => r.step === step);
  return RAIL.map((r, i) => ({
    label: r.label,
    state: i < at ? "done" : i === at ? "current" : "next",
  }));
}

/** How plans are paid for (backend SPEC-322): Stripe Checkout, or the no-card preview. */
export interface PaymentMode {
  provider: "stripe" | "preview";
  testMode: boolean;
}

export interface ApiPlans {
  plans: ApiPlan[];
  payment?: { provider?: string; test_mode?: boolean };
}

/** An older backend (no `payment`) is the preview. */
export function paymentMode(api: ApiPlans | null | undefined): PaymentMode {
  const provider = api?.payment?.provider === "stripe" ? "stripe" : "preview";
  return { provider, testMode: provider === "stripe" && api?.payment?.test_mode === true };
}

export interface ApiPlan {
  key: string;
  name: string;
  band_label: string;
  min_revenue: number;
  max_revenue: number | null;
  price_cents: number;
  currency: string;
  interval: string;
  ai_allowance_cents: number;
  // SPEC-373 (backend SPEC-382): members the plan includes; null = unlimited, absent on an older backend.
  seats?: number | null;
}

export interface PlanCard {
  key: string;
  name: string;
  band: string;
  price: string;
  interval: string;
  aiAllowance: string;
  /** SPEC-326: what the plan costs a day, averaged over a year ("$26.30"). */
  perDay: string;
  /** The band's lower bound in annual revenue, whole currency units (SPEC-351). */
  minRevenue: number;
}

/** The plan the Plan step opens on: the one chosen on /pricing when it exists, else the first
 * band — as /pricing opens (SPEC-351). Pure. */
export function defaultPlanKey(plans: readonly PlanCard[], initial?: string | null): string {
  if (initial && plans.some((p) => p.key === initial)) return initial;
  return plans[0]?.key ?? "";
}

function dollars(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

/** What a monthly price comes to a day, averaged over a year: `80000` cents → `$26.30`. Pure. */
export function perDay(monthlyCents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format((monthlyCents * 12) / 365 / 100);
}

/** The plans in the order the backend gives them (cheapest band first). */
export function planCards(plans: ApiPlan[]): PlanCard[] {
  return plans.map((plan) => ({
    key: plan.key,
    name: plan.name,
    band: plan.band_label,
    price: dollars(plan.price_cents, plan.currency),
    interval: plan.interval,
    aiAllowance: dollars(plan.ai_allowance_cents, plan.currency),
    perDay: perDay(plan.price_cents, plan.currency),
    minRevenue: plan.min_revenue,
  }));
}

/** SPEC-370: what the running step is doing — the resource or job starting now, and what the
 * step finished so far (records synced; -1 for a resource that failed, 0 for a job). */
export interface BootstrapDetail {
  now: string;
  done: Record<string, number>;
}

export interface BootstrapPayload {
  state: "pending" | "running" | "done" | "failed";
  step: string | null;
  steps_done: string[];
  steps: { key: string; title: string; reveals: string[] }[];
  error: string | null;
  detail?: BootstrapDetail | null;
}

export type SyncStepState = "done" | "running" | "waiting" | "failed";

export function syncSteps(
  payload: BootstrapPayload,
): { key: string; title: string; state: SyncStepState }[] {
  const done = new Set(payload.steps_done);
  return payload.steps.map((step) => {
    let state: SyncStepState = "waiting";
    if (done.has(step.key)) state = "done";
    else if (payload.state === "failed" && payload.step === null && !done.has(step.key)) {
      // A failed run names no step; the first step not done is the one that failed.
      state = payload.steps.find((s) => !done.has(s.key))?.key === step.key ? "failed" : "waiting";
    } else if (payload.step === step.key) state = "running";
    return { key: step.key, title: step.title, state };
  });
}

/** The dashboard is worth opening once the store's orders are in (the first step). */
export function dashboardReady(payload: BootstrapPayload): boolean {
  return payload.state === "done" || payload.steps_done.includes("shopify");
}

export function syncFinished(payload: BootstrapPayload): boolean {
  return payload.state === "done" || payload.state === "failed";
}
