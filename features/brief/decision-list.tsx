"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { DecisionCard } from "@/features/brief/decision-card";
import { moreDecisionsLabel, splitDecisions } from "@/lib/brief-decisions";
import { cn } from "@/lib/utils";
import type { BriefDecision } from "@/types/brief";

interface DecisionListProps {
  decisions: BriefDecision[];
  preparedAt: string;
  readonly: boolean;
  compareLabel?: string;
}

/**
 * The rows of the Decisions panel (SPEC-231 Patches): the first five in the backend's
 * ranked order, the rest behind "Show N more decisions" — the same fold Needs Attention
 * has had since SPEC-224, so a busy morning grows a button, not a scroll box.
 */
export function DecisionList({ decisions, preparedAt, readonly, compareLabel }: DecisionListProps) {
  const [open, setOpen] = useState(false);
  const { primary, extra } = splitDecisions(decisions);
  const shown = open ? decisions : primary;

  return (
    <>
      {shown.map((decision) => (
        <DecisionCard
          key={decision.type}
          decision={decision}
          preparedAt={preparedAt}
          readonly={readonly}
          compareLabel={compareLabel}
        />
      ))}
      {extra.length > 0 ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
        >
          {open ? "Show fewer decisions" : moreDecisionsLabel(extra.length)}
          <ChevronDown
            className={cn("size-3.5 transition-transform", open && "rotate-180")}
            aria-hidden
          />
        </button>
      ) : null}
    </>
  );
}
