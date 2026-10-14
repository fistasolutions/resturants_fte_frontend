"use client";

import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiQuery } from "@/hooks/use-api-query";
import { formatDuration } from "@/lib/ai-value";
import { aiValueQueries } from "@/lib/queries/ai-value";

const KIND_TONE: Record<string, string> = {
  generation: "bg-ai/10 text-ai border-ai/20",
  function: "bg-info/10 text-info border-info/20",
  agent: "bg-primary/10 text-foreground border-border",
};

/** One run, step by step — the view a run total can never give (SPEC-236/226), read
 * from the client cache (SPEC-230). Indented by `parentSpanId` depth because the shape
 * is the finding: a critic loop reads as the same step repeating at the same level. */
export function TraceView({ traceId }: { traceId: string }) {
  const result = useApiQuery(aiValueQueries.trace(traceId));
  if (result.isPending) {
    return (
      <main className="min-w-0 flex-1 space-y-4 p-4 md:p-6">
        <PageHeader title="AI run" description="Every step this run took, in order." />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-96 rounded-2xl" />
      </main>
    );
  }
  if (result.isError) return <QueryErrorState error={result.error} onRetry={() => void result.refetch()} />;
  const trace = result.data;
  const depth = new Map<string, number>();
  for (const step of trace.steps) {
    depth.set(step.spanId, step.parentSpanId ? (depth.get(step.parentSpanId) ?? 0) + 1 : 0);
  }

  return (
    <main className="min-w-0 flex-1 space-y-4 p-4 md:p-6">
      <PageHeader title="AI run" description="Every step this run took, in order." />
      <Link href="/ai" className="text-sm text-muted-foreground hover:text-foreground">
        ← Back to AI Performance
      </Link>

      <Card className="gap-0 overflow-hidden py-0">
        {trace.steps.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">
            No steps were recorded for this run. Trace detail is kept for 45 days.
          </p>
        ) : (
          trace.steps.map((step) => (
            <div
              key={step.spanId}
              className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-2.5 last:border-b-0"
              style={{ paddingLeft: `${16 + (depth.get(step.spanId) ?? 0) * 18}px` }}
            >
              <span
                className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                  KIND_TONE[step.kind] ?? "bg-muted text-muted-foreground border-border"
                }`}
              >
                {step.kind}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{step.name}</span>
              {step.inputTokens + step.outputTokens > 0 && (
                <span className="text-xs text-muted-foreground tabular-nums">
                  {step.inputTokens.toLocaleString("en-US")} in ·{" "}
                  {step.outputTokens.toLocaleString("en-US")} out
                </span>
              )}
              <span className="w-16 text-right text-xs font-semibold tabular-nums">
                {formatDuration(step.durationMs)}
              </span>
              {step.error && (
                <span className="w-full text-xs font-medium text-destructive">{step.error}</span>
              )}
            </div>
          ))
        )}
      </Card>
    </main>
  );
}
