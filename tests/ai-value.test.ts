import { describe, expect, it } from "vitest";

import {
  adaptAiValue,
  adaptCaps,
  capPercent,
  costComposition,
  coverageSentence,
  formatTokens,
  formatDuration,
  formatUnitCost,
  formatUsd,
  historicNote,
  effortLabel,
  filterSurfaces,
  categoryCounts,
  jobBarPercent,
  meteredCoverage,
  modelLabel,
  PERIODS,
  unitsLabel,
  verdictFor,
  type RawAiValue,
} from "@/lib/ai-value";
import type { AiSurface } from "@/types/ai-value";

function surface(overrides: Partial<AiSurface> = {}): AiSurface {
  return {
    key: "chat",
    label: "Chat — business analyst",
    detail: "41 tools",
    kinds: ["text"],
    runs: 10,
    tokens: 1_900_000,
    units: 0,
    costUsd: 22.85,
    value: null,
    valueBasis: "not_attributable",
    category: "analysis",
    model: "gemini/gemini-pro-latest",
    provider: "gemini",
    medianMs: 1200,
    p95Ms: 4000,
    failureRate: 0,
    turnsPerRun: 1,
    toolsPerRun: 3,
    costPerRun: 0.002,
    ...overrides,
  };
}

describe("formatUsd", () => {
  it("always shows cents", () => {
    expect(formatUsd(452.05)).toBe("$452.05");
    expect(formatUsd(0)).toBe("$0.00");
  });
});

describe("formatTokens", () => {
  it("compacts millions and thousands", () => {
    expect(formatTokens(8_400_000)).toBe("8.4M tok");
    expect(formatTokens(640_000)).toBe("640k tok");
    expect(formatTokens(420)).toBe("420 tok");
  });
  it("shows a dash rather than a misleading zero", () => {
    expect(formatTokens(0)).toBe("—");
  });
});

describe("unitsLabel", () => {
  it("reports each surface in the unit it is billed in", () => {
    expect(unitsLabel(surface({ kinds: ["video"], units: 8 }))).toBe("8s video");
    expect(unitsLabel(surface({ kinds: ["image"], units: 96 }))).toBe("96 img");
    expect(unitsLabel(surface({ kinds: ["text"], tokens: 1_900_000 }))).toBe("1.9M tok");
  });
});

describe("verdictFor", () => {
  it("awards Earning only against a real attributed value", () => {
    const verdict = verdictFor(surface({ costUsd: 2.4, value: 3180 }), 5);
    expect(verdict.tone).toBe("earning");
    expect(verdict.label).toContain("1325×");
  });

  it("leads with failure before anything else, because nothing else matters yet", () => {
    const broken = surface({ failureRate: 0.12, value: 3180, costUsd: 1 });
    expect(verdictFor(broken, 0)).toEqual({ label: "12% failing", tone: "failing" });
  });

  it("calls out a slow surface before admiring its price", () => {
    const slow = surface({ medianMs: 42_000, costPerRun: 0.001 });
    expect(verdictFor(slow, 0).tone).toBe("watch");
    expect(verdictFor(slow, 0).label).toContain("42.0s");
  });

  it("flags an expensive engagement-only surface as a decision to make", () => {
    const costly = surface({ valueBasis: "engagement_only", costUsd: 61.6 });
    expect(verdictFor(costly, 0).tone).toBe("review");
  });

  it("credits operational surfaces without inventing money", () => {
    const ops = surface({ valueBasis: "operational", costUsd: 5.1 });
    expect(verdictFor(ops, 6).label).toBe("Clears backlog");
  });

  it("falls back to a cost per run — a number that decides something", () => {
    expect(verdictFor(surface(), 9).label).toBe("$0.0020 a run");
  });

  it("says a surface is idle rather than pretending it has a verdict", () => {
    expect(verdictFor(surface({ costUsd: 0, runs: 0 }), 0).label).toBe("Idle");
  });
});

describe("coverageSentence", () => {
  it("states plainly when nothing is measurable", () => {
    const sentence = coverageSentence({
      costUsd: 100,
      attributableValueUsd: 0,
      measuredSurfaces: 0,
      totalSurfaces: 20,
      unpricedEvents: 0,
      historicCalls: 0,
      historicUnits: 0,
      meteredCalls: 0,
      recoveredFloorUsd: 0,
    });
    expect(sentence).toContain("No surface yet");
    expect(sentence).toContain("All 20");
  });

  it("counts both halves when some surfaces are measurable", () => {
    const sentence = coverageSentence({
      costUsd: 100,
      attributableValueUsd: 3180,
      measuredSurfaces: 2,
      totalSurfaces: 20,
      unpricedEvents: 0,
      historicCalls: 0,
      historicUnits: 0,
      meteredCalls: 0,
      recoveredFloorUsd: 0,
    });
    expect(sentence).toContain("2 of 20");
    expect(sentence).toContain("other 18");
  });
});

