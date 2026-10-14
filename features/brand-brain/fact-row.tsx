"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, CircleDashed, CircleOff, FileText, Gauge, MoreHorizontal, User, X } from "lucide-react";

import { confirmCopy } from "@/lib/confirm";
import { useConfirm } from "@/components/shared/confirm-provider";
import { RoleButton, RoleGate } from "@/components/shared/role-gate";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { conflictCurrentValue, factHref, factNeedsDecision, factSourceLine } from "@/lib/brand-brain";
import { cn } from "@/lib/utils";
import { approveFact, rejectFact, setFactEnabled } from "@/services/brand-brain-actions";
import { deleteFact } from "@/services/spotlight-actions";
import type { Fact } from "@/types/spotlight";
import { formatDate } from "@/utils/format";

export interface FactRowProps {
  fact: Fact;
  sourceTitles: ReadonlyMap<number, string>;
  selected: boolean;
  focused: boolean;
  /** Selection mode (the toolbar's Select): boxes instead of the status glyph. */
  selecting: boolean;
  onSelect: (id: number, on: boolean) => void;
  onChanged: () => void;
}

const EDGE: Record<string, string> = {
  pending: "border-l-warning",
  conflict: "border-l-destructive",
  rejected: "border-l-transparent opacity-60",
};

/** The row's state at a glance — a green tick means approved and read by the writers. */
function StateGlyph({ status, off }: { status: string; off: boolean }) {
  if (status === "pending") return <CircleDashed className="size-4 text-warning" aria-label="Awaiting your decision" />;
  if (status === "conflict") return <AlertTriangle className="size-4 text-destructive" aria-label="Conflicts with the approved value" />;
  if (status === "rejected") return <X className="size-4 text-muted-foreground" aria-label="Rejected" />;
  if (off) return <CircleOff className="size-4 text-muted-foreground" aria-label="Switched off" />;
  return <Check className="size-4 text-success" aria-label="Approved" />;
}

function SourceIcon({ source }: { source: Fact["source"] }) {
  if (source === "file") return <FileText className="size-3" aria-hidden />;
  if (source === "measured") return <Gauge className="size-3" aria-hidden />;
  return <User className="size-3" aria-hidden />;
}

/**
 * One fact on the Facts tab (SPEC-274): one line — label, the source inline, the value
 * truncated — with a coloured left edge for pending / conflict / off. Actions live
 * on hover and, for a row that needs a decision, always. The row opens its page.
 */
