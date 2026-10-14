"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { LogOut, ShieldAlert, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useApiQuery } from "@/hooks/use-api-query";
import { supportSessionQueries } from "@/lib/queries/support-session";
import {
  BLOCKED_WARNING,
  hasMarker,
  SUPPORT_BLOCKED_EVENT,
  SUPPORT_ENDED_PATH,
  SUPPORT_ROUTE,
  timeLeftLabel,
} from "@/lib/support-session";

const noSubscription = () => () => {};
const TICK_MS = 15_000;
const WARNING_MS = 8_000;

/**
 * View as company (SPEC-363): the strip an operator sees across the top of a company's app while
 * working inside it. Draws only in a support session's tab (the marker cookie), so nobody else
 * pays a request for it. Fixed in place — no entrance animation.
 */
export function SupportBanner() {
  // The server never draws it, so the first client render matches; the marker decides after.
  const inSupport = useSyncExternalStore(
    noSubscription,
    () => hasMarker(document.cookie),
    () => false,
  );
  if (!inSupport) return null;
  return <SupportStrip />;
}

function SupportStrip() {
  const session = useApiQuery(supportSessionQueries.current());
  const [now, setNow] = useState(() => Date.now());
  const [warning, setWarning] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), TICK_MS);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let clear: number | undefined;
    const onBlocked = (event: Event) => {
      const detail = (event as CustomEvent<{ message?: string }>).detail;
      setWarning(detail?.message || BLOCKED_WARNING);
      window.clearTimeout(clear);
      clear = window.setTimeout(() => setWarning(null), WARNING_MS);
    };
    window.addEventListener(SUPPORT_BLOCKED_EVENT, onBlocked);
    return () => {
      window.removeEventListener(SUPPORT_BLOCKED_EVENT, onBlocked);
      window.clearTimeout(clear);
    };
  }, []);

  async function exit() {
    setLeaving(true);
    try {
      await fetch(SUPPORT_ROUTE, { method: "DELETE" });
    } finally {
      window.location.assign(SUPPORT_ENDED_PATH);
    }
  }

  const data = session.data ?? null;
  return (
    <div className="sticky top-0 z-50" role="region" aria-label="Support session">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-warning/40 bg-warning/15 px-4 py-2 text-sm text-foreground">
        <ShieldAlert className="size-4 shrink-0 text-warning" aria-hidden />
        <span className="font-semibold">Support session</span>
        <span className="min-w-0 truncate text-muted-foreground">
          {data ? (
            <>
              {data.companyName} · as the owner · {data.operator}
            </>
          ) : (
            "Viewing a company as its owner"
          )}
        </span>
        <span className="text-xs text-muted-foreground">Nothing you do here sends to real people.</span>
        <span className="ml-auto flex items-center gap-2">
          {data ? (
            <span className="rounded-md border border-warning/40 px-2 py-0.5 text-xs font-medium tabular-nums">
              {timeLeftLabel(data.expiresAt, now)}
            </span>
          ) : null}
          <Button size="sm" variant="outline" onClick={() => void exit()} disabled={leaving}>
            <LogOut className="size-3.5" aria-hidden />
            Exit
          </Button>
        </span>
      </div>
      {warning ? (
        <div
          role="alert"
          className="flex items-center gap-2 border-b border-warning/40 bg-card px-4 py-2 text-sm font-medium text-foreground"
        >
          <TriangleAlert className="size-4 shrink-0 text-warning" aria-hidden />
          {warning}
        </div>
      ) : null}
    </div>
  );
}