describe("capPercent", () => {
  const month = { spentUsd: 452.05, capUsd: 600, remainingUsd: 147.95, utilization: 0.75, projectedUsd: 438 };

  it("reports utilisation against the cap", () => {
    expect(capPercent(month)).toBe(75);
  });
  it("is zero when no cap is configured", () => {
    expect(capPercent({ ...month, capUsd: null })).toBe(0);
  });
  it("clamps the bar at full rather than overflowing on overspend", () => {
    expect(capPercent({ ...month, spentUsd: 900 })).toBe(100);
  });
});

describe("jobBarPercent", () => {
  const jobs = [
    { jobId: "spotlight_nightly", scheduled: true, runs: 62, costUsd: 191.6 },
    { jobId: "on_demand", scheduled: false, runs: 214, costUsd: 22.85 },
  ];
  it("scales against the largest job", () => {
    expect(jobBarPercent(jobs[0], jobs)).toBe(100);
    expect(jobBarPercent(jobs[1], jobs)).toBe(12);
  });
  it("keeps a sliver visible for a tiny job", () => {
    const tiny = { jobId: "t", scheduled: true, runs: 1, costUsd: 0.01 };
    expect(jobBarPercent(tiny, [...jobs, tiny])).toBe(2);
  });
});

describe("adaptAiValue", () => {
  const raw: RawAiValue = {
    currency: "USD",
    period: { key: "30d", label: "Last 30 days", start: "a", end: "b" },
    totals: {
      cost_usd: 452.05,
      attributable_value_usd: 3180,
      measured_surfaces: 1,
      total_surfaces: 20,
      unpriced_events: 2,
    },
    month: {
      spent_usd: 131.4,
      cap_usd: 600,
      remaining_usd: 468.6,
      utilization: 0.219,
      projected_usd: 438,
    },
    surfaces: [
      {
        key: "social_video",
        label: "Social — video generation",
        detail: "veo",
        kinds: ["video"],
        runs: 8,
        tokens: 0,
        units: 64,
        cost_usd: 61.6,
        value: null,
        value_basis: "engagement_only",
        category: "social",
        model: "gemini/veo-3.1-fast-generate-preview",
        provider: "gemini",
        median_ms: 42000,
        p95_ms: 90000,
        failure_rate: 0.125,
        turns_per_run: 2,
        tools_per_run: 0,
        cost_per_run: 7.7,
      },
    ],
    by_job: [
      { job_id: "on_demand", scheduled: false, runs: 214, cost_usd: 22.85 },
    ],
    kpis: {
      runs: 8,
      failures: 1,
      failure_rate: 0.125,
      median_ms: 42000,
      model_turns: 16,
      tool_calls: 0,
      tools_per_run: 0,
      cost_per_run: 7.7,
      surfaces_active: 1,
    },
    activity: {
      top_tools: [{ tool: "revenue_summary", calls: 12, avg_ms: 300 }],
      categories: [{ key: "social", label: "Social" }],
    },
    anomalies: [
      {
        traceId: "t-9",
        surface: "social_video",
        label: "Social — video generation",
        reason: "failed",
        durationMs: 91000,
        spanCount: 4,
        error: "vendor refused",
        at: "2026-09-02T04:00:00Z",
      },
    ],
  };

  it("camelCases the payload without losing a null value", () => {
    const view = adaptAiValue(raw);
    expect(view.totals.measuredSurfaces).toBe(1);
    expect(view.month.capUsd).toBe(600);
    expect(view.surfaces[0].valueBasis).toBe("engagement_only");
    // A null value must survive adaptation — coercing it to 0 would read as
    // "this surface earned nothing", which is a different claim entirely.
    expect(view.surfaces[0].value).toBeNull();
    expect(view.byJob[0].scheduled).toBe(false);
    expect(view.kpis.runs).toBe(8);
    expect(view.topTools[0].tool).toBe("revenue_summary");
    expect(view.anomalies[0].reason).toBe("failed");
  });
});

describe("adaptCaps", () => {
  it("carries the paused reason through", () => {
    const caps = adaptCaps({
      caps: [
        {
          scope: "social_video",
          period: "month",
          limit_usd: 80,
          enabled: true,
          paused: true,
          paused_reason: "Too expensive per reel.",
          paused_at: "2026-09-02T00:00:00Z",
        },
      ],
    });
    expect(caps[0].pausedReason).toBe("Too expensive per reel.");
    expect(caps[0].limitUsd).toBe(80);
  });
});

