import { Suspense } from "react";
import type { Metadata } from "next";

import { GoogleCallbackExchange } from "@/features/integrations/google-callback-exchange";

export const metadata: Metadata = {
  title: "Connecting Google Search Console",
};

export const dynamic = "force-dynamic";

interface CallbackPageProps {
  searchParams: Promise<{ code?: string; error?: string; state?: string }>;
}

/**
 * Google OAuth redirect target (backend SPEC-119) — matches the registered
 * redirect URI `/integrations/google-search-console/callback`. Reads `?code`
 * / `?error` / `?state` (SPEC-336) server-side (a Promise in Next 16), then hands them to the client
 * exchanger (in `<Suspense>`) which POSTs the code and redirects back to
 * Integrations with the result. Passing the params as props avoids a client
 * `useSearchParams()` and its extra boundary.
 */
export default async function GoogleCallbackPage({
  searchParams,
}: CallbackPageProps) {
  const { code, error, state } = await searchParams;

  return (
    <main className="p-4 md:p-6">
      <Suspense>
        <GoogleCallbackExchange code={code ?? null} error={error ?? null} state={state ?? null} />
      </Suspense>
    </main>
  );
}
