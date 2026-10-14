import { describe, expect, it } from "vitest";

import {
  approvalCardActions,
  type ApprovalCardState,
} from "@/lib/social";
import { formatDate } from "@/utils/format";

describe("approvalCardActions (SPEC-132 approve → schedule state machine)", () => {
  it("pending exposes only Approve + Request changes", () => {
    expect(approvalCardActions("pending")).toEqual({
      canApprove: true,
      canSchedule: false,
      canReschedule: false,
      canClear: false,
      canUndo: false,
    });
  });

  it("approved exposes Schedule + Undo (no re-approve, no clear)", () => {
    expect(approvalCardActions("approved")).toEqual({
      canApprove: false,
      canSchedule: true,
      canReschedule: false,
      canClear: false,
      canUndo: true,
    });
  });

  it("scheduled exposes Reschedule + Clear (no Undo — clear first)", () => {
    expect(approvalCardActions("scheduled")).toEqual({
      canApprove: false,
      canSchedule: false,
      canReschedule: true,
      canClear: true,
      canUndo: false,
    });
  });

  it("never offers a dead end, and Approve/Schedule are mutually exclusive", () => {
    // Was "exactly two actions in every state" until SPEC-178 removed Request
    // changes — `pending` now offers Approve alone. The invariant that actually
    // matters is unchanged: every state offers a way forward, and nothing is
    // schedulable before it is approved.
    const states: ApprovalCardState[] = ["pending", "approved", "scheduled"];
    for (const state of states) {
      const a = approvalCardActions(state);
      expect(Object.values(a).filter(Boolean).length).toBeGreaterThan(0);
      expect(a.canApprove && a.canSchedule).toBe(false);
    }
  });
});

describe("scheduled-date label formatting", () => {
  it("renders a bare calendar day with no timezone shift (matches the Calendar tab)", () => {
    // A date-only "YYYY-MM-DD" must render its literal day regardless of the
    // viewer's timezone — the same helper the Calendar tab uses.
    expect(formatDate("2026-08-14")).toBe("Aug 14, 2026");
    expect(`Scheduled for ${formatDate("2026-08-14")}`).toBe(
      "Scheduled for Aug 14, 2026",
    );
  });

  it("returns an empty string for a missing date (no 'Invalid Date' leak)", () => {
    expect(formatDate("")).toBe("");
  });
});
