"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, PencilLine } from "lucide-react";

import { RoleButton } from "@/components/shared/role-gate";
import { cn } from "@/lib/utils";
import { approveDraft, requestChanges } from "@/services/spotlight-actions";
import type { BlogDraftStatus } from "@/types/spotlight";

/** The human-in-the-loop review action (backend SPEC-109). Approve → status
 * `approved` (publish to Shopify from the draft-detail panel, which is fully
 * implemented); Request changes → `changes_requested`. Both call the real API through
 * the proxy, then refresh the server data so lists/badges reflect the new
 * status. Once a decision lands the draft leaves `in_review`, so this collapses
 * to a status banner rather than offering a fake "un-approve". */
export function DraftDecision({
  draftId,
  status,
  compact = false,
  onRequestChanges,
}: {
  draftId: number;
  status: BlogDraftStatus;
  compact?: boolean;
  /** SPEC-117 refine loop: when provided, "Request changes" opens the caller's
   *  refine modal (edit brief → streamed regenerate) instead of bouncing the
   *  draft to `changes_requested`. Omitted on the Approvals tab, which keeps the
   *  original status-bounce behaviour. */
  onRequestChanges?: () => void;
}) {
  const router = useRouter();
  const [current, setCurrent] = useState<BlogDraftStatus>(status);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [running, setRunning] = useState<"approve" | "changes" | null>(null);

  async function decide(action: "approve" | "changes") {
    setError(null);
    setRunning(action);
    try {
      const updated =
        action === "approve"
          ? await approveDraft(draftId)
          : await requestChanges(draftId);
      setCurrent(updated.status);
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save — try again.");
    } finally {
      setRunning(null);
    }
  }

  const busy = running !== null || pending;

  if (current !== "in_review") {
    const approved = current === "approved";
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg border p-3 text-sm font-medium",
          approved
            ? "border-success/30 bg-success/10 text-success"
            : "border-warning/30 bg-warning/10 text-warning",
        )}
        role="status"
      >
        {approved ? (
          <CheckCircle2 className="size-4 shrink-0" aria-hidden />
        ) : (
          <PencilLine className="size-4 shrink-0" aria-hidden />
        )}
        {approved
          ? "Approved — open the draft to publish it to your Shopify blog."
          : "Sent back for changes — Search Visibility will revise and resubmit."}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className={cn("flex flex-wrap gap-2", compact && "gap-1.5")}>
        <RoleButton
          need="spotlight.publish"
          size={compact ? "sm" : "default"}
          onClick={() => decide("approve")}
          disabled={busy}
        >
          <CheckCircle2 className="size-4" aria-hidden />
          {running === "approve" ? "Approving…" : "Approve"}
        </RoleButton>
        {/* The refine modal rewrites the draft (spotlight.manage); the plain bounce is a
            review decision (spotlight.publish). */}
        <RoleButton
          need={onRequestChanges ? "spotlight.manage" : "spotlight.publish"}
          variant="outline"
          size={compact ? "sm" : "default"}
          onClick={() => (onRequestChanges ? onRequestChanges() : decide("changes"))}
          disabled={busy}
        >
          <PencilLine className="size-4" aria-hidden />
          {running === "changes" ? "Sending…" : "Request changes"}
        </RoleButton>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
