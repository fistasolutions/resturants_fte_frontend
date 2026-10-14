import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AuthHeader } from "@/features/auth/auth-header";
import { ConnectStep } from "@/features/onboarding/connect-step";
import { InstallClaimStep } from "@/features/onboarding/install-claim-step";
import { OnboardingRail } from "@/features/onboarding/onboarding-rail";
import { OrganizationStep } from "@/features/onboarding/organization-step";
import { PlanStep } from "@/features/onboarding/plan-step";
import { SyncStep } from "@/features/onboarding/sync-step";
import { ApiError, serverApi } from "@/lib/api";
import {
  paymentMode,
  planCards,
  type ApiPlans,
  type BootstrapPayload,
  type OnboardingStep,
} from "@/lib/onboarding";
import { PLAN_COOKIE, pickPlan } from "@/lib/pricing";
import { INSTALL_COOKIE, readInstallCookie } from "@/lib/shopify-install";

export const metadata: Metadata = {
  title: "Set up your workspace",
};

interface OnboardingState {
  step: OnboardingStep;
  organization: { name: string } | null;
}

const COPY: Record<Exclude<OnboardingStep, "ready">, { title: string; subtitle: string }> = {
  organization: {
    title: "Name your company",
    subtitle: "This is the workspace your team signs into.",
  },
  plan: { title: "Choose your plan", subtitle: "By your store's annual revenue." },
  connect_store: {
    title: "Connect your Shopify store",
    subtitle: "Your last 30 days start syncing the moment you approve.",
  },
  syncing: {
    title: "Your first sync",
    subtitle: "We're bringing in your last 30 days. It takes a few minutes.",
  },
};

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; checkout?: string }>;
}) {
  let state: OnboardingState;
  try {
    state = await serverApi<OnboardingState>("/onboarding");
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) redirect("/login?session=expired");
    throw error;
  }
  if (state.step === "ready") redirect("/");

  const [plans, bootstrap] = await Promise.all([
    state.step === "plan" ? serverApi<ApiPlans>("/plans") : null,
    state.step === "syncing"
      ? serverApi<BootstrapPayload>("/stores/current/bootstrap").catch(() => null)
      : null,
  ]);
  const copy = COPY[state.step];
  // SPEC-320: the plan chosen on /pricing — from the URL, or remembered across a Google/Shopify
  // round trip — opens the plan step already selected.
  const [{ plan: planParam, checkout }, cookieStore] = await Promise.all([searchParams, cookies()]);
  const pendingInstall = readInstallCookie(cookieStore.get(INSTALL_COOKIE)?.value);
  const initialPlan = plans
    ? pickPlan(planParam, cookieStore.get(PLAN_COOKIE)?.value, plans.plans.map((p) => p.key))
    : null;

  return (
    <>
      <OnboardingRail step={state.step} />
      <AuthHeader title={copy.title} subtitle={copy.subtitle} />
      {state.step === "organization" ? <OrganizationStep /> : null}
      {state.step === "plan" && plans ? (
        <PlanStep
          plans={planCards(plans.plans)}
          initial={initialPlan}
          payment={paymentMode(plans)}
          cancelled={checkout === "cancelled"}
        />
      ) : null}
      {state.step === "connect_store" ? (
        <>
          {/* SPEC-344: a store already approved in Shopify, waiting for this company. */}
          {pendingInstall ? <InstallClaimStep shop={pendingInstall.shop} /> : null}
          <ConnectStep />
        </>
      ) : null}
      {state.step === "syncing" ? <SyncStep initial={bootstrap} /> : null}
    </>
  );
}
