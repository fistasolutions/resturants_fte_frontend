/**
 * Pure helpers for the History tab (SPEC-286): status labels and tones, the "when"
 * column, and the sort the table keeps.
 */
import type { StatusTone } from "@/components/shared/status-badge";
import type { RunStatus, RunSummary } from "@/types/report-fte";

export function runStatusLabel(status: RunStatus): { label: string; tone: StatusTone } {
  switch (status) {
    case "ready":
      return { label: "Ready to sign", tone: "ai" };
    case "sent":
      return { label: "Delivered", tone: "success" };
    case "scheduled":
      return { label: "Scheduled", tone: "success" };
    case "running":
      return { label: "Running", tone: "warning" };
    case "failed":
      return { label: "Failed", tone: "destructive" };
    default:
      return { label: "Draft", tone: "neutral" };
  }
}

/** "3 of 5 grounded" — or "not run" for a draft. */
export function groundedLabel(run: Pick<RunSummary, "sections" | "grounded" | "status">): string {
  if (run.status === "draft" || run.status === "failed" || run.sections === 0) return "not run";
  return run.grounded === run.sections ? `${run.sections} grounded` : `${run.grounded} of ${run.sections} grounded`;
}

/** A run may be opened in the full document page once it has figures. */
export function hasDocument(run: Pick<RunSummary, "status">): boolean {
  return run.status === "ready" || run.status === "sent" || run.status === "scheduled";
}

export type HistoryFilter = "all" | "delivered" | "drafts";

export function filterRuns(runs: RunSummary[], filter: HistoryFilter): RunSummary[] {
  switch (filter) {
    case "delivered":
      return runs.filter((r) => r.status === "sent" || r.status === "scheduled");
    case "drafts":
      return runs.filter((r) => r.status === "draft" || r.status === "ready" || r.status === "failed");
    default:
      return runs;
  }
}
