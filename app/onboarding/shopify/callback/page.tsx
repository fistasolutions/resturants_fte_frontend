import type { Metadata } from "next";

import { AuthHeader } from "@/features/auth/auth-header";
import { ConnectCallback } from "@/features/onboarding/connect-callback";

export const metadata: Metadata = {
  title: "Connecting your store",
};

export default async function ConnectCallbackPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const query: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "string") query[key] = value;
  }
  return (
    <>
      <AuthHeader title="Connecting your store" subtitle="One moment while Shopify confirms." />
      <ConnectCallback query={query} />
    </>
  );
}
