"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronRight, LoaderCircle } from "lucide-react";

import { useHub } from "@/features/integrations/hub/hub-context";
import { GorgiasConnectForm, GorgiasOAuthConnected } from "@/features/integrations/gorgias-oauth";
import { KlaviyoNoticeLine as ConnectNoticeLine } from "@/features/integrations/klaviyo-oauth";
import { useApiQuery } from "@/hooks/use-api-query";
import { useCan } from "@/hooks/use-can";
import { ApiError } from "@/lib/api-error";
import {
  GORGIAS_NO_SUBDOMAIN,
  gorgiasAutoStart,
  gorgiasNotice,
  type GorgiasAutoStart,
  installSubdomain,
  withoutGorgiasInstall,
} from "@/lib/gorgias-connect";
import { integrationQueries } from "@/lib/queries/integrations";
import { teamQueries } from "@/lib/queries/team";
import { startGorgiasConnect } from "@/services/gorgias-connect-actions";

/**
 * Gorgias's Settings tab in the Integrations hub (SPEC-372): Connect with Gorgias first, when
 * the platform has the Gorgias app set up, and the pasted-key form under "Use an API key
 * instead". A store that already has a key saved finds that form open, exactly as before;
 * without the app set up here, the key form is all there is, as before.
 */
export function GorgiasSettings({
  keySaved,
  startOpen,
  savedSubdomain,
  params,
  keyPanel,
}: {
  /** An API key is saved on this page. */
  keySaved: boolean;
  /** Open the key form at once (a Disconnect link landed here). */
  startOpen: boolean;
  /** The subdomain saved on the card, if any. */
  savedSubdomain: string | null;
  params: URLSearchParams;
  /** The pasted-key form, unchanged. */
  keyPanel: React.ReactNode;
}) {
  const { refresh } = useHub();
  // The hub's overview is already in the cache on this page — no second request.
  const overview = useApiQuery(integrationQueries.overview());
  const oauth = overview.data?.integrations.find((i) => i.key === "gorgias")?.oauth;
  const [keyOpen, setKeyOpen] = useState(keySaved || startOpen);
  const notice = gorgiasNotice(params);
  const offered = Boolean(oauth && (oauth.available || oauth.connected));

  // `?connect=gorgias&account=<subdomain>` is the App URL Gorgias's listing opens.
  const pathname = usePathname();
  const access = useApiQuery(teamQueries.access());
  const connectGate = useCan()("integrations.manage");
  const decision = gorgiasAutoStart(
    params,
    overview.isPending ? undefined : (oauth ?? null),
    { known: !access.isPending, allowed: connectGate.allowed },
    savedSubdomain,
  );
  // The first real decision is kept for the visit (set during render), because the address
  // loses the install link at once; so is the subdomain it named.
  const [latched, setLatched] = useState<{ decision: GorgiasAutoStart; subdomain: string | null } | null>(null);
  if (latched === null && decision !== null && decision !== "wait") {
    setLatched({ decision, subdomain: installSubdomain(params, savedSubdomain) });
  }
  const [startError, setStartError] = useState<string | null>(null);
  const handled = useRef(false);
  useEffect(() => {
    if (latched === null || handled.current) return;
    handled.current = true;
    // Never twice: a refresh or Back lands on the page without the install link.
    window.history.replaceState(window.history.state, "", withoutGorgiasInstall(pathname, params));
    if (latched.decision !== "start" || !latched.subdomain) return;
    startGorgiasConnect(latched.subdomain).catch((cause: unknown) => {
      setStartError(cause instanceof ApiError ? cause.message : "Could not start the Gorgias sign-in. Try again.");
    });
  }, [latched, pathname, params]);
  const going = latched?.decision === "start" && startError === null;
  const installNote =
    startError ??
    (going
      ? "Taking you to Gorgias…"
      : latched?.decision === "connected"
        ? "Gorgias is already connected."
        : latched?.decision === "need_subdomain"
          ? `${GORGIAS_NO_SUBDOMAIN} to continue.`
          : latched?.decision === "not_allowed"
            ? connectGate.reason
            : null);
  const formSubdomain = latched?.subdomain ?? savedSubdomain;

  return (
    <div className="flex flex-col gap-4">
      <ConnectNoticeLine notice={notice} />
      {installNote ? (
        <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
          {going ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : null}
          {installNote}
        </p>
      ) : null}
      {offered && oauth ? (
        <section className="flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-xs" aria-label="Sign in with Gorgias">
          <h3 className="text-sm font-semibold">Sign in with Gorgias</h3>
          {oauth.connected ? (
            <GorgiasOAuthConnected
              scopes={oauth.scopes}
              subdomain={savedSubdomain}
              needsReconnecting={oauth.needsReconnecting === true}
              onDisconnected={refresh}
            />
          ) : (
            <GorgiasConnectForm
              initialSubdomain={formSubdomain}
              note="One click: press Allow on Gorgias's screen and you come straight back here, connected. Nothing to copy, and the access can be revoked from either side."
            />
          )}
        </section>
      ) : null}
      {offered ? (
        <details className="group" open={keyOpen} onToggle={(event) => setKeyOpen(event.currentTarget.open)}>
          <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none [&::-webkit-details-marker]:hidden">
            <ChevronRight className="size-4 transition-transform duration-200 group-open:rotate-90" aria-hidden />
            Use an API key instead
          </summary>
          <div className="mt-4">{keyPanel}</div>
        </details>
      ) : (
        keyPanel
      )}
    </div>
  );
}
