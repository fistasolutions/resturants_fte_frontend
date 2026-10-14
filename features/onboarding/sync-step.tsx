"use client";

import { useEffect, useState } from "react";
import { Check, CircleAlert, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FormAlert } from "@/features/auth/form-alert";
import {
  dashboardReady,
  syncFinished,
  syncSteps,
  type BootstrapPayload,
} from "@/lib/onboarding";
import { cn } from "@/lib/utils";
import { readBootstrap, retryBootstrap } from "@/services/onboarding";

const POLL_MS = 2000;

/** The first sync, step by step (backend SPEC-316), read every two seconds until it ends. */
export function SyncStep({ initial }: { initial: BootstrapPayload | null }) {
  const [payload, setPayload] = useState<BootstrapPayload | null>(initial);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const finished = payload !== null && syncFinished(payload);

  useEffect(() => {
    if (finished) return;
    let alive = true;
    const timer = window.setInterval(async () => {
      try {
        const next = await readBootstrap();
        if (alive) setPayload(next);
      } catch {
        // A missed read is retried on the next tick; the list keeps its last state.
      }
    }, POLL_MS);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [finished]);

  async function retry() {
    setRetrying(true);
    setError(null);
    try {
      await retryBootstrap();
      setPayload(await readBootstrap());
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not start it again.");
    } finally {
      setRetrying(false);
    }
  }

  if (payload === null) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
        <LoaderCircle className="size-4 animate-spin" aria-hidden />
        Starting your first sync…
      </p>
    );
  }

  const steps = syncSteps(payload);
  return (
    <div className="space-y-6">
      <ul className="space-y-3" aria-live="polite">
        {steps.map((step) => (
          <li key={step.key} className="flex items-center gap-3 text-sm">
            <span className="flex size-5 items-center justify-center" aria-hidden>
              {step.state === "done" ? (
                <Check className="size-4 text-primary" />
              ) : step.state === "running" ? (
                <LoaderCircle className="size-4 animate-spin text-muted-foreground" />
              ) : step.state === "failed" ? (
                <CircleAlert className="size-4 text-destructive" />
              ) : (
                <span className="size-1.5 rounded-full bg-border" />
              )}
            </span>
            <span className={cn(step.state === "waiting" && "text-muted-foreground")}>
              {step.title}
            </span>
          </li>
        ))}
      </ul>

      {payload.state === "failed" ? (
        <div className="space-y-3">
          <FormAlert message={payload.error ?? "The first sync stopped."} />
          <FormAlert message={error} />
          <Button className="w-full" disabled={retrying} onClick={() => void retry()}>
            {retrying ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : null}
            Try again
          </Button>
        </div>
      ) : (
        <Button
          className="w-full"
          disabled={!dashboardReady(payload)}
          onClick={() => window.location.assign("/")}
        >
          {dashboardReady(payload) ? "Open your dashboard" : "Your orders are on their way…"}
        </Button>
      )}
      {!finished && dashboardReady(payload) ? (
        <p className="text-center text-xs text-muted-foreground">
          The rest keeps syncing in the background — each screen appears as its data lands.
        </p>
      ) : null}
    </div>
  );
}
