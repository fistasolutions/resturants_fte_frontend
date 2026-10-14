import { describe, expect, it } from "vitest";

import {
  adaptOverview,
  adaptRunPage,
  formatDuration,
  formatOutcome,
  groupJobs,
  headlineVerdict,
  healthTone,
  isStatus,
  isWindow,
  relativeTime,
  statusTone,
} from "@/lib/system-trace";
import type { JobHealth, SystemJob, SystemTotals } from "@/types/system";

function job(key: string, health: JobHealth, group = "Data"): SystemJob {
  return {
    key,
    title: key,
    purpose: "",
    group,
    cadenceLabel: "Daily",
    cadenceMinutes: 1440,
    expected: true,
    health,
    lastSuccessAt: null,
    latestRun: null,
  };
}

const TOTALS: SystemTotals = {
  jobs: 23,
  failing: 0,
  stale: 0,
  neverRun: 0,
  runs24h: 40,
  errors24h: 0,
  skipped24h: 2,
  succeeded24h: 38,
};

describe("adapters", () => {
  it("camelCases the overview without losing a never-run job", () => {
    const view = adaptOverview({
      generated_at: "2026-09-11T12:00:00Z",
      jobs: [
        {
          key: "tax_reports",
          title: "Sales & tax reports",
          purpose: "Generates the filings.",
          group: "Reporting",
          cadence_label: "Daily 07:00 UTC",
          cadence_minutes: 1440,
          expected: true,
          health: "never_run",
          last_success_at: null,
          latest_run: null,
        },
      ],
      totals: {
        jobs: 23, failing: 0, stale: 0, never_run: 1,
        runs_24h: 0, errors_24h: 0, skipped_24h: 0, succeeded_24h: 0,
      },
    });
    expect(view.jobs[0].cadenceLabel).toBe("Daily 07:00 UTC");
    expect(view.jobs[0].latestRun).toBeNull();
    expect(view.totals.neverRun).toBe(1);
  });

  it("carries a run's outcome and its trace link through", () => {
    const page = adaptRunPage({
      runs: [
        {
          id: 9, job_id: "tax_reports", status: "success",
          started_at: "2026-09-11T07:00:00Z", finished_at: "2026-09-11T07:00:04Z",
          duration_ms: 4200, outcome: { reports: 3 }, detail: null,
          error: null, trace_id: "trace-abc",
        },
      ],
      total: 1, page: 1, page_size: 25, pages: 1,
    });
    expect(page.runs[0].outcome).toEqual({ reports: 3 });
    expect(page.runs[0].traceId).toBe("trace-abc");
  });
});

describe("healthTone", () => {
  it("treats a never-run job as seriously as a failing one", () => {
    // A job that has never run cannot fail, so anything softer than destructive
    // would make it look exactly like a healthy one.
    expect(healthTone("never_run").chip).toContain("destructive");
    expect(healthTone("failing").chip).toContain("destructive");
  });

  it("keeps an unconfigured job muted rather than red", () => {
    // Ads and social are off until connected; a permanent red badge is how a page
    // teaches its reader to ignore every badge on it.
    expect(healthTone("idle").chip).not.toContain("destructive");
    expect(healthTone("idle").chip).toContain("muted");
  });

  it("never uses brand red — that token is identity only (Rule 9)", () => {
    const states: JobHealth[] = ["ok", "failing", "stale", "running", "never_run", "idle"];
    for (const state of states) expect(healthTone(state).chip).not.toContain("brand");
  });
});

describe("statusTone", () => {
  it("does not colour a skipped run as a failure", () => {
    // The heavy-job gate skips on purpose, every 15 minutes.
    expect(statusTone("skipped").chip).not.toContain("destructive");
    expect(statusTone("error").chip).toContain("destructive");
  });
});

