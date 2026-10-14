/** SPEC-286 — the History tab's pure helpers. */
import { describe, expect, it } from "vitest";

import { filterRuns, groundedLabel, hasDocument, runStatusLabel } from "@/lib/report-fte-history";
import type { RunSummary } from "@/types/report-fte";

const run = (runId: number, status: RunSummary["status"], sections = 5, grounded = 5): RunSummary => ({
  runId,
  title: `Run ${runId}`,
  kind: "asked",
  status,
  ask: "",
  templateId: null,
  createdAt: null,
  ranAt: null,
  costUsd: 0,
  toolMs: 0,
  sections,
  grounded,
  actedOn: null,
  deliveredAt: null,
  deliveredTo: null,
});

describe("report-fte history helpers", () => {
  it("labels every status", () => {
    expect(runStatusLabel("ready")).toEqual({ label: "Ready to sign", tone: "ai" });
    expect(runStatusLabel("sent").tone).toBe("success");
    expect(runStatusLabel("failed").tone).toBe("destructive");
    expect(runStatusLabel("draft").label).toBe("Draft");
  });

  it("says how grounded a run is, or that it has not run", () => {
    expect(groundedLabel(run(1, "draft", 0, 0))).toBe("not run");
    expect(groundedLabel(run(1, "sent", 5, 5))).toBe("5 grounded");
    expect(groundedLabel(run(1, "ready", 5, 4))).toBe("4 of 5 grounded");
  });

  it("opens a document only once there are figures, and filters", () => {
    expect(hasDocument(run(1, "draft"))).toBe(false);
    expect(hasDocument(run(1, "sent"))).toBe(true);
    const runs = [run(1, "draft"), run(2, "sent"), run(3, "ready"), run(4, "scheduled")];
    expect(filterRuns(runs, "delivered").map((r) => r.runId)).toEqual([2, 4]);
    expect(filterRuns(runs, "drafts").map((r) => r.runId)).toEqual([1, 3]);
    expect(filterRuns(runs, "all")).toHaveLength(4);
  });
});
