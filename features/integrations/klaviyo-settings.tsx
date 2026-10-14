"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronRight, LoaderCircle } from "lucide-react";

import { useHub } from "@/features/integrations/hub/hub-context";
import { KlaviyoConnectButton, KlaviyoNoticeLine, KlaviyoOAuthConnected } from "@/features/integrations/klaviyo-oauth";
import { useApiQuery } from "@/hooks/use-api-query";
import { useCan } from "@/hooks/use-can";
import { ApiError } from "@/lib/api-error";
import {
  KLAVIYO_INTEGRATIONS_RETURN,
  klaviyoAutoStart,
  klaviyoNotice,
  type KlaviyoAutoStart,
  withoutConnectParam,
} from "@/lib/klaviyo-connect";
import { integrationQueries } from "@/lib/queries/integrations";
import { teamQueries } from "@/lib/queries/team";
import { startKlaviyoConnect } from "@/services/klaviyo-connect-actions";

/**
 * Klaviyo's Settings tab in the Integrations hub (SPEC-371): Connect with Klaviyo first, when
 * the platform has the Klaviyo app set up, and the pasted-key form under "Use a private API
 * key instead". A store that already has a key saved finds that form open, exactly as before;
 * without the app set up here, the key form is all there is, as before.
 */
export function KlaviyoSettings({
  keySaved,
  startOpen,
  params,
  keyPanel,
}: {
  /** A private key is saved on this page. */
  keySaved: boolean;
  /** Open the key form at once (a Disconnect link landed here). */
  startOpen: boolean;
  params: URLSearchParams;
  /** The pasted-key form, unchanged. */
  keyPanel: React.ReactNode;
}) {
  const { refresh } = useHub();
  // The hub's overview is already in the cache on this page — no second request.
  const overview = useApiQuery(integrationQueries.overview());
  const oauth = overview.data?.integrations.find((i) => i.key === "klaviyo")?.oauth;
  const [keyOpen, setKeyOpen] = useState(keySaved || startOpen);
  const notice = klaviyoNotice(params);
  const offered = Boolean(oauth && (oauth.available || oauth.connected));

  // SPEC-371 amendment: `?connect=klaviyo` is the install link Klaviyo's listing opens.
  const pathname = usePathname();
  const access = useApiQuery(teamQueries.access());
  const connectGate = useCan()("integrations.manage");
  const decision = klaviyoAutoStart(params, overview.isPending ? undefined : (oauth ?? null), {
    known: !access.isPending,
    allowed: connectGate.allowed,
  });
  // The first real decision is kept for the visit (set during render, React's pattern for
  // "remember a value from an earlier render"), because the address loses the link at once.
  const [latched, setLatched] = useState<KlaviyoAutoStart | null>(null);
  if (latched === null && decision !== null && decision !== "wait") setLatched(decision);
  const [startError, setStartError] = useState<string | null>(null);
  const handled = useRef(false);
  useEffect(() => {
    if (latched === null || handled.current) return;
    handled.current = true;
    // Never twice: a refresh or Back lands on the page without the install link.
    window.history.replaceState(window.history.state, "", withoutConnectParam(pathname, params));
    if (latched !== "start") return;
    startKlaviyoConnect(KLAVIYO_INTEGRATIONS_RETURN).catch((cause: unknown) => {
      setStartError(cause instanceof ApiError ? cause.message : "Could not start the Klaviyo sign-in. Try again.");
    });
  }, [latched, pathname, params]);
  const installNote =
    startError ??
    (latched === "start"
      ? "Taking you to Klaviyo…"
      : latched === "connected"
        ? "Klaviyo is already connected."
        : latched === "not_allowed"
          ? connectGate.reason
          : null);

  return (
    <div className="flex flex-col gap-4">
      <KlaviyoNoticeLine notice={notice} />
      {installNote ? (
        <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
          {latched === "start" && startError === null ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden />
          ) : null}
          {installNote}
        </p>
      ) : null}
      {offered && oauth ? (
        <section className="flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-xs" aria-label="Sign in with Klaviyo">
          <h3 className="text-sm font-semibold">Sign in with Klaviyo</h3>
          {oauth.connected ? (
            <KlaviyoOAuthConnected scopes={oauth.scopes} onDisconnected={refresh} />
          ) : (
            <>
              <p className="max-w-xl text-sm text-muted-foreground">
                One click: press Allow on Klaviyo&apos;s screen and you come straight back here, connected. Nothing to
                copy, and the access can be revoked from either side.
              </p>
              <KlaviyoConnectButton returnPath={KLAVIYO_INTEGRATIONS_RETURN} />
            </>
          )}
        </section>
      ) : null}
      {offered ? (
        <details
          className="group"
          open={keyOpen}
          onToggle={(event) => setKeyOpen(event.currentTarget.open)}
        >
          <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none [&::-webkit-details-marker]:hidden">
            <ChevronRight className="size-4 transition-transform duration-200 group-open:rotate-90" aria-hidden />
            Use a private API key instead
          </summary>
          <div className="mt-4">{keyPanel}</div>
        </details>
      ) : (
        keyPanel
      )}
    </div>
  );
}
