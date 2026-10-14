"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { AlertTriangle, Check, CheckCircle2, Circle, LoaderCircle, Minus, X } from "lucide-react";

import { GlispIcon } from "@/components/shared/glisp-icon";
import { RoleGate } from "@/components/shared/role-gate";
import { useWorkspace } from "@/features/workspace/workspace-provider";
import { REVIEW_HREF, researchToastView, stepClock, stepPosition } from "@/lib/brand-research";
import { isGuided } from "@/lib/company-switches";
import { elapsed } from "@/lib/competitors";
import { cn } from "@/lib/utils";
import type { ResearchStep } from "@/types/brand-research";

import { useBrandResearch } from "./brand-research-provider";

const HOST_ID = "media-toast-host";
const NEVER_CHANGES = () => () => {};

function useToastHost(): HTMLElement | null {
  const mounted = useSyncExternalStore(NEVER_CHANGES, () => true, () => false);
  return mounted ? document.getElementById(HOST_ID) : null;
}

function StepIcon({ step }: { step: ResearchStep }) {
  if (step.state === "done") return <Check className="size-3 text-success" aria-hidden />;
  if (step.state === "running") return <Circle className="size-3 fill-ai text-ai" aria-hidden />;
  if (step.state === "failed") return <AlertTriangle className="size-3 text-destructive" aria-hidden />;
  if (step.state === "skipped") return <Minus className="size-3 text-muted-foreground" aria-hidden />;
  return <Circle className="size-3 text-muted-foreground/50" aria-hidden />;
}

/**
 * The live Brand Researcher indicator (SPEC-341) — top right on every page, portalled into the
 * shared toast host like every toast. While it runs: how many steps are done and working, every
 * step with what it is doing or what it found and its clock (SPEC-367), the % and the time. When it ends: what it found and Review →. No entrance
 * animation (root Rule 9); the spinner and the bar are the only motion and both report
 * something real.
 */
export function BrandResearchToast() {
  const { run, close, start } = useBrandResearch();
  // SPEC-362: a guided organization follows the research in Setup; a full one keeps this toast.
  const guided = isGuided(useWorkspace().visibility);
  const [now, setNow] = useState(() => Date.now());
  const [retrying, setRetrying] = useState(false);
  useEffect(() => {
    if (run?.status !== "running") return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [run?.status]);
  const host = useToastHost();
  if (!run || !host || guided) return null;

  const view = researchToastView(run);
  const running = view.tone === "running";
  const position = stepPosition(run);

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      data-brand-research-toast={run.status}
      className={cn("w-full rounded-xl border bg-card p-3 shadow-lg", view.tone === "failed" ? "border-destructive/40" : "border-border")}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 shrink-0">
          {running ? (
            <LoaderCircle className="size-4 animate-spin text-ai" aria-hidden />
          ) : view.tone === "failed" ? (
            <AlertTriangle className="size-4 text-destructive" aria-hidden />
          ) : (
            <CheckCircle2 className="size-4 text-success" aria-hidden />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-sm font-medium text-foreground">
            <GlispIcon className="size-3.5" aria-hidden />
            <span className="min-w-0 truncate">{view.title}</span>
            {running ? (
              <span className="ml-auto shrink-0 text-xs font-semibold text-foreground tabular-nums">{view.progress}%</span>
            ) : null}
          </p>
          {running ? (
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>{position}</span>
              <span aria-hidden>·</span>
              <span className="tabular-nums">{elapsed(run.startedAt ?? new Date(now).toISOString(), now)}</span>
            </p>
          ) : null}
          {running ? (
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted" aria-hidden>
              <div className="h-full rounded-full bg-ai transition-[width] duration-300" style={{ width: `${view.progress}%` }} />
            </div>
          ) : null}
          <ul className="mt-2 space-y-1" aria-label="Research steps">
            {view.steps.map((step) => {
              const current = step.state === "running";
              return (
                <li key={step.key} className={cn("flex items-start gap-2 text-xs", current ? "text-foreground" : "text-muted-foreground")}>
                  <span className="mt-0.5 shrink-0">
                    <StepIcon step={step} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className={cn(current && "font-medium")}>{step.label}</span>
                      {stepClock(step, now) ? (
                        <span className="shrink-0 text-[11px] tabular-nums">{stepClock(step, now)}</span>
                      ) : null}
                    </span>
                    {step.detail && step.state !== "waiting" ? (
                      <span
                        className={cn(
                          "block text-[11px] leading-snug",
                          step.state === "failed" ? "text-destructive" : "text-muted-foreground",
                        )}
                      >
                        {step.detail}
                      </span>
                    ) : null}
                  </span>
                </li>
              );
            })}
          </ul>
          {running ? (
            <p className="mt-2 text-xs text-muted-foreground">Runs in the background — you can leave this page.</p>
          ) : view.tone === "failed" ? (
            <div className="mt-2 flex items-center justify-between gap-2">
              <p className="min-w-0 text-xs text-destructive">{view.summary}</p>
              <RoleGate need="brand_brain.manage">
              <button
                type="button"
                disabled={retrying}
                onClick={() => {
                  setRetrying(true);
                  void start()
                    .catch(() => {})
                    .finally(() => setRetrying(false));
                }}
                className="shrink-0 rounded-md border px-2.5 py-1 text-xs font-semibold outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              >
                Try again
              </button>
              </RoleGate>
            </div>
          ) : (
            <div className="mt-2 flex items-center justify-between gap-2">
              <p className="min-w-0 text-xs text-muted-foreground">{view.summary}</p>
              {view.canReview ? (
                <Link
                  href={REVIEW_HREF}
                  onClick={close}
                  className="inline-flex shrink-0 items-center rounded-md bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground outline-none hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Review →
                </Link>
              ) : null}
            </div>
          )}
        </div>
        {!running ? (
          <button
            type="button"
            onClick={close}
            aria-label="Hide"
            className="shrink-0 rounded-md p-1 text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-4" aria-hidden />
          </button>
        ) : null}
      </div>
    </div>,
    host,
  );
}