describe("historicNote", () => {
  const totals = {
    costUsd: 0,
    attributableValueUsd: 0,
    measuredSurfaces: 0,
    totalSurfaces: 20,
    unpricedEvents: 0,
    historicCalls: 0,
    historicUnits: 0,
    meteredCalls: 0,
    recoveredFloorUsd: 0,
  };

  it("says nothing when there is no recovered history", () => {
    expect(historicNote(totals)).toBeNull();
  });

  it("refuses to let unmetered calls read as free ones", () => {
    const note = historicNote({ ...totals, historicCalls: 5692 });
    expect(note).toContain("5,692");
    expect(note).toContain("not evidence they were free");
  });
});

describe("PERIODS", () => {
  it("leads with All time, because that is the question the page is asked first", () => {
    expect(PERIODS[0]).toEqual({ key: "all", label: "All time" });
  });

  it("offers the narrower windows too, widest first", () => {
    expect(PERIODS.map((p) => p.key)).toEqual(["all", "90d", "30d", "month"]);
  });
});

describe("meteredCoverage", () => {
  const base = {
    costUsd: 3.47,
    attributableValueUsd: 0,
    measuredSurfaces: 0,
    totalSurfaces: 20,
    unpricedEvents: 0,
    historicCalls: 5966,
    historicUnits: 40,
    meteredCalls: 0,
    recoveredFloorUsd: 0,
  };

  it("states how little of the real total the spend figure covers", () => {
    expect(meteredCoverage(base)).toEqual({ metered: 0, total: 5966, percent: 0 });
  });

  it("reaches full coverage once nothing is historic", () => {
    const live = { ...base, historicCalls: 0, meteredCalls: 120 };
    expect(meteredCoverage(live).percent).toBe(100);
  });

  it("does not divide by zero on an empty ledger", () => {
    expect(meteredCoverage({ ...base, historicCalls: 0 }).percent).toBe(0);
  });
});

describe("costComposition", () => {
  it("separates what is exact from what is only a floor", () => {
    const note = costComposition({
      costUsd: 5.38,
      attributableValueUsd: 0,
      measuredSurfaces: 0,
      totalSurfaces: 20,
      unpricedEvents: 0,
      historicCalls: 5974,
      historicUnits: 40,
      meteredCalls: 0,
      recoveredFloorUsd: 1.91,
    });
    expect(note).toContain("$3.47 priced exactly");
    expect(note).toContain("$1.91 recovered from saved model output");
    expect(note).toContain("the real bill is higher");
  });
});

describe("formatUnitCost", () => {
  it("keeps four places below a cent, so a real cost never reads as free", () => {
    expect(formatUnitCost(0.0021)).toBe("$0.0021");
    expect(formatUnitCost(2.4)).toBe("$2.40");
    expect(formatUnitCost(0)).toBe("—");
  });
});

describe("filterSurfaces and categoryCounts", () => {
  const rows = [
    surface({ key: "chat", category: "analysis", runs: 5 }),
    surface({ key: "blog", category: "content", runs: 40 }),
    surface({ key: "video", category: "social", runs: 2 }),
  ];

  it("shows everything under All, busiest first", () => {
    expect(filterSurfaces(rows, "all").map((r) => r.key)).toEqual(["blog", "chat", "video"]);
  });

  it("narrows to one category", () => {
    expect(filterSurfaces(rows, "social").map((r) => r.key)).toEqual(["video"]);
  });

  it("counts each chip so an empty filter is visible before it is clicked", () => {
    expect(categoryCounts(rows)).toEqual({ all: 3, analysis: 1, content: 1, social: 1 });
  });
});

describe("effortLabel", () => {
  it("says how hard a run worked, which a total never could", () => {
    expect(effortLabel(surface({ turnsPerRun: 2, toolsPerRun: 4 }))).toBe("2 turns · 4 tools");
    expect(effortLabel(surface({ runs: 0 }))).toBe("—");
  });
});

describe("formatDuration", () => {
  it("drops noise as the scale grows", () => {
    expect(formatDuration(340)).toBe("340ms");
    expect(formatDuration(4200)).toBe("4.2s");
    expect(formatDuration(95_000)).toBe("1m 35s");
    expect(formatDuration(0)).toBe("—");
  });
});

describe("modelLabel", () => {
  it("shows the model a person can read, with the provider on its own line", () => {
    expect(modelLabel(surface())).toEqual({ model: "gemini-pro-latest", provider: "gemini" });
  });

  it("says nothing for a surface that has not run", () => {
    expect(modelLabel(surface({ model: null, provider: null }))).toBeNull();
  });
});
