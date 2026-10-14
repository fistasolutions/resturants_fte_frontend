import type { Metadata } from "next";

import { AuthHeader } from "@/features/auth/auth-header";
import { ProviderCallback } from "@/features/auth/provider-callback";

export const metadata: Metadata = {
  title: "Signing you in",
};

export default async function GoogleCallbackPage({
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
    <div className="space-y-6">
      <AuthHeader title="One moment" subtitle="Finishing your Google sign-in." />
      <ProviderCallback provider="google" query={query} />
    </div>
  );
}
