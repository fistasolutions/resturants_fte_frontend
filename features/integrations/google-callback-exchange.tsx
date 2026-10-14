"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";

import { useCan } from "@/hooks/use-can";
import { connectReasonCode, withReason } from "@/lib/connect-reasons";
import { exchangeGoogleCode } from "@/services/google-actions";

/**
 * Google OAuth callback exchanger (backend SPEC-119). Runs on the registered
 * redirect target `/integrations/google-search-console/callback`. Reads the
 * `code` / `error` handed down from the server page, POSTs the code to
 * `/integrations/google/exchange` via the proxy, then redirects to Search Console's
 * own Settings tab in Integrations (SPEC-328): `?google=choose` when the connection still needs a property
 * (always, since backend SPEC-257 — the page opens the picker, SPEC-250),
 * `?google=connected` if one is somehow already stored, `?google=error` on
 * failure (with `&reason=<code>` when the backend refused the connect — SPEC-336). A ref guards the dev StrictMode double-mount so the code is
 * exchanged once.
 */
export function GoogleCallbackExchange({
  code,
  error,
  state = null,
}: {
  code: string | null;
  error: string | null;
  /** Google's signed state — the backend completes only for whoever started this connect. */
  state?: string | null;
}) {
  const router = useRouter();
  const ran = useRef(false);
  // SPEC-358: a role that cannot connect integrations is told why, instead of an exchange the
  // server would refuse. Unknown access (still loading) exchanges as before.
  const can = useCan();
  const gate = can("integrations.manage");

  useEffect(() => {
    if (ran.current || !gate.allowed) return;
    ran.current = true;

    if (error || !code) {
      router.replace("/integrations/gsc?tab=settings&google=error");
      return;
    }

    let active = true;
    exchangeGoogleCode(code, state)
      .then((status) => {
        if (!active) return;
        router.replace(
          status.needsProperty
            ? "/integrations/gsc?tab=settings&google=choose"
            : "/integrations/gsc?tab=settings&google=connected",
        );
      })
      .catch((failure: unknown) => {
        // SPEC-336: a refused connect says why — as a code the banner knows, never as text.
        if (active) {
          router.replace(withReason("/integrations/gsc?tab=settings&google=error", connectReasonCode(failure)));
        }
      });

    return () => {
      active = false;
    };
  }, [code, error, gate.allowed, router, state]);

  if (!gate.allowed) {
    return (
      <div
        role="status"
        className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center"
      >
        <p className="text-sm font-medium text-foreground">Google was not connected</p>
        <p className="max-w-md text-sm text-muted-foreground">{gate.reason}</p>
        <Link href="/integrations" className="text-sm font-medium text-primary hover:underline">
          Back to Integrations
        </Link>
      </div>
    );
  }

  return (
    <div
      role="status"
      className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center"
    >
      <LoaderCircle
        className="size-6 animate-spin text-muted-foreground"
        aria-hidden
      />
      <p className="text-sm font-medium text-foreground">Connecting Google…</p>
      <p className="text-sm text-muted-foreground">
        Finishing the Search Console connection. This only takes a moment.
      </p>
    </div>
  );
}
