import { Suspense } from "react";
import type { Metadata } from "next";

import { MetaCallbackExchange } from "@/features/integrations/meta-callback-exchange";

export const metadata: Metadata = {
  title: "Connecting to Meta",
};

export const dynamic = "force-dynamic";

interface CallbackPageProps {
  searchParams: Promise<{ code?: string; error?: string; state?: string }>;
}

/**
 * Meta OAuth redirect target (backend SPEC-179) — must match the redirect URI
 * registered on the Meta app and set as `META_OAUTH_REDIRECT_URI`:
 * `/integrations/meta/callback`. Reads `?code` / `?error` server-side (a Promise
 * in Next 16) and hands them to the client exchanger, mirroring the Google
 * callback exactly. Passing them as props avoids a client `useSearchParams()`.
 */
export default async function MetaCallbackPage({ searchParams }: CallbackPageProps) {
  const { code, error, state } = await searchParams;

  return (
    <main className="p-4 md:p-6">
      <Suspense>
        <MetaCallbackExchange code={code ?? null} error={error ?? null} state={state ?? null} />
      </Suspense>
    </main>
  );
}
