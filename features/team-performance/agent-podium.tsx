import Link from "next/link";
import { Crown } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDuration } from "@/lib/format-duration";
import { initials } from "@/lib/initials";
import { formatNumber } from "@/utils/format";
import type { GorgiasAgentMetric } from "@/types/team-performance";

const MEDAL: Record<number, { ring: string; chip: string; label: string }> = {
  1: { ring: "ring-warning/40", chip: "bg-warning/15 text-warning", label: "1st" },
  2: { ring: "ring-foreground/15", chip: "bg-muted text-foreground", label: "2nd" },
  3: { ring: "ring-brand/30", chip: "bg-brand/10 text-brand", label: "3rd" },
};

function CsatDot({ csat }: { csat: number | null }) {
  if (csat === null) return null;
  const tone =
    csat >= 4.5 ? "text-success" : csat >= 3.5 ? "text-warning" : "text-destructive";
  return <span className={`font-medium tabular-nums ${tone}`}>CSAT {csat.toFixed(1)}</span>;
}

function PodiumCard({
  agent,
  rank,
  href,
}: {
  agent: GorgiasAgentMetric;
  rank: number;
  href: string;
}) {
  const medal = MEDAL[rank];
  const first = rank === 1;
  const name = agent.staff_name ?? agent.name ?? "Unknown";
  // Center (1st) elevated; 2nd/3rd order around it on sm+ (2 · 1 · 3).
  const order = first ? "sm:order-2" : rank === 2 ? "sm:order-1" : "sm:order-3";
  return (
    <Link
      href={href}
      className={`group flex flex-col items-center rounded-card bg-card text-center ring-1 transition-colors hover:ring-foreground/25 ${medal.ring} ${order} ${
        first ? "p-6 sm:-mt-4" : "p-5"
      }`}
    >
      {first ? <Crown className="mb-1 size-5 text-warning" aria-hidden /> : null}
      <Avatar size="lg" className={first ? "size-14" : ""}>
        <AvatarFallback className="font-medium">{initials(name)}</AvatarFallback>
      </Avatar>
      <p className="mt-3 line-clamp-2 text-sm font-semibold text-foreground">{name}</p>
      <span className={`mt-1 rounded-full px-2 py-0.5 text-xs font-semibold ${medal.chip}`}>
        {medal.label}
      </span>
      <p
        className={`mt-3 font-heading tracking-wide tabular-nums text-foreground ${
          first ? "text-3xl" : "text-2xl"
        }`}
      >
        {formatNumber(agent.tickets_resolved)}
      </p>
      <p className="text-xs text-muted-foreground">resolved</p>
      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
        <CsatDot csat={agent.csat} />
        {agent.csat !== null && agent.avg_first_response_seconds !== null ? <span>·</span> : null}
        {agent.avg_first_response_seconds !== null ? (
          <span className="tabular-nums">{formatDuration(agent.avg_first_response_seconds)} 1st</span>
        ) : null}
      </div>
    </Link>
  );
}

/** Top-3 human agents by resolved volume (SPEC-094 leaderboard patch) — a
 * podium: 2nd · 1st (elevated + crown) · 3rd on desktop, stacked on mobile. */
export function AgentPodium({
  agents,
  returnTo,
}: {
  agents: GorgiasAgentMetric[];
  returnTo: string;
}) {
  const top = agents.slice(0, 3);
  if (top.length === 0) return null;
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-end">
      {top.map((agent, i) => (
        <PodiumCard
          key={agent.gorgias_agent_id}
          agent={agent}
          rank={i + 1}
          href={`/team-performance/agents/${agent.gorgias_agent_id}?returnTo=${encodeURIComponent(returnTo)}`}
        />
      ))}
    </div>
  );
}
