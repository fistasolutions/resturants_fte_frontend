"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";

import { RoleButton } from "@/components/shared/role-gate";
import { ProvenanceChip } from "@/features/spotlight/provenance-chip";
import { factSectionLabel } from "@/lib/brand-brain";
import { cn } from "@/lib/utils";
import { approveFact, rejectFact } from "@/services/brand-brain-actions";
import type { Fact } from "@/types/spotlight";

/**
 * A fact that is waiting for a decision (SPEC-263): pending, conflicting with an
 * approved value, or rejected (restorable). Approve is the only way it reaches the
 * writers.
 */
export function PendingFactRow({ fact, onChanged }: { fact: Fact; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const status = fact.status ?? "pending";

  async function decide(action: "approve" | "reject") {
    if (fact.id == null) return;
    setError(null);
    setBusy(true);
    try {
      await (action === "approve" ? approveFact(fact.id) : rejectFact(fact.id));
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save — try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 py-2.5",
        status === "conflict" && "rounded-lg bg-warning/5 px-2",
        status === "rejected" && "opacity-50",
      )}
    >
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
          {factSectionLabel(fact.section ?? "identity")}
          {fact.sourceLocator ? <span>· {fact.sourceLocator}</span> : null}
          <span
            className={cn(
              "rounded-md px-1.5 py-0.5 normal-case tracking-normal",
              status === "conflict" ? "bg-warning/10 text-warning" : status === "rejected" ? "bg-muted" : "bg-warning/10 text-warning",
            )}
          >
            {status === "conflict" ? "conflicts with approved" : status === "rejected" ? "rejected" : "awaiting approval"}
          </span>
          <ProvenanceChip source={fact.source} />
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{fact.label}</p>
        <p className={cn("text-sm font-medium text-foreground", status === "rejected" && "line-through")}>{fact.value}</p>
        {fact.sourceNote && status === "conflict" ? <p className="mt-1 text-xs text-warning">{fact.sourceNote}</p> : null}
        {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {status === "rejected" ? (
          <RoleButton need="brand_brain.manage" size="sm" variant="outline" disabled={busy} onClick={() => void decide("approve")}>
            Restore
          </RoleButton>
        ) : (
          <>
            <RoleButton need="brand_brain.manage" size="sm" disabled={busy} onClick={() => void decide("approve")} className="bg-success text-success-foreground hover:bg-success/90">
              <Check className="size-3.5" aria-hidden /> Approve
            </RoleButton>
            <RoleButton need="brand_brain.manage" size="sm" variant="ghost" disabled={busy} onClick={() => void decide("reject")} className="text-destructive">
              <X className="size-3.5" aria-hidden /> Reject
            </RoleButton>
          </>
        )}
      </div>
    </div>
  );
}
