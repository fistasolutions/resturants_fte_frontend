"use client";

import { CircleDot, Clock, GitBranch, Mail, MessageSquareText, Zap } from "lucide-react";

import { StatusBadge } from "@/components/shared/status-badge";
import { delayLabel, layoutFlow, type FlowMessage } from "@/lib/email-flow-layout";
import { cn } from "@/lib/utils";
import type { FlowStep } from "@/types/email-marketing";

const ICON = { trigger: Zap, delay: Clock, split: GitBranch, other: CircleDot } as const;
const INDENT = ["", "ml-8", "ml-16", "ml-24"] as const;

/**
 * A flow's journey as a vertical step diagram (SPEC-345): trigger → wait → split → message,
 * drawn with borders and indents from `layoutFlow` — tokens only, no canvas library. A
 * message opens its preview and editor.
 */
export function FlowJourney({ steps, onOpen }: { steps: FlowStep[]; onOpen: (message: FlowMessage) => void }) {
  const rows = layoutFlow(steps);
  return (
    <ol className="space-y-0" aria-label="Flow journey">
      {rows.map((row, i) => {
        const step = row.step;
        const isMessage = step.kind === "message";
        const Icon = isMessage ? (step.channel === "sms" ? MessageSquareText : Mail) : ICON[step.kind];
        return (
          <li key={`${step.id}-${i}`} className={cn("relative pb-3 pl-10", INDENT[Math.min(row.depth, INDENT.length - 1)], row.depth > 0 && "border-l border-dashed border-border")}>
            {row.branchStart ? (
              <span className={cn("mb-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", row.branch === "yes" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground")}>
                {row.branch === "yes" ? "Yes" : "No"}
              </span>
            ) : null}
            <span className="absolute top-0 bottom-0 left-4 w-px bg-border" aria-hidden />
            <span className={cn("absolute top-1 left-1 grid size-7 place-items-center rounded-lg border bg-card", isMessage ? "border-primary/40 text-primary" : "border-border text-muted-foreground")} aria-hidden>
              <Icon className="size-3.5" />
            </span>
            {isMessage ? (
              <button
                type="button"
                onClick={() => onOpen(step)}
                className="w-full rounded-xl border border-border bg-card px-3 py-2 text-left outline-none transition-colors hover:border-foreground/30 focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-extrabold tracking-widest text-muted-foreground uppercase">{step.label}</span>
                  <StatusBadge tone={step.status === "live" ? "success" : "neutral"}>{step.status === "live" ? "Live" : "Draft"}</StatusBadge>
                </span>
                <span className="block text-sm font-medium text-foreground">{step.subject}</span>
                <span className="block text-xs text-muted-foreground">{step.previewText}</span>
              </button>
            ) : (
              <div className="rounded-xl border border-dashed border-border px-3 py-2">
                <p className="text-[10px] font-extrabold tracking-widest text-muted-foreground uppercase">{step.kind === "trigger" ? "Trigger" : step.kind === "delay" ? "Wait" : step.kind === "split" ? "Split" : "Step"}</p>
                <p className="text-sm text-foreground">
                  {step.kind === "trigger" ? step.label : step.kind === "delay" ? delayLabel(step.hours) : step.label}
                </p>
                {(step.kind === "trigger" || step.kind === "other") && step.detail ? <p className="text-xs text-muted-foreground">{step.detail}</p> : null}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
