import { Bot } from "lucide-react";

import { formatNumber } from "@/utils/format";
import type { GorgiasAgentMetric } from "@/types/team-performance";

/** Bots/automation pooled out of the human leaderboard (SPEC-094 patch) — shown
 * as context, not ranked against people. */
export function AutomationStrip({ bots }: { bots: GorgiasAgentMetric[] }) {
  if (bots.length === 0) return null;
  const resolved = bots.reduce((sum, b) => sum + b.tickets_resolved, 0);
  const answered = bots.reduce((sum, b) => sum + b.tickets_answered, 0);
  return (
    <div className="flex items-center gap-3 rounded-card bg-muted/40 p-4 ring-1 ring-foreground/10">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-background text-muted-foreground">
        <Bot className="size-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">Automation</p>
        <p className="text-xs text-muted-foreground">
          {formatNumber(bots.length)} bot account{bots.length === 1 ? "" : "s"} handled{" "}
          <span className="font-medium text-foreground tabular-nums">
            {formatNumber(resolved)}
          </span>{" "}
          resolved ·{" "}
          <span className="font-medium text-foreground tabular-nums">
            {formatNumber(answered)}
          </span>{" "}
          answered — kept out of the human leaderboard.
        </p>
      </div>
    </div>
  );
}
