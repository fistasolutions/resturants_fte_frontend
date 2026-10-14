import Link from "next/link";

import { Card } from "@/components/ui/card";
import { formatDuration } from "@/lib/ai-value";
import type { AiAnomaly, AiKpis, AiToolUse } from "@/types/ai-value";

/** What the agents actually reached for.
 *
 * The section the trace data unlocks and nothing has ever shown: a run total says an
 * answer happened, this says the analyst consulted the returns data and the discount
 * ledger before giving it.
 */
export function AgentActivity({ tools, kpis }: { tools: AiToolUse[]; kpis: AiKpis }) {
  const busiest = Math.max(...tools.map((t) => t.calls), 1);
  return (
    <Card className="gap-0 p-4">
      <p className="text-sm font-semibold">What the agents reached for</p>
      <p className="mt-0.5 mb-3 text-xs text-muted-foreground">
        {kpis.toolCalls.toLocaleString("en-US")} tool calls across{" "}
        {kpis.runs.toLocaleString("en-US")} runs — {kpis.toolsPerRun} a run.
      </p>
      {tools.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No tool calls recorded yet in this period.
        </p>
      ) : (
        tools.map((tool) => (
          <div key={tool.tool} className="flex items-center gap-3 py-1.5">
            <span className="w-44 shrink-0 truncate font-mono text-xs">{tool.tool}</span>
            <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <span
                className="block h-full rounded-full bg-ai"
                style={{ width: `${Math.max(2, Math.round((tool.calls / busiest) * 100))}%` }}
              />
            </span>
            <span className="w-12 text-right text-xs font-semibold tabular-nums">
              {tool.calls}
            </span>
            <span className="w-14 text-right text-xs text-muted-foreground tabular-nums">
              {formatDuration(tool.avgMs)}
            </span>
          </div>
        ))
      )}
    </Card>
  );
}

/** Runs that were unusual **for their own surface** — 40 seconds is normal for an
 * article and alarming for a chat answer, so a single global threshold would flag the
 * wrong one and miss the right one. Each row says why it was picked and opens the trace. */
export function Anomalies({ anomalies }: { anomalies: AiAnomaly[] }) {
  return (
    <Card className="gap-0 p-4">
      <p className="text-sm font-semibold">Runs worth a second look</p>
      <p className="mt-0.5 mb-1 text-xs text-muted-foreground">
        Unusual for their own surface — not simply the most expensive.
      </p>
      {anomalies.length === 0 ? (
        <p className="py-3 text-sm text-muted-foreground">
          Nothing out of the ordinary. Every run finished in its usual time.
        </p>
      ) : (
        anomalies.map((anomaly) => (
          <Link
            key={anomaly.traceId}
            href={`/ai/traces/${anomaly.traceId}`}
            className="flex items-start gap-3 border-b border-border py-2.5 last:border-b-0 hover:bg-muted/40"
          >
            <span className="w-20 shrink-0 pt-0.5 text-xs font-semibold text-muted-foreground">
              {anomaly.at ? new Date(anomaly.at).toLocaleDateString() : "—"}
            </span>
            <span className="min-w-0 text-sm">
              <span className="font-semibold">{anomaly.label}</span>
              <span
                className={`ml-2 text-xs font-semibold ${
                  anomaly.reason === "failed" ? "text-destructive" : "text-warning"
                }`}
              >
                {anomaly.reason}
              </span>
              <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                {formatDuration(anomaly.durationMs)} · {anomaly.spanCount} steps
                {anomaly.error ? ` · ${anomaly.error}` : ""}
              </span>
            </span>
          </Link>
        ))
      )}
    </Card>
  );
}
