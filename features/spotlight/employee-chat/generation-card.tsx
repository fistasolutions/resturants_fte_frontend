"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, FileText, Loader2, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { elapsedLabel, progressLine, shouldKeepPolling, type GenerationJob } from "@/lib/generation";
import { getGeneration } from "@/services/spotlight-generation";
import type { EmployeeCard } from "@/types/chat";
import { cn } from "@/lib/utils";

const POLL_MS = 3000;

/**
 * The card under a reply that started an article (SPEC-293): the job by id — the
 * SPEC-216 progress line while it runs (polled every 3 s, stopped once it is
 * terminal), then Draft ready with Open full to the draft page, or the backend's
 * reason when it failed. After a reload the card re-reads the job, so an old thread
 * still shows what became of the run.
 */
export function GenerationCard({ card }: { card: EmployeeCard }) {
  const jobId = card.job_id;
  const [job, setJob] = useState<GenerationJob | null>(null);
  const [missing, setMissing] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const running = shouldKeepPolling(job) || (job === null && !missing);

  useEffect(() => {
    if (typeof jobId !== "number") return;
    const controller = new AbortController();
    const read = async () => {
      try {
        const next = await getGeneration(jobId);
        if (controller.signal.aborted) return;
        if (next === null) setMissing(true);
        else setJob(next);
      } catch {
        // The next poll is three seconds away.
      }
    };
    const first = window.setTimeout(read, 0);
    const repeat = running ? window.setInterval(read, POLL_MS) : undefined;
    const clock = running ? window.setInterval(() => setNow(new Date()), 1000) : undefined;
    return () => {
      controller.abort();
      window.clearTimeout(first);
      if (repeat !== undefined) window.clearInterval(repeat);
      if (clock !== undefined) window.clearInterval(clock);
    };
  }, [jobId, running]);

  const title = card.keyword ?? job?.keyword ?? "the article";
  const state = job?.status ?? (missing ? "failed" : "running");

  return (
    <div
      className={cn(
        "mt-3 rounded-xl border bg-card p-3",
        state === "succeeded" ? "border-success/30" : state === "failed" ? "border-destructive/30" : "border-ai/30",
      )}
      data-generation-card={state}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-lg",
            state === "succeeded" ? "bg-success/10 text-success" : state === "failed" ? "bg-destructive/10 text-destructive" : "bg-ai/10 text-ai",
          )}
          aria-hidden
        >
          {state === "running" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : state === "failed" ? (
            <TriangleAlert className="size-4" />
          ) : (
            <FileText className="size-4" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
            {state === "succeeded" ? "Draft ready" : state === "failed" ? "Writing stopped" : "Writing now"}
          </p>
          <p className="truncate text-sm font-semibold text-foreground capitalize" title={title}>
            {title}
          </p>
          <p className="text-xs text-muted-foreground" aria-live="polite">
            {job
              ? state === "running"
                ? `${progressLine(job)} · ${elapsedLabel(job.startedAt, now)}`
                : progressLine(job)
              : missing
                ? "This run is no longer on record."
                : "Starting…"}
          </p>
          {card.note ? <p className="mt-1 text-xs text-muted-foreground">Angle: {card.note}</p> : null}
        </div>
        {state === "succeeded" && job?.draftId ? (
          <Button size="sm" asChild>
            <Link href={`/spotlight/draft/${job.draftId}`} aria-label="Open the draft in full">
              Open full
              <ExternalLink className="size-3.5" aria-hidden />
            </Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
