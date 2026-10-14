"use client";

import { Lock, NotebookPen } from "lucide-react";

import { ShallowLink } from "@/components/shared/shallow-link";
import { buttonVariants } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  AUTONOMY_META,
  allowedAutonomy,
  effectiveAutonomy,
  maxAutonomyFor,
  percent,
  supportHref,
  topicLabel,
  TOPICS,
} from "@/lib/customer-support";
import { trendText } from "@/lib/support-insights";
import type { AutonomyLevel, SupportWorkspace, Topic } from "@/types/customer-support";

const FOLLOW = "__follow";

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  );
}

/**
 * One kind of ticket (SPEC-346): how many came in and which way that moves, how far the agent
 * may go on it, how sure and how well it does, what it checks before answering, and whether
 * its replies may be approved in bulk. Never-auto topics stop at Draft and say why.
 */
export function TopicCard({
  topic,
  workspace,
  busy,
  onAutonomy,
  onBulkSafe,
}: {
  topic: Topic;
  workspace: SupportWorkspace;
  busy: boolean;
  onAutonomy: (level: AutonomyLevel | null) => void;
  onBulkSafe: (value: boolean) => void;
}) {
  const locked = maxAutonomyFor(topic.key, workspace.guardrails) !== "autopilot";
  const effective = effectiveAutonomy(topic.key, workspace);
  const labelId = `topic-${topic.key}`;
  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4" aria-labelledby={labelId}>
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 id={labelId} className="text-sm font-semibold text-foreground">
            {topicLabel(topic.key)}
          </h3>
          <p className="text-xs text-muted-foreground">
            {topic.volume7d} this week · {trendText(topic.trend)}
          </p>
        </div>
        {locked ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground" title="Set in Settings → Guardrails">
            <Lock className="size-3" aria-hidden /> Never automatic
          </span>
        ) : null}
      </header>

      <div className="grid grid-cols-3 gap-2">
        <Figure label="Confidence" value={topic.confidence === null ? "—" : percent(topic.confidence)} />
        <Figure label="CSAT" value={topic.csat === null ? "—" : `${topic.csat.toFixed(1)}/5`} />
        <Figure label="Resolved" value={percent(topic.resolutionRate)} />
      </div>

      <div className="space-y-1">
        <p className="text-[11px] font-semibold text-muted-foreground">Checks before answering</p>
        <ul className="space-y-0.5 text-xs text-foreground">
          {TOPICS[topic.key].checks.map((check) => (
            <li key={check} className="flex gap-1.5">
              <span aria-hidden className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground/60" />
              {check}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-auto space-y-2 border-t border-border pt-3">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor={`${labelId}-autonomy`} className="text-xs text-muted-foreground">
            Autonomy
          </label>
          <Select
            value={topic.autonomy ?? FOLLOW}
            onValueChange={(value) => onAutonomy(value === FOLLOW ? null : (value as AutonomyLevel))}
            disabled={busy}
          >
            <SelectTrigger id={`${labelId}-autonomy`} className="h-8 w-44 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={FOLLOW}>Follow the agent ({AUTONOMY_META[workspace.autonomy].label})</SelectItem>
              {allowedAutonomy(topic.key, workspace.guardrails).map((level) => (
                <SelectItem key={level} value={level}>
                  {AUTONOMY_META[level].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {effective !== (topic.autonomy ?? workspace.autonomy) ? (
          <p className="text-[11px] text-warning">In force now: {AUTONOMY_META[effective].label}{workspace.killSwitch.active ? " — the agent is paused" : ""}.</p>
        ) : null}
        <div className="flex items-center justify-between gap-2">
          <label htmlFor={`${labelId}-bulk`} className="text-xs text-muted-foreground">
            Safe to approve in bulk
          </label>
          <Switch id={`${labelId}-bulk`} checked={topic.bulkSafe} onCheckedChange={onBulkSafe} disabled={busy || locked} />
        </div>
        <ShallowLink href={supportHref("topics", { topic: topic.key })} className={buttonVariants({ size: "sm", variant: "outline", className: "w-full" })}>
          <NotebookPen aria-hidden /> Playbook & test bench
        </ShallowLink>
      </div>
    </article>
  );
}
