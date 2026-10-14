import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthHeader } from "@/features/auth/auth-header";
import { CheckoutReturn } from "@/features/onboarding/checkout-return";

export const metadata: Metadata = {
  title: "Confirming your payment",
};

/** Where Stripe Checkout returns (SPEC-321). No session id → back to onboarding. */
export default async function CheckoutReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;
  if (!sessionId || !/^cs_[A-Za-z0-9_]{1,200}$/.test(sessionId)) redirect("/onboarding");
  return (
    <>
      <AuthHeader title="Thank you" subtitle="We're confirming your payment with Stripe." />
      <CheckoutReturn sessionId={sessionId} />
    </>
  );
}
