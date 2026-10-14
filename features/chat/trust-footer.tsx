"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import {
  footerTone,
  freshnessSegments,
  hasReceipt,
  secondsLabel,
  toolsLabel,
  type FooterTone,
} from "@/lib/trust-footer";
import { cn } from "@/lib/utils";
import type { ChatSources } from "@/types/chat";

const DOT: Record<FooterTone, string> = {
  fresh: "bg-success",
  stale: "bg-warning",
  unknown: "bg-muted-foreground/60",
};

interface TrustFooterProps {
  sources: ChatSources;
  /** Tighter paddings for the Ask Glisp panel. */
  compact?: boolean;
}

/**
 * The trust footer (SPEC-264): one quiet line — how fresh each system's data was
 * and how many tools ran — that opens into the receipt: every tool call, what it
 * was asked, and the figures it returned. Everything here is from the run's own
 * records (backend SPEC-265); nothing is read from the prose.
 */
export function TrustFooter({ sources, compact = false }: TrustFooterProps) {
  const [open, setOpen] = useState(false);
  const calls = sources.calls ?? [];
  const freshness = sources.freshness ?? [];
  const tools = sources.tools ?? [];
  if (!sources.grounded || tools.length === 0) return null;

  const segments = freshnessSegments(freshness);
  const tone = footerTone(freshness);
  const receipt = hasReceipt(calls);
  // The receipt counts calls (a tool can run twice); an old answer only knows names.
  const count = receipt ? calls.length : tools.length;
  const pad = compact ? "px-3" : "px-4";

  const line = (
    <>
      <span className={cn("size-1.5 shrink-0 rounded-full", DOT[tone])} aria-hidden />
      {segments.length > 0 ? (
        segments.map((segment, index) => (
          <span key={segment.system} className="inline-flex items-center gap-1 whitespace-nowrap">
            {index > 0 && <span className="text-muted-foreground/50">·</span>}
            <span>{segment.system}</span>
            <b className={cn("font-semibold", segment.stale ? "text-warning" : "text-foreground")}>{segment.label}</b>
          </span>
        ))
      ) : (
        <span className="whitespace-nowrap">{(sources.systems ?? []).join(", ")}</span>
      )}
      <span className="text-muted-foreground/50">·</span>
      <span className="whitespace-nowrap">
        <b className="font-semibold text-foreground">{count}</b> {toolsLabel(count).replace(/^\d+ /, "")}
      </span>
    </>
  );

  return (
    <div className="border-t bg-muted/40 text-[11px] text-muted-foreground" data-trust-footer data-tone={tone}>
      {receipt ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={cn(
            "flex w-full flex-wrap items-center gap-x-2 gap-y-0.5 py-1.5 text-left outline-none transition-colors hover:bg-muted/70 focus-visible:ring-2 focus-visible:ring-ring",
            pad,
          )}
          data-trust-toggle
        >
          {line}
          <ChevronDown className={cn("ml-auto size-3.5 shrink-0 transition-transform", open && "rotate-180")} aria-hidden />
        </button>
      ) : (
        <div className={cn("flex flex-wrap items-center gap-x-2 gap-y-0.5 py-1.5", pad)}>{line}</div>
      )}

      {receipt && open && (
        <div className={cn("border-t pt-2 pb-2.5 text-xs", pad)} data-trust-receipt>
          {freshness.length > 0 && (
            <div className="mb-1.5 flex flex-wrap gap-x-4 gap-y-0.5 border-b pb-1.5 text-[11px]">
              {freshness.map((entry) => (
                <span key={entry.system} className="inline-flex items-center gap-1.5">
                  <span className={cn("size-1.5 rounded-full", entry.synced_at ? DOT[tone === "stale" ? "stale" : "fresh"] : DOT.unknown)} aria-hidden />
                  {entry.system}
                  {entry.synced_at ? (
                    <>
                      {" · last sync "}
                      {new Date(entry.synced_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                      {entry.records > 0 && ` · ${entry.records.toLocaleString("en-US")} records`}
                    </>
                  ) : (
                    " · computed live, no sync"
                  )}
                </span>
              ))}
            </div>
          )}
          <ol className="divide-y divide-dashed">
            {calls.map((call, index) => (
              <li key={`${call.tool}-${index}`} className="grid grid-cols-[1.25rem_1fr_auto] gap-x-2 py-1.5">
                <span className="mt-0.5 inline-flex size-4 items-center justify-center rounded-full border bg-card text-[10px] text-muted-foreground" aria-hidden>
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <div className="font-mono text-[11px] font-semibold text-foreground">{call.tool}</div>
                  {call.asked && <div className="text-muted-foreground">Asked: {call.asked}</div>}
                  {call.returned.length > 0 && (
                    <div className="mt-0.5 flex flex-wrap items-center gap-1">
                      <span className="text-muted-foreground">Returned:</span>
                      {call.returned.map((figure) => (
                        <span key={figure.key} className="rounded border bg-card px-1 font-mono text-[10.5px] text-foreground">
                          {figure.key} {figure.value}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-right text-[10px] text-muted-foreground whitespace-nowrap">
                  <div>{call.system}</div>
                  <div>{secondsLabel(call.ms)}</div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
