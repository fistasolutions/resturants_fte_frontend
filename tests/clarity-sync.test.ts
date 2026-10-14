import { describe, expect, it } from "vitest";

import { adaptClarityStatus } from "@/lib/adapters";
import {
  canSyncNow,
  clarityBudgetLine,
  claritySyncPollInterval,
  claritySyncProgress,
  describeClaritySync,
} from "@/lib/clarity-sync";
import type { ClaritySyncRun } from "@/types/clarity";

function run(overrides: Partial<ClaritySyncRun>): ClaritySyncRun {
  return {
    state: "success",
    startedAt: "2026-09-17T13:03:02+00:00",
    finishedAt: "2026-09-17T13:03:11+00:00",
    records: 12,
    done: null,
    total: null,
    error: null,
    reason: null,
    ...overrides,
  };
}

describe("adaptClarityStatus (SPEC-270)", () => {
  it("maps the sync run, budget and next run with safe defaults", () => {
    const out = adaptClarityStatus({
      configured: true,
      connected: false,
      captured_on: null,
      sync: { state: "success", started_at: "a", finished_at: "b", records: 0, done: null, total: null, error: null, reason: "no_data" },
      budget: { used: 3, limit: 10, remaining: 7 },
      next_run_utc: "04:15",
    });
    expect(out.sync).toEqual({ state: "success", startedAt: "a", finishedAt: "b", records: 0, done: null, total: null, error: null, reason: "no_data" });
    expect(out.budget).toEqual({ used: 3, limit: 10, remaining: 7 });
    expect(out.nextRunUtc).toBe("04:15");
    const legacy = adaptClarityStatus({ configured: true, connected: true, captured_on: "2026-09-16" });
    expect(legacy.sync).toBeNull();
    expect(legacy.budget).toEqual({ used: 0, limit: 10, remaining: 10 });
    expect(adaptClarityStatus({ sync: { state: "weird" } }).sync).toBeNull();
  });
});

describe("claritySyncProgress", () => {
  it("counts slices while running and is empty otherwise", () => {
    expect(claritySyncProgress(run({ state: "running", done: 1, total: 3 }))).toEqual({ percent: 33, label: "1 of 3 slices" });
    expect(claritySyncProgress(run({ state: "running", done: 0, total: null }))).toEqual({ percent: null, label: "Starting…" });
    expect(claritySyncProgress(run({}))).toEqual({ percent: null, label: "" });
    expect(claritySyncProgress(null)).toEqual({ percent: null, label: "" });
  });
});

describe("describeClaritySync", () => {
  it("names five different outcomes", () => {
    expect(describeClaritySync(run({ state: "running" }), null)?.headline).toBe("First sync");
    expect(describeClaritySync(run({ state: "running" }), "2026-09-16")?.headline).toBe("Syncing");
    expect(describeClaritySync(run({ records: 12 }), "2026-09-16")).toMatchObject({ tone: "success", headline: "Synced" });
    expect(describeClaritySync(run({ records: 0, reason: "no_data" }), null)).toMatchObject({
      tone: "warning",
      headline: "Clarity returned no data",
    });
    expect(describeClaritySync(run({ state: "error", error: "unauthorized" }), null)).toMatchObject({
      tone: "error",
      headline: "Clarity rejected the token",
    });
    expect(describeClaritySync(run({ state: "error", error: "throttled" }), null)?.tone).toBe("warning");
    expect(describeClaritySync(run({ state: "error", error: "error" }), null)?.headline).toBe("Clarity didn't answer");
    expect(describeClaritySync(run({ state: "error", error: "cancelled — budget" }), null)?.headline).toBe("Sync interrupted");
  });

  it("is null before any run without a capture, and 'Synced' with one", () => {
    expect(describeClaritySync(null, null)).toBeNull();
    expect(describeClaritySync(null, "2026-09-16")?.headline).toBe("Synced");
  });
});

describe("budget and polling", () => {
  it("words the budget and gates Sync now", () => {
    expect(clarityBudgetLine({ used: 3, limit: 10, remaining: 7 })).toBe("3 of 10 calls used today · 2 syncs left");
    expect(clarityBudgetLine({ used: 9, limit: 10, remaining: 1 })).toBe("9 of 10 calls used today · no syncs left today");
    expect(clarityBudgetLine({ used: 6, limit: 10, remaining: 4 })).toBe("6 of 10 calls used today · 1 sync left");
    expect(canSyncNow(null, { used: 0, limit: 10, remaining: 10 })).toBe(true);
    expect(canSyncNow(run({ state: "running" }), { used: 0, limit: 10, remaining: 10 })).toBe(false);
    expect(canSyncNow(run({}), { used: 9, limit: 10, remaining: 1 })).toBe(false);
    expect(claritySyncPollInterval(run({ state: "running" }))).toBe(2_000);
    expect(claritySyncPollInterval(run({}))).toBe(false);
    expect(claritySyncPollInterval(undefined)).toBe(false);
  });
});
