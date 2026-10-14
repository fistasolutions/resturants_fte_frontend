import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { Card } from "@/components/ui/card";
import {
  formatDuration,
  formatOutcome,
  healthTone,
  relativeTime,
} from "@/lib/system-trace";
import type { SystemJob } from "@/types/system";

/**
 * One job (SPEC-228). Clicking it opens that job's own run history.
 *
 * The card answers, in order: is it healthy, what is it for, when did it last
 * succeed, and what did it produce. That order is deliberate — the health is why
 * someone is looking, and the purpose is what makes an unfamiliar job id mean
 * something to a person who did not build it.
 */
export function JobCard({ job }: { job: SystemJob }) {
  const tone = healthTone(job.health);
  const run = job.latestRun;
  const produced = formatOutcome(run?.outcome ?? null);

  return (
    <Link
      href={`/system/${job.key}`}
      className="block rounded-2xl outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Card className="h-full gap-0 p-4 transition-colors hover:border-foreground/20">
        <div className="flex items-start gap-2">
          <span className={`mt-1.5 size-2 shrink-0 rounded-full ${tone.dot}`} aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{job.title}</p>
            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
              {job.purpose}
            </p>
          </div>
          <ChevronRight
            className="mt-0.5 size-4 shrink-0 text-muted-foreground"
            aria-hidden
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${tone.chip}`}
          >
            {tone.label}
          </span>
          <span className="text-[11px] text-muted-foreground">{job.cadenceLabel}</span>
        </div>

        <dl className="mt-3 space-y-1 border-t border-border pt-3 text-xs">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Last success</dt>
            <dd className="tabular-nums">{relativeTime(job.lastSuccessAt)}</dd>
          </div>
          {run ? (
            <>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Last run</dt>
                <dd className="tabular-nums">
                  {relativeTime(run.startedAt)} · {formatDuration(run.durationMs)}
                </dd>
              </div>
              {produced && (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Produced</dt>
                  <dd className="truncate">{produced}</dd>
                </div>
              )}
              {run.detail && !produced && (
                <p className="text-muted-foreground italic">{run.detail}</p>
              )}
              {run.error && (
                // The message only — the API never returns a stack (root Rule 6).
                <p className="line-clamp-2 text-destructive">{run.error}</p>
              )}
            </>
          ) : (
            // Never a blank space: "no runs recorded" is the finding, not missing data.
            <p className="text-muted-foreground">
              {job.expected
                ? "No runs recorded — this job has never reported."
                : "Not configured yet."}
            </p>
          )}
        </dl>
      </Card>
    </Link>
  );
}