describe("formatDuration", () => {
  it("keeps sub-second runs in milliseconds", () => {
    // A 90ms job did not take "0.1s"; rounding it there hides how fast it was.
    expect(formatDuration(90)).toBe("90ms");
    expect(formatDuration(8100)).toBe("8.1s");
    expect(formatDuration(125_000)).toBe("2m 5s");
    expect(formatDuration(7_260_000)).toBe("2h 1m");
  });

  it("returns a dash rather than a zero for a run still going", () => {
    expect(formatDuration(null)).toBe("—");
  });
});

describe("formatOutcome", () => {
  it("reads as a sentence, singularised", () => {
    expect(formatOutcome({ reports: 3, locations: 7 })).toBe("3 reports · 7 locations");
    expect(formatOutcome({ reports: 1 })).toBe("1 report");
  });

  it("is empty for a job that reports nothing", () => {
    // Enrichment, never a requirement — a job with no outcome is still fully recorded.
    expect(formatOutcome(null)).toBe("");
  });
});

describe("relativeTime", () => {
  const now = new Date("2026-09-11T12:00:00Z");

  it("is coarse, which is what an operator wants at a glance", () => {
    expect(relativeTime("2026-09-11T11:59:30Z", now)).toBe("just now");
    expect(relativeTime("2026-09-11T11:30:00Z", now)).toBe("30m ago");
    expect(relativeTime("2026-09-11T06:00:00Z", now)).toBe("6h ago");
    expect(relativeTime("2026-09-08T12:00:00Z", now)).toBe("3d ago");
  });

  it("says never rather than inventing a date", () => {
    expect(relativeTime(null, now)).toBe("never");
    expect(relativeTime("not-a-date", now)).toBe("never");
  });
});

describe("groupJobs", () => {
  it("puts the group containing a failure above an entirely healthy one", () => {
    // A page whose problems are below the fold is a page nobody reads.
    const grouped = groupJobs([
      job("a", "ok", "Housekeeping"),
      job("b", "ok", "Housekeeping"),
      job("c", "failing", "Reporting"),
      job("d", "ok", "Reporting"),
    ]);
    expect(grouped[0].group).toBe("Reporting");
  });

  it("preserves the backend's order inside a group", () => {
    const grouped = groupJobs([job("first", "failing"), job("second", "ok")]);
    expect(grouped[0].jobs.map((j) => j.key)).toEqual(["first", "second"]);
  });
});

describe("headlineVerdict", () => {
  it("states a clean run as a result, not an absence", () => {
    expect(headlineVerdict(TOTALS)).toBe("All 23 scheduled jobs are running on time.");
  });

  it("names the problems when there are any", () => {
    expect(headlineVerdict({ ...TOTALS, failing: 2, neverRun: 1, stale: 3 })).toBe(
      "2 failing, 1 never run, 3 overdue of 23 scheduled jobs.",
    );
  });
});

describe("filter guards", () => {
  it("rejects a window or status the API would not accept", () => {
    expect(isWindow("24h")).toBe(true);
    expect(isWindow("yesterday")).toBe(false);
    expect(isStatus("error")).toBe(true);
    expect(isStatus("exploded")).toBe(false);
    expect(isStatus(undefined)).toBe(false);
  });
});

describe("group ordering on a tie", () => {
  it("falls back to a declared order rather than insertion order", () => {
    // Every group ties on `never_run` the first time this page is opened, and a tie
    // resolved by insertion order put Housekeeping above Data.
    const grouped = groupJobs([
      job("prune", "never_run", "Housekeeping"),
      job("sync", "never_run", "Data"),
      job("report", "never_run", "Reporting"),
    ]);
    expect(grouped.map((g) => g.group)).toEqual(["Data", "Reporting", "Housekeeping"]);
  });

  it("still puts a worse group first, whatever the declared order says", () => {
    const grouped = groupJobs([
      job("sync", "ok", "Data"),
      job("prune", "failing", "Housekeeping"),
    ]);
    expect(grouped[0].group).toBe("Housekeeping");
  });
});