export function FactRow({ fact, sourceTitles, selected, focused, selecting, onSelect, onChanged }: FactRowProps) {
  const confirm = useConfirm();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const status = fact.status ?? "approved";
  const off = fact.enabled === false;
  const stored = fact.id != null;
  const line = factSourceLine(fact, sourceTitles, formatDate);
  const current = conflictCurrentValue(fact);

  async function run(action: () => Promise<unknown>) {
    setError(null);
    setBusy(true);
    try {
      await action();
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save — try again.");
    } finally {
      setBusy(false);
    }
  }

  function open() {
    if (stored) router.push(factHref(fact.id as number));
  }

  return (
    <div
      role="row"
      data-fact-row={status}
      data-focused={focused || undefined}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === "Enter" && e.target === e.currentTarget) open();
      }}
      tabIndex={stored ? 0 : -1}
      className={cn(
        "grid grid-cols-[20px_minmax(0,1fr)_auto] items-center gap-3 border-b border-border border-l-[3px] py-2 pr-3 pl-2 text-sm outline-none transition-colors last:border-b-0",
        stored ? "cursor-pointer hover:bg-accent/60" : "cursor-default",
        EDGE[status] ?? (off ? "border-l-border" : "border-l-transparent"),
        (selected || focused) && "bg-accent",
        "group",
      )}
    >
      {selecting && stored && status !== "rejected" ? (
        <input
          type="checkbox"
          aria-label={`Select ${fact.label}`}
          checked={selected}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => onSelect(fact.id as number, e.target.checked)}
          className="size-3.5 accent-foreground"
        />
      ) : (
        <span className="grid place-items-center">
          <StateGlyph status={status} off={off} />
        </span>
      )}
      <div className="min-w-0">
        <p className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className={cn("text-[13px] font-semibold", off && "text-muted-foreground")}>{fact.label}</span>
          <span className="inline-flex min-w-0 items-center gap-1 text-[11px] text-muted-foreground">
            <SourceIcon source={fact.source} />
            <span className="font-medium text-foreground/80">{line.name}</span>
            {line.detail ? <span className="truncate">· {line.detail}</span> : null}
          </span>
          {off ? <span className="rounded-full border border-border px-1.5 text-[10px] font-medium text-muted-foreground">switched off</span> : null}
          {status === "rejected" ? <span className="rounded-full border border-border px-1.5 text-[10px] font-medium text-muted-foreground">rejected</span> : null}
        </p>
        {status === "conflict" && current ? (
          <p className="truncate text-[13px]">
            <span className="text-muted-foreground line-through">{current}</span> <span aria-hidden>→</span> <span>{fact.value}</span>
          </p>
        ) : (
          <p className={cn("truncate text-[13px]", off || status === "rejected" ? "text-muted-foreground" : "text-foreground/90")}>{fact.value}</p>
        )}
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </div>
      <div
        className={cn("flex items-center gap-1", factNeedsDecision(fact) || status === "rejected" ? "" : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 group-data-[focused]:opacity-100")}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {!stored ? (
          <span className="text-[11px] text-muted-foreground">read-only</span>
        ) : status === "conflict" ? (
          <>
            <RoleButton need="brand_brain.manage" size="sm" disabled={busy} onClick={() => void run(() => approveFact(fact.id as number))} className="h-7 bg-success text-success-foreground hover:bg-success/90">
              Replace
            </RoleButton>
            <RoleButton need="brand_brain.manage" size="sm" variant="outline" disabled={busy} onClick={() => void run(() => rejectFact(fact.id as number))} className="h-7">
              Keep current
            </RoleButton>
          </>
        ) : status === "pending" ? (
          <>
            <RoleButton need="brand_brain.manage" size="sm" disabled={busy} onClick={() => void run(() => approveFact(fact.id as number))} className="h-7 bg-success text-success-foreground hover:bg-success/90">
              <Check className="size-3.5" aria-hidden /> Approve
            </RoleButton>
            <RoleButton need="brand_brain.manage" size="sm" variant="outline" disabled={busy} onClick={() => void run(() => rejectFact(fact.id as number))} className="h-7 text-destructive hover:text-destructive">
              <X className="size-3.5" aria-hidden /> Reject
            </RoleButton>
          </>
        ) : status === "rejected" ? (
          <RoleButton need="brand_brain.manage" size="sm" variant="outline" disabled={busy} onClick={() => void run(() => approveFact(fact.id as number))} className="h-7">
            Restore
          </RoleButton>
        ) : (
          <>
            <RoleGate need="brand_brain.manage">
              <Button size="sm" variant="ghost" disabled={busy} onClick={() => void run(() => setFactEnabled(fact.id as number, off))} className="h-7 text-muted-foreground">
                {off ? "Switch on" : "Switch off"}
              </Button>
            </RoleGate>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="h-7 w-7 px-0 text-muted-foreground" aria-label="More">
                  <MoreHorizontal className="size-4" aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={open}>Open · edit</DropdownMenuItem>
                <RoleGate need="brand_brain.manage">
                  <DropdownMenuItem
                    className="text-destructive"
                    onSelect={async () => {
                      if (await confirm(confirmCopy("fact", fact.label))) {
                        void run(() => deleteFact(fact.id as number));
                      }
                    }}
                  >
                    Delete
                  </DropdownMenuItem>
                </RoleGate>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>
    </div>
  );
}
