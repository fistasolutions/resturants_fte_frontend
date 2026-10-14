"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { proxyUrl } from "@/lib/client-api";
import { parseFrame } from "@/lib/first-sync";
import type { BootstrapPayload } from "@/lib/onboarding";
import { readBootstrap, retryBootstrap } from "@/services/onboarding";

const FALLBACK_POLL_MS = 3000;

interface FirstSync {
  payload: BootstrapPayload | null;
  dismissed: boolean;
  dismiss: () => void;
  retry: () => Promise<void>;
}

const FirstSyncContext = createContext<FirstSync>({
  payload: null,
  dismissed: true,
  dismiss: () => {},
  retry: async () => {},
});

export function useFirstSync(): FirstSync {
  return useContext(FirstSyncContext);
}

function finished(payload: BootstrapPayload | null): boolean {
  return payload !== null && (payload.state === "done" || payload.state === "failed");
}

/**
 * The store's first sync, followed live (SPEC-314). One read on mount; a synced store stops
 * there. A running one is followed over the backend's SSE stream (through `/api/proxy`),
 * falling back to a 3 s read if the stream cannot open.
 */
export function FirstSyncProvider({ children }: { children: React.ReactNode }) {
  const [payload, setPayload] = useState<BootstrapPayload | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    let alive = true;
    readBootstrap()
      .then((first) => {
        if (!alive) return;
        // A store synced before this session never shows the toast at all.
        if (first.state === "done") return;
        setPayload(first);
        setFollowing(!finished(first));
      })
      .catch(() => {
        // No store yet (409), no access, or the API briefly unreachable: nothing to follow;
        // the gate treats an unknown sync as ready, so no page is ever held on a guess.
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!following) return;
    let poll: number | undefined;
    const source = new EventSource(proxyUrl("/stores/current/bootstrap/events"));
    source.onmessage = (event) => {
      const next = parseFrame(event.data);
      if (!next) return;
      setPayload(next);
      if (finished(next)) {
        source.close();
        setFollowing(false);
      }
    };
    source.onerror = () => {
      source.close();
      if (poll !== undefined) return;
      poll = window.setInterval(async () => {
        try {
          const next = await readBootstrap();
          setPayload(next);
          if (finished(next)) {
            window.clearInterval(poll);
            setFollowing(false);
          }
        } catch {
          // Tried again on the next tick.
        }
      }, FALLBACK_POLL_MS);
    };
    return () => {
      source.close();
      if (poll !== undefined) window.clearInterval(poll);
    };
  }, [following]);

  const retry = useCallback(async () => {
    await retryBootstrap();
    const next = await readBootstrap();
    setPayload(next);
    setDismissed(false);
    setFollowing(!finished(next));
  }, []);

  const value = useMemo(
    () => ({ payload, dismissed, dismiss: () => setDismissed(true), retry }),
    [payload, dismissed, retry],
  );
  return <FirstSyncContext.Provider value={value}>{children}</FirstSyncContext.Provider>;
}
