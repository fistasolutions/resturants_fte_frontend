import type { Metadata } from "next";
import { cookies } from "next/headers";

import { PricingView } from "@/features/pricing/pricing-view";
import { serverApi } from "@/lib/api";
import { paymentMode, planCards, type ApiPlans } from "@/lib/onboarding";
import { SESSION_COOKIE } from "@/lib/session";
import { PRODUCT } from "@/lib/product";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "One price for your whole store, by annual revenue. Every plan includes every connection, Glisp and the AI employees.",
};

const MARKETING_URL = (process.env.MARKETING_URL ?? PRODUCT.marketingUrl).replace(/\/+$/, "");

/** The pricing page (SPEC-320): public, the plans read from the backend (never hard-coded), and
 * the session cookie deciding where "Choose this plan" goes. A failed plans read still renders
 * the page, with a calm note in place of the cards. */
export default async function PricingPage() {
  const [plans, cookieStore] = await Promise.all([
    serverApi<ApiPlans>("/plans").catch(() => null),
    cookies(),
  ]);
  return (
    <PricingView
      plans={plans ? planCards(plans.plans) : null}
      payment={paymentMode(plans)}
      signedIn={cookieStore.has(SESSION_COOKIE)}
      marketingUrl={MARKETING_URL}
    />
  );
}
