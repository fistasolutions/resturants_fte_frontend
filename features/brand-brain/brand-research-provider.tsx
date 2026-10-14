"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useCan } from "@/hooks/use-can";
import {
  getActiveBrandResearch,
  markBrandResearchSeen,
  startBrandResearch,
  streamBrandResearch,
} from "@/services/brand-research-actions";
import type { ResearchRun } from "@/types/brand-research";

/**
 * Knows whether the Brand Researcher is working for this store (SPEC-341, backend SPEC-347).
 * Mounted once in the app shell, so the top-right toast follows the run across pages and
 * comes back after a reload: the truth is the run row, read on mount from `research/active`
 * and followed over SSE until it ends. A finished run stays until the owner opens the review
 * or dismisses it — both mark it seen, so it is not offered again.
 */
interface BrandResearchContextValue {
  run: ResearchRun | null;
  /** Show and follow a run started from a page ("Research my brand"). */
  follow: (run: ResearchRun) => void;
  /** Start a run now (or pick up the one going) and follow it. */
  start: () => Promise<ResearchRun>;
  /** Hide the toast; a finished run is marked seen. */
  close: () => void;
}

const BrandResearchContext = createContext<BrandResearchContextValue>({
  run: null,
  follow: () => {},
  start: async () => {
    throw new Error("Brand research is not available here.");
  },
  close: () => {},
});

export const useBrandResearch = () => useContext(BrandResearchContext);

export function BrandResearchProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const can = useCan();
  // Starting a run and marking one seen are writes (SPEC-358): a role without them follows only.
  const manage = can("brand_brain.manage");
  const [run, setRun] = useState<ResearchRun | null>(null);
  const streaming = useRef<AbortController | null>(null);

  const refresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["brand-brain"] });
    void queryClient.invalidateQueries({ queryKey: ["spotlight", "brand-brain"] });
  }, [queryClient]);

  const stream = useCallback(
    (target: ResearchRun) => {
      streaming.current?.abort();
      const controller = new AbortController();
      streaming.current = controller;
      void streamBrandResearch(
        target.id,
        {
          onRun: (next) => setRun((current) => (current && current.id === next.id ? next : current)),
          onEnd: (final) => {
            setRun((current) => (current && current.id === final.id ? final : current));
            // Findings landed: the review, Coverage and every tab repaint.
            refresh();
          },
        },
        controller.signal,
      ).catch(() => {
        // A dropped stream is not a failed run — the row still says what happened, and the
        // next mount reads it again.
      });
    },
    [refresh],
  );

  const follow = useCallback(
    (target: ResearchRun) => {
      setRun(target);
      if (target.status === "running") stream(target);
    },
    [stream],
  );

  const start = useCallback(async () => {
    if (!manage.allowed) throw new Error(manage.reason ?? "Your role can't start brand research.");
    const started = await startBrandResearch();
    follow(started);
    return started;
  }, [follow, manage.allowed, manage.reason]);

  const close = useCallback(() => {
    setRun((current) => {
      if (current && current.status !== "running" && manage.allowed) void markBrandResearchSeen(current.id).catch(() => {});
      return current && current.status === "running" ? current : null;
    });
  }, [manage.allowed]);

  // Deferred first look (restores the toast after a reload), one abort on cleanup.
  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void getActiveBrandResearch(controller.signal)
        .then((active) => {
          if (!active || controller.signal.aborted) return;
          setRun(active);
          if (active.status === "running") stream(active);
        })
        .catch(() => {});
    }, 0);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
      streaming.current?.abort();
    };
  }, [stream]);

  return (
    <BrandResearchContext.Provider value={{ run, follow, start, close }}>{children}</BrandResearchContext.Provider>
  );
}
