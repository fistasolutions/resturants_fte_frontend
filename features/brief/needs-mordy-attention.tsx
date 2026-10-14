"use client";

import { CheckCircle2, ChevronDown, ExternalLink } from "lucide-react";
import { useState } from "react";

import { BriefDot, BriefPanel, BriefRow } from "@/features/brief/brief-panel";
import {
  checksSummary,
  deltaToneClass,
  sourceLabel,
  splitAttention,
} from "@/lib/brief-attention";
import { cn } from "@/lib/utils";
import type { BriefAttention, BriefAttentionItem } from "@/types/brief";

interface NeedsMordyAttentionProps {
  /** null when the fetch failed — the section renders nothing so the rest of
   * the brief still loads (SPEC-104). */
  data: BriefAttention | null;
}

function AttentionRow({ item }: { item: BriefAttentionItem }) {
  const countClass = item.status === "error" ? "text-destructive" : "text-warning";
  const source = sourceLabel(item.source);

  return (
    <BriefRow
      href={item.href}
      leading={<BriefDot tone={item.status} />}
      trailing={
        <div className="flex items-center gap-2">
          <span className={cn("text-base font-bold tabular-nums leading-tight", countClass)}>
            {item.count.toLocaleString()}
          </span>
          {item.href ? (
            <ExternalLink className="size-3.5 text-muted-foreground" aria-hidden />
          ) : null}
        </div>
      }
    >
      <p className="text-sm font-semibold leading-snug">
        {item.title}
        {/* Provenance: six of the nine checks watch systems the brief could not
            reach until backend SPEC-231 (chat tools beyond Shopify), and naming the source is what makes a new
            alarm believable rather than mysterious. */}
        {source ? (
          <span className="ml-2 text-[10px] font-semibold tracking-wider text-muted-foreground">
            {source}
          </span>
        ) : null}
      </p>
      <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{item.detail}</p>
      {item.delta_label ? (
        <div className="mt-1 flex flex-wrap items-center gap-2">
          {/* The element that turns a number into news. Outlined, never filled —
              six solid red pills would read as a crisis every morning. */}
          <span
            className={cn(
              "inline-flex rounded-full border bg-background px-2 py-0.5 text-[11px] font-semibold",
              deltaToneClass(item.delta_label, item.status),
            )}
          >
            {item.delta_label}
          </span>
          {item.evidence?.map((line) => (
            <span key={line} className="text-[11px] text-muted-foreground">
              {line}
            </span>
          ))}
        </div>
      ) : null}
    </BriefRow>
  );
}

export function NeedsMordyAttention({ data }: NeedsMordyAttentionProps) {
  const [open, setOpen] = useState(false);
  if (data === null) return null;

  const { primary, extra } = splitAttention(data);
  const summary = checksSummary(data);

  return (
    <BriefPanel title="Needs Attention" count={summary || undefined}>
      {data.items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 bg-success/5 px-4 py-6 text-center">
          <CheckCircle2 className="size-6 text-success" aria-hidden />
          <p className="text-sm font-medium text-foreground">
            Nothing needs your attention this morning
          </p>
          <p className="max-w-md text-sm text-muted-foreground">
            {data.checks_run
              ? `All ${data.checks_run} checks ran and none crossed its threshold. Backlogs are sitting at their normal size.`
              : "Every check ran and none crossed its threshold."}
          </p>
        </div>
      ) : (
        <>
          {primary.map((item) => (
            <AttentionRow key={item.key} item={item} />
          ))}
          {open ? extra.map((item) => <AttentionRow key={item.key} item={item} />) : null}

          {extra.length > 0 ? (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="flex w-full items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
            >
              {open
                ? "Hide lower-value alerts"
                : `Show ${extra.length} lower-value alert${extra.length === 1 ? "" : "s"}`}
              <ChevronDown
                className={cn("size-3.5 transition-transform", open && "rotate-180")}
                aria-hidden
              />
            </button>
          ) : null}
        </>
      )}
    </BriefPanel>
  );
}
