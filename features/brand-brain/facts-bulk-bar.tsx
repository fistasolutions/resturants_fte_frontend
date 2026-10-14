"use client";

import { Button } from "@/components/ui/button";
import type { BulkOptions } from "@/lib/brand-brain";
import { formatNumber } from "@/utils/format";

/**
 * The floating bar over a selection (SPEC-274). It offers only what the selection
 * can do — Approve / Reject for facts still undecided, Switch off / on for approved
 * ones, Delete for any — and says so, so an approved fact is never asked for again.
 * Esc clears the selection.
 */
export function FactsBulkBar({ options, busy, onApprove, onReject, onOff, onOn, onDelete, onClear }: { options: BulkOptions; busy: boolean; onApprove: () => void; onReject: () => void; onOff: () => void; onOn: () => void; onDelete: () => void; onClear: () => void }) {
  const { total, decide, approvedOn, approvedOff } = options;
  if (total === 0) return null;
  const note =
    decide === 0
      ? total === approvedOn + approvedOff
        ? "already approved — the writers read these"
        : "nothing here needs a decision"
      : `${formatNumber(decide)} still need${decide === 1 ? "s" : ""} a decision`;
  return (
    <div role="toolbar" aria-label="Selected facts" className="sticky bottom-4 z-10 flex flex-wrap items-center gap-2 rounded-xl bg-foreground px-3 py-2 text-background shadow-lg" data-facts-bulk>
      <span className="text-xs font-semibold tabular-nums">
        {formatNumber(total)} selected <span className="font-normal opacity-70">· {note}</span>
      </span>
      {decide > 0 ? (
        <>
          <Button size="sm" variant="secondary" disabled={busy} onClick={onApprove} className="h-7">
            ✓ Approve {formatNumber(decide)}
          </Button>
          <Button size="sm" variant="secondary" disabled={busy} onClick={onReject} className="h-7">
            ✕ Reject {formatNumber(decide)}
          </Button>
        </>
      ) : null}
      {approvedOn > 0 ? (
        <Button size="sm" variant="secondary" disabled={busy} onClick={onOff} className="h-7">
          Switch off {formatNumber(approvedOn)}
        </Button>
      ) : null}
      {approvedOff > 0 ? (
        <Button size="sm" variant="secondary" disabled={busy} onClick={onOn} className="h-7">
          Switch on {formatNumber(approvedOff)}
        </Button>
      ) : null}
      <Button size="sm" variant="secondary" disabled={busy} onClick={onDelete} className="h-7 text-destructive">
        Delete {formatNumber(total)}
      </Button>
      <button type="button" onClick={onClear} className="ml-auto text-[11px] opacity-70 hover:opacity-100">
        Esc to clear
      </button>
    </div>
  );
}
