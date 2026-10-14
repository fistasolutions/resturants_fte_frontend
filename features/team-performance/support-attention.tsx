import Link from "next/link";
import { Mail, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { SupportUnderperformer } from "@/types/team-performance";

/** Support-agent supervision card (SPEC-148): agents whose first-response is materially
 * slower than the team, each with a one-click email to the support lead. State · Reason
 * · Action. Backend-computed; no entrance animation. */
export function SupportAttentionCard({ agents }: { agents: SupportUnderperformer[] }) {
  if (agents.length === 0) return null;
  return (
    <Card className="gap-3 border border-warning/30 bg-warning/5 p-4">
      <div className="flex items-center gap-2">
        <TriangleAlert className="size-4 shrink-0 text-warning" aria-hidden />
        <h2 className="text-sm font-semibold text-foreground">
          {agents.length} agent{agents.length === 1 ? "" : "s"} to coach
        </h2>
      </div>
      <div className="divide-y divide-border/60">
        {agents.map((a) => (
          <div
            key={a.gorgias_agent_id}
            className="flex flex-wrap items-center justify-between gap-3 py-2.5"
          >
            <p className="min-w-0 text-sm text-foreground">
              <span className={a.severity === "red" ? "text-destructive" : "text-warning"}>
                ●
              </span>{" "}
              {a.why}
            </p>
            <Button size="sm" variant={a.severity === "red" ? "default" : "outline"} asChild>
              <Link href={`/team-performance/agents/${a.gorgias_agent_id}/review`}>
                <Mail className="size-4" aria-hidden />
                Email support lead
              </Link>
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}
