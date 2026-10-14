"use client";

import { ShallowLink } from "@/components/shared/shallow-link";
import { AUTONOMY_META, AUTONOMY_ORDER, supportHref, topicLabel } from "@/lib/customer-support";
import { cn } from "@/lib/utils";
import type { AutonomyLevel, SupportWorkspace, TopicKey } from "@/types/customer-support";

/**
 * Settings → Autonomy (SPEC-346): the agent's level, with what each means, and the topics that
 * override it. Approve to send is the default; Autopilot applies only to topics switched on.
 */
export function AutonomyCard({
  workspace,
  busy,
  onChange,
}: {
  workspace: SupportWorkspace;
  busy: boolean;
  onChange: (level: AutonomyLevel) => void;
}) {
  const overrides = Object.entries(workspace.topicAutonomy) as [TopicKey, AutonomyLevel][];
  return (
    <div className="space-y-4">
      <fieldset className="grid gap-2 sm:grid-cols-2" disabled={busy}>
        <legend className="sr-only">The agent’s autonomy</legend>
        {AUTONOMY_ORDER.map((level) => {
          const selected = workspace.autonomy === level;
          return (
            <label
              key={level}
              className={cn(
                "flex cursor-pointer gap-3 rounded-xl border p-3 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                selected ? "border-foreground bg-muted/40" : "border-border hover:border-foreground/40",
              )}
            >
              <input type="radio" name="autonomy" value={level} checked={selected} onChange={() => onChange(level)} className="mt-1" />
              <span>
                <span className="block text-sm font-semibold text-foreground">
                  {AUTONOMY_META[level].label}
                  {level === "approve" ? <span className="ml-1.5 text-xs font-normal text-muted-foreground">default</span> : null}
                </span>
                <span className="block text-xs text-muted-foreground">{AUTONOMY_META[level].description}</span>
              </span>
            </label>
          );
        })}
      </fieldset>
      {workspace.autonomy === "autopilot" ? (
        <p className="rounded-xl border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
          Autopilot for every topic sends without a click wherever the guardrails pass. Most stores keep the agent on Approve to send and switch on
          autopilot topic by topic.
        </p>
      ) : null}
      <div className="space-y-1.5">
        <p className="text-sm font-medium">Topics with their own level</p>
        {overrides.length === 0 ? (
          <p className="text-xs text-muted-foreground">None — every topic follows the agent.</p>
        ) : (
          <ul className="flex flex-wrap gap-1.5">
            {overrides.map(([topic, level]) => (
              <li key={topic} className="rounded-full border border-border px-2 py-0.5 text-xs">
                {topicLabel(topic)} · <span className="font-medium">{AUTONOMY_META[level].label}</span>
              </li>
            ))}
          </ul>
        )}
        <ShallowLink href={supportHref("topics")} className="inline-block text-xs font-medium text-primary underline-offset-4 hover:underline">
          Change them on Topics & playbooks
        </ShallowLink>
      </div>
    </div>
  );
}
