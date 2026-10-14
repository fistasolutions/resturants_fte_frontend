"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { getActiveCompetitorRun, streamCompetitorRun } from "@/services/brand-brain-actions";
import type { CompetitorRun, CompetitorRunStep } from "@/types/brand-brain";

/**
 * Knows whether a competitor run (Find, or a read of one site) is in flight
 * anywhere in the app (SPEC-283). Mounted in the app shell so the top-right toast
 * follows the run across pages and survives a reload: the truth is the run row on
 * the backend (SPEC-280), and this provider follows it over SSE — every step as it
 * is written, then done or failed. On mount it asks for the active run, so a fresh
 * tab picks a running (or just-finished) run back up.
 */
interface CompetitorRunContextValue {
  run: CompetitorRun | null;
  /** Call right after starting a run so the toast appears without waiting a tick. */
  follow: (run: CompetitorRun) => void;
  dismissed: boolean;
  dismiss: () => void;
}

const CompetitorRunContext = createContext<CompetitorRunContextValue>({
  run: null,
  follow: () => {},
  dismissed: false,
  dismiss: () => {},
});

export const useCompetitorRun = () => useContext(CompetitorRunContext);

export function CompetitorRunProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [run, setRun] = useState<CompetitorRun | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const streaming = useRef<AbortController | null>(null);

  const stream = useCallback(
    (target: CompetitorRun) => {
      streaming.current?.abort();
      const controller = new AbortController();
      streaming.current = controller;
      const seen = new Set(target.steps.map((s) => `${s.at}|${s.label}`));
      void streamCompetitorRun(
        target.id,
        {
          onStep: (step: CompetitorRunStep) => {
            const key = `${step.at}|${step.label}`;
            if (seen.has(key)) return;
            seen.add(key);
            setRun((current) => (current && current.id === target.id ? { ...current, steps: [...current.steps, step] } : current));
          },
          onEnd: (final) => {
            setRun((current) => (current && current.id === target.id ? { ...current, ...final } : current));
            // Rows landed or changed: every competitor read (and Coverage) must repaint.
            void queryClient.invalidateQueries({ queryKey: ["brand-brain"] });
          },
        },
        controller.signal,
      ).catch(() => {
        // A dropped stream is not a failed run — the row still says what happened;
        // the next mount (or a manual refresh) reads it again.
      });
    },
    [queryClient],
  );

  const follow = useCallback(
    (target: CompetitorRun) => {
      setRun(target);
      setDismissed(false);
      if (target.status === "running") stream(target);
    },
    [stream],
  );

  // Deferred first look (restores the toast after a reload), one abort on cleanup.
  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void getActiveCompetitorRun(controller.signal)
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
    <CompetitorRunContext.Provider value={{ run, follow, dismissed, dismiss: () => setDismissed(true) }}>
      {children}
    </CompetitorRunContext.Provider>
  );
}
