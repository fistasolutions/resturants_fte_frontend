"use client";

import { useState } from "react";

import { Card } from "@/components/ui/card";
import { eventKindLabel } from "@/lib/brand-brain";
import { cn } from "@/lib/utils";
import type { BrandBrainEvent } from "@/types/brand-brain";
import { formatDateTime } from "@/utils/format";

const TONE: Record<string, string> = {
  fact_approved: "bg-success/10 text-success",
  source_ready: "bg-success/10 text-success",
  confirmed: "bg-success/10 text-success",
  persona_confirmed: "bg-success/10 text-success",
  fact_rejected: "bg-muted text-muted-foreground",
  source_failed: "bg-destructive/10 text-destructive",
  fact_deleted: "bg-destructive/10 text-destructive",
  rule_deleted: "bg-destructive/10 text-destructive",
  source_deleted: "bg-destructive/10 text-destructive",
  voice_derived: "bg-ai/10 text-ai",
};

/** Every change, newest first — who, when, from what (SPEC-263). Since SPEC-281 it
 * is a panel, not a tab: Coverage shows the latest `limit` with Show all, and the
 * detail pages (SPEC-274) reuse it for one item's own events. */
export function HistoryView({
  events,
  title = "History",
  subtitle = "every change, who, when, from what",
  empty = "No changes recorded yet — approve a fact or add a rule and it lands here.",
  limit,
}: {
  events: BrandBrainEvent[];
  title?: string;
  subtitle?: string;
  empty?: string;
  /** Show only the newest `limit` until the owner asks for all. */
  limit?: number;
}) {
  const [all, setAll] = useState(false);
  const shown = limit && !all ? events.slice(0, limit) : events;
  const hidden = events.length - shown.length;
  return (
    <Card className="gap-0 p-0">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      {events.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="divide-y divide-border">
          {shown.map((e) => (
            <li key={e.id} className="grid grid-cols-[9rem_1fr_auto] items-start gap-3 px-5 py-3 text-sm">
              <span className="text-xs text-muted-foreground tabular-nums">{e.at ? formatDateTime(e.at) : "—"}</span>
              <span>
                {e.detail}
                {e.actor ? <span className="block text-[11px] text-muted-foreground">{e.actor}</span> : null}
              </span>
              <span className={cn("rounded-md px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap", TONE[e.kind] ?? "bg-muted text-muted-foreground")}>
                {eventKindLabel(e.kind)}
              </span>
            </li>
          ))}
        </ul>
      )}
      {hidden > 0 ? (
        <button type="button" onClick={() => setAll(true)} className="w-full border-t border-border px-5 py-2 text-left text-xs text-muted-foreground hover:text-foreground">
          Show all {events.length} changes
        </button>
      ) : null}
    </Card>
  );
}
