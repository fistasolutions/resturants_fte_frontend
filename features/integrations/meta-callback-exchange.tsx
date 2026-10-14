"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";

import { useCan } from "@/hooks/use-can";
import { ADS_CONNECT_FLAG, adsReturnHref } from "@/lib/ad-platforms";
import { type ConnectReasonCode, connectReasonCode, withReason } from "@/lib/connect-reasons";
import { exchangeMetaCode } from "@/services/meta-actions";

/**
 * Meta OAuth callback exchanger (backend SPEC-179). POSTs the `code` to
 * `/integrations/meta/exchange` through the proxy, then returns to Meta's own
 * Settings tab in Integrations (SPEC-328)
 * with a result the page reflects in a banner. A ref guards dev StrictMode's
 * double-mount so a single-use code is exchanged exactly once.
 *
 * `access_denied` is treated as a **cancellation**, not a failure: backing out of
 * Meta's consent screen is a normal thing to do, and calling it an error would
 * read as though something broke.
 */
export function MetaCallbackExchange({
  code,
  error,
  state = null,
}: {
  code: string | null;
  error: string | null;
  /** Meta's signed state — the backend tells a Performance Ads sign-in from Social's by it. */
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

    // SPEC-333: an Ads sign-in returns to the screen that started it (the Audit tab or
    // Meta Ads' page in Integrations), whatever Meta answered.
    let flag: string | null = null;
    try {
      flag = window.sessionStorage.getItem(ADS_CONNECT_FLAG);
      window.sessionStorage.removeItem(ADS_CONNECT_FLAG);
    } catch {
      // Storage blocked: the backend still recognises an Ads state on success.
    }
    const forAds = adsReturnHref(flag, "connected") !== null;
    const back = (
      result: "cancelled" | "error" | "connected",
      ads: boolean,
      reason: ConnectReasonCode | null = null,
    ) =>
      router.replace(
        withReason(
          ads
            ? (adsReturnHref(flag, result) ?? `/ads?tab=audit&meta=${result}`)
            : `/integrations/meta?tab=settings&meta=${result}`,
          reason,
        ),
      );

    if (error === "access_denied") {
      back("cancelled", forAds);
      return;
    }
    if (error || !code) {
      back("error", forAds);
      return;
    }

    let active = true;
    exchangeMetaCode(code, state)
      .then((result) => {
        if (active) back("connected", Boolean(result.ads) || forAds);
      })
      .catch((failure: unknown) => {
        // SPEC-336: a refused connect says why — as a code the banner knows, never as text.
        if (active) back("error", forAds, connectReasonCode(failure));
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
        <p className="text-sm font-medium text-foreground">Meta was not connected</p>
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
      <LoaderCircle className="size-6 animate-spin text-muted-foreground" aria-hidden />
      <p className="text-sm font-medium text-foreground">Connecting to Meta…</p>
      <p className="text-sm text-muted-foreground">
        Finishing the connection. This only takes a moment.
      </p>
    </div>
  );
}
