"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { AlertTriangle, Check, CheckCircle2, Circle, LoaderCircle, X } from "lucide-react";

import { GlispIcon } from "@/components/shared/glisp-icon";
import { hidesCompetitorRun } from "@/lib/brand-research";
import { competitorHref, competitorsHref, elapsed, runProgress, runTitle } from "@/lib/competitors";
import { cn } from "@/lib/utils";

import { useBrandResearch } from "./brand-research-provider";
import { useCompetitorRun } from "./competitor-run-provider";

const HOST_ID = "media-toast-host";
const NEVER_CHANGES = () => () => {};
const STEPS_SHOWN = 6;

function useToastHost(): HTMLElement | null {
  const mounted = useSyncExternalStore(NEVER_CHANGES, () => true, () => false);
  return mounted ? document.getElementById(HOST_ID) : null;
}

/**
 * The live competitor-run indicator (SPEC-283) — top right, on every page, portalled
 * into the shared toast host like the generation toast. Every step the run writes
 * appears with a tick; on done it offers Review; on failed it says why. No entrance
 * animation (root Rule 9); the spinner is the only motion and it reports something real.
 */
export function CompetitorRunToast() {
  const { run, dismissed, dismiss } = useCompetitorRun();
  // SPEC-341: the Brand Researcher's own competitor Find is told in its toast — one story.
  const { run: research } = useBrandResearch();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (run?.status !== "running") return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [run?.status]);
  const host = useToastHost();
  if (!run || dismissed || !host || hidesCompetitorRun(research, run.id)) return null;

  const running = run.status === "running";
  const failed = run.status === "failed";
  const done = run.status === "done";
  const steps = run.steps.slice(-STEPS_SHOWN);
  const target = run.kind === "read" && run.competitorId ? competitorHref(run.competitorId) : competitorsHref("review");

  return createPortal(
    <div role="status" aria-live="polite" data-competitor-toast={run.status} className={cn("w-[360px] rounded-xl border bg-card p-3 shadow-lg", failed ? "border-destructive/40" : "border-border")}>
      <div className="flex items-start gap-3">
        <span className="mt-0.5 shrink-0">
          {running ? <LoaderCircle className="size-4 animate-spin text-ai" aria-hidden /> : failed ? <AlertTriangle className="size-4 text-destructive" aria-hidden /> : <CheckCircle2 className="size-4 text-success" aria-hidden />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-sm font-medium text-foreground">
            <GlispIcon className="size-3.5" aria-hidden />
            {runTitle(run)}
            {running ? <span className="ml-auto text-xs font-normal text-muted-foreground tabular-nums">{elapsed(run.startedAt, now)}</span> : null}
          </p>
          {steps.length > 0 ? (
            <ul className="mt-2 space-y-1">
              {steps.map((s, i) => {
                const last = i === steps.length - 1;
                const current = running && last;
                return (
                  <li key={`${s.at}|${s.label}`} className={cn("flex items-start gap-2 text-xs", current ? "text-foreground" : "text-muted-foreground")}>
                    <span className="mt-0.5 shrink-0">
                      {current ? <Circle className="size-3 fill-ai text-ai" aria-hidden /> : <Check className="size-3 text-success" aria-hidden />}
                    </span>
                    <span className="min-w-0">{s.label}</span>
                  </li>
                );
              })}
            </ul>
          ) : null}
          {running ? (
            <>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted" aria-hidden>
                <div className="h-full rounded-full bg-ai transition-[width] duration-300" style={{ width: `${Math.round(runProgress(run) * 100)}%` }} />
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">Runs in the background — you can leave this page.</p>
            </>
          ) : failed ? (
            <p className="mt-1.5 text-xs text-destructive">{run.error ?? "The run stopped before it finished."}</p>
          ) : (
            <div className="mt-2 flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">{done && run.found > 0 ? "Waiting for your review." : "Nothing new to review."}</p>
              {done && run.found > 0 ? (
                <Link href={target} onClick={dismiss} className="inline-flex items-center rounded-md bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground outline-none hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring">
                  Review {run.kind === "find" ? run.found : ""} →
                </Link>
              ) : null}
            </div>
          )}
        </div>
        <button type="button" onClick={dismiss} aria-label="Hide" className="shrink-0 rounded-md p-1 text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
          <X className="size-4" aria-hidden />
        </button>
      </div>
    </div>,
    host,
  );
}
