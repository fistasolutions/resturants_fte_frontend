import type { Metadata } from "next";
import { cookies } from "next/headers";

import { AuthHeader } from "@/features/auth/auth-header";
import { SignupForm } from "@/features/auth/signup-form";
import { ChosenPlan } from "@/features/pricing/chosen-plan";
import { serverApi } from "@/lib/api";
import { planCards, type ApiPlan } from "@/lib/onboarding";
import { PLAN_COOKIE, validPlanKey } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Create your account",
};

/** Sign-up (SPEC-312). With a plan chosen on /pricing (SPEC-320) it shows that plan above the
 * form and carries it on into verify and onboarding. The plans read is public and made only
 * when a plan was chosen. */
export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const [{ plan: planParam }, cookieStore] = await Promise.all([searchParams, cookies()]);
  const wanted = validPlanKey(planParam) ?? validPlanKey(cookieStore.get(PLAN_COOKIE)?.value);
  const plans = wanted
    ? await serverApi<{ plans: ApiPlan[] }>("/plans").catch(() => null)
    : null;
  const chosen = plans ? (planCards(plans.plans).find((p) => p.key === wanted) ?? null) : null;

  return (
    <div className="space-y-6">
      <AuthHeader title="Create your account" subtitle="Your digital employees, ready in minutes." />
      {chosen ? <ChosenPlan plan={chosen} /> : null}
      <SignupForm plan={chosen?.key ?? null} />
    </div>
  );
}
