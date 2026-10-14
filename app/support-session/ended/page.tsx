import type { Metadata } from "next";

import { CloseTabButton } from "@/features/support-session/close-tab-button";

export const metadata: Metadata = { title: "Support session ended" };

/**
 * Where a support session's tab lands when it ends (SPEC-363): Exit, End now from the console, or
 * its time running out. Nothing here belongs to the company the operator was viewing.
 */
export default async function SupportSessionEndedPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  const message =
    reason === "link"
      ? "This support link has expired or was already used. Start a new session from the admin console."
      : reason === "unreachable"
        ? "The app could not be reached. Try the link again from the admin console."
        : "This support session has ended. You were signed out of the company's app.";
  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-4 rounded-card border border-border bg-card p-6 text-center">
        <h1 className="text-lg font-semibold text-foreground">Support session ended</h1>
        <p className="text-sm text-muted-foreground">{message}</p>
        <CloseTabButton />
      </div>
    </main>
  );
}
