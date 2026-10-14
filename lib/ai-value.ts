/** Everything derived about AI performance (SPEC-226; KPIs from backend SPEC-237).
 *
 * Components stay presentational and this module holds the judgement, because `lib/` is
 * the layer Vitest can reach — the repo has no jsdom runner, so logic that lives in a
 * component is logic nothing can prove.
 */
import type {
  AiAnomaly,
  AiCategory,
  AiJobSpend,
  AiSpendCap,
  AiSurface,
  AiToolUse,
  AiValueOverview,
  AiValuePeriod,
  SurfaceVerdict,
  ValueBasis,
} from "@/types/ai-value";

/** The windows the page offers, widest first.
 *
 * "All time" leads and is the default: the first question this page is asked is what the
 * system has actually run, and a 30-day slice answers a different question while looking
 * like an answer to that one.
 */
export const PERIODS: { key: AiValuePeriod; label: string }[] = [
  { key: "all", label: "All time" },
  { key: "90d", label: "Last 90 days" },
  { key: "30d", label: "Last 30 days" },
  { key: "month", label: "This month" },
];

/** How many of the costliest surfaces are eligible for a "Review" verdict. */
const REVIEW_RANK_CUTOFF = 3;

/** The label shown when a surface reports no attributable value. Deliberately a
 * statement, not a dash — a dash reads as a missing number, and the point is that no
 * honest number exists. */
export const BASIS_LABELS: Record<ValueBasis, string> = {
  exact: "exact",
  pending_attribution: "pending attribution",
  engagement_only: "engagement only",
  operational: "operational",
  not_attributable: "not attributable",
};

export function formatUsd(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** A per-unit cost, which is usually a fraction of a cent.
 *
 * Two decimal places turn $0.0021 into "$0.00", which reads as free — the exact
 * misreading this page exists to prevent. Below a cent it keeps four.
 */
export function formatUnitCost(value: number): string {
  if (!value) return "—";
  if (value < 0.01) return `$${value.toFixed(4)}`;
  return formatUsd(value);
}

/** Compact token counts: 8_400_000 → "8.4M tok". */
export function formatTokens(tokens: number): string {
  if (tokens <= 0) return "—";
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M tok`;
  if (tokens >= 1_000) return `${Math.round(tokens / 1_000)}k tok`;
  return `${tokens} tok`;
}

/** What a surface consumed, in the unit that surface is billed in. */
export function unitsLabel(surface: AiSurface): string {
  if (surface.kinds.includes("video")) return `${surface.units}s video`;
  if (surface.kinds.includes("image")) return `${surface.units} img`;
  return formatTokens(surface.tokens);
}

/** How often a surface may fail before that is the headline about it. */
const FAILING_RATE = 0.05;
/** Above this, a surface is slow enough that a person notices and complains. */
const SLOW_MS = 20_000;

/** The verdict for one surface — a judgement that names something to do.
 *
 * `Core surface` and `No spend yet` decided nothing, which is why they are gone. Order
 * matters here: a surface that is failing needs attention before anyone cares what it
 * cost, and a slow one needs it before anyone admires its price.
 */
export function verdictFor(surface: AiSurface, costRank: number): SurfaceVerdict {
  if (surface.failureRate >= FAILING_RATE) {
    return {
      label: `${Math.round(surface.failureRate * 100)}% failing`,
      tone: "failing",
    };
  }
  if (surface.medianMs >= SLOW_MS) {
    return { label: `Slow — ${formatDuration(surface.medianMs)} typical`, tone: "watch" };
  }
  if (surface.value !== null && surface.value > surface.costUsd) {
    const multiple = Math.round(surface.value / Math.max(surface.costUsd, 0.01));
    return { label: `Earning — ${multiple}× return`, tone: "earning" };
  }
  if (surface.value !== null) return { label: "Earning", tone: "earning" };
  if (surface.valueBasis === "operational") {
    return { label: "Clears backlog", tone: "earning" };
  }
  if (surface.valueBasis === "engagement_only" && costRank < REVIEW_RANK_CUTOFF) {
    return { label: "Review — costly, no revenue signal", tone: "review" };
  }
  if (surface.runs === 0) return { label: "Idle", tone: "neutral" };
  return { label: `${formatUnitCost(surface.costPerRun)} a run`, tone: "neutral" };
}

/** Human duration: milliseconds are noise above a second, seconds above a minute. */
export function formatDuration(ms: number): string {
  if (!ms) return "—";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60_000)}m ${Math.round((ms % 60_000) / 1000)}s`;
}

/** A rate as a percentage, keeping one decimal only where it changes the meaning. */
export function formatRate(rate: number): string {
  if (!rate) return "0%";
  const percent = rate * 100;
  return percent < 1 ? `${percent.toFixed(1)}%` : `${Math.round(percent)}%`;
}

/** A model id as a person reads it: the provider prefix and any date dropped, so
 * `gemini/gemini-pro-latest` becomes `gemini-pro-latest` and the provider gets its
 * own, smaller line. */
export function modelLabel(surface: AiSurface): { model: string; provider: string } | null {
  if (!surface.model) return null;
  const model = surface.model.split("/").pop() ?? surface.model;
  const provider =
    surface.provider ??
    (surface.model.includes("/") ? surface.model.split("/")[0] : "");
  return { model, provider };
}

/** How much work one surface did, in the unit that surface produces. */
export function effortLabel(surface: AiSurface): string {
  if (!surface.runs) return "—";
  const parts: string[] = [];
  if (surface.turnsPerRun) parts.push(`${surface.turnsPerRun} turns`);
  if (surface.toolsPerRun) parts.push(`${surface.toolsPerRun} tools`);
  return parts.join(" · ") || "—";
}

/** Surfaces in one category, or all of them. Sorted by work done, because that is
 * what the page is about — a surface nobody used is not the top row. */
export function filterSurfaces(
  surfaces: AiSurface[],
  category: AiCategory | "all",
): AiSurface[] {
  const rows = category === "all" ? surfaces : surfaces.filter((s) => s.category === category);
  return [...rows].sort((a, b) => b.runs - a.runs || b.costUsd - a.costUsd);
}

/** How many surfaces each chip would show, so an empty filter is visible before it is
 * clicked rather than after. */
export function categoryCounts(surfaces: AiSurface[]): Record<string, number> {
  const counts: Record<string, number> = { all: surfaces.length };
  for (const surface of surfaces) {
    counts[surface.category] = (counts[surface.category] ?? 0) + 1;
  }
  return counts;
}

/** The one-line truth about how much of this page is measurable. */
export function coverageSentence(totals: AiValueOverview["totals"]): string {
  const { measuredSurfaces, totalSurfaces } = totals;
  if (measuredSurfaces === 0) {
    return `No surface yet has a value that can be honestly attributed. All ${totalSurfaces} report cost only.`;
  }
  const rest = totalSurfaces - measuredSurfaces;
  return `${measuredSurfaces} of ${totalSurfaces} surfaces carry a traceable value. The other ${rest} report cost only.`;
}

/** The disclosure for activity recovered from before metering existed.
 *
 * Without it, thousands of runs sitting at $0.00 read as "this surface is free" — which
 * is a different and much more flattering claim than "we did not measure this".
 */
export function meteredCoverage(totals: AiValueOverview["totals"]): {
  metered: number;
  total: number;
  percent: number;
} {
  const total = totals.historicCalls + totals.meteredCalls;
  const percent = total > 0 ? Math.round((totals.meteredCalls / total) * 100) : 0;
  return { metered: totals.meteredCalls, total, percent };
}

/** What the cost figure is actually made of, in plain words.
 *
 * The number on this tile is three different things added together, and only one of them
 * is a complete measurement. Saying so is the difference between a floor and a claim.
 */
export function costComposition(totals: AiValueOverview["totals"]): string {
  const exact = totals.costUsd - totals.recoveredFloorUsd;
  const parts = [`${formatUsd(exact)} priced exactly`];
  if (totals.recoveredFloorUsd > 0) {
    parts.push(`${formatUsd(totals.recoveredFloorUsd)} recovered from saved model output`);
  }
  return `${parts.join(" + ")}. Prompts were never stored, so the real bill is higher.`;
}

export function historicNote(totals: AiValueOverview["totals"]): string | null {
  if (totals.historicCalls <= 0) return null;
  return `${totals.historicCalls.toLocaleString("en-US")} calls happened before metering began. Their tokens were never recorded, so they carry no cost here — that is a gap in measurement, not evidence they were free.`;
}

/** Cap utilisation as a clamped percentage for a progress bar. Overspend still shows
 * full rather than overflowing the bar — the number beside it tells the real story. */
export function capPercent(month: AiValueOverview["month"]): number {
  if (!month.capUsd || month.capUsd <= 0) return 0;
  return Math.min(100, Math.round((month.spentUsd / month.capUsd) * 100));
}

/** Bar width for a job's share of the largest job. */
export function jobBarPercent(job: AiJobSpend, jobs: AiJobSpend[]): number {
  const top = Math.max(...jobs.map((j) => j.costUsd), 0);
  if (top <= 0) return 0;
  return Math.max(2, Math.round((job.costUsd / top) * 100));
}

interface RawSurface {
  key: string;
  label: string;
  detail: string;
  kinds: string[];
  runs: number;
  tokens: number;
  units: number;
  cost_usd: number;
  value: number | null;
  value_basis: ValueBasis;
  category: AiCategory;
  model?: string | null;
  provider?: string | null;
  median_ms: number;
  p95_ms: number;
  failure_rate: number;
  turns_per_run: number;
  tools_per_run: number;
  cost_per_run: number;
}

export interface RawAiValue {
  currency: string;
  period: { key: string; label: string; start: string; end: string };
  totals: {
    cost_usd: number;
    attributable_value_usd: number;
    measured_surfaces: number;
    total_surfaces: number;
    unpriced_events: number;
    historic_calls?: number;
    historic_units?: number;
    metered_calls?: number;
    recovered_floor_usd?: number;
  };
  month: {
    spent_usd: number;
    cap_usd: number | null;
    remaining_usd: number | null;
    utilization: number;
    projected_usd: number;
  };
  surfaces: RawSurface[];
  by_job: { job_id: string; scheduled: boolean; runs: number; cost_usd: number }[];
  kpis: {
    runs: number;
    failures: number;
    failure_rate: number;
    median_ms: number;
    model_turns: number;
    tool_calls: number;
    tools_per_run: number;
    cost_per_run: number;
    surfaces_active: number;
  };
  activity: {
    top_tools: { tool: string; calls: number; avg_ms: number }[];
    categories: { key: AiCategory; label: string }[];
  };
  anomalies: {
    traceId: string;
    surface: string;
    label: string;
    reason: string;
    durationMs: number;
    spanCount: number;
    error: string | null;
    at: string | null;
  }[];
}

export function adaptAiValue(raw: RawAiValue): AiValueOverview {
  return {
    currency: raw.currency,
    periodLabel: raw.period.label,
    totals: {
      costUsd: raw.totals.cost_usd,
      attributableValueUsd: raw.totals.attributable_value_usd,
      measuredSurfaces: raw.totals.measured_surfaces,
      totalSurfaces: raw.totals.total_surfaces,
      unpricedEvents: raw.totals.unpriced_events,
      historicCalls: raw.totals.historic_calls ?? 0,
      historicUnits: raw.totals.historic_units ?? 0,
      meteredCalls: raw.totals.metered_calls ?? 0,
      recoveredFloorUsd: raw.totals.recovered_floor_usd ?? 0,
    },
    month: {
      spentUsd: raw.month.spent_usd,
      capUsd: raw.month.cap_usd,
      remainingUsd: raw.month.remaining_usd,
      utilization: raw.month.utilization,
      projectedUsd: raw.month.projected_usd,
    },
    surfaces: raw.surfaces.map(
      (s): AiSurface => ({
        key: s.key,
        label: s.label,
        detail: s.detail,
        kinds: s.kinds,
        runs: s.runs,
        tokens: s.tokens,
        units: s.units,
        costUsd: s.cost_usd,
        value: s.value,
        valueBasis: s.value_basis,
        category: s.category,
        model: s.model ?? null,
        provider: s.provider ?? null,
        medianMs: s.median_ms ?? 0,
        p95Ms: s.p95_ms ?? 0,
        failureRate: s.failure_rate ?? 0,
        turnsPerRun: s.turns_per_run ?? 0,
        toolsPerRun: s.tools_per_run ?? 0,
        costPerRun: s.cost_per_run ?? 0,
      }),
    ),
    byJob: raw.by_job.map(
      (j): AiJobSpend => ({
        jobId: j.job_id,
        scheduled: j.scheduled,
        runs: j.runs,
        costUsd: j.cost_usd,
      }),
    ),
    kpis: {
      runs: raw.kpis.runs,
      failures: raw.kpis.failures,
      failureRate: raw.kpis.failure_rate,
      medianMs: raw.kpis.median_ms,
      modelTurns: raw.kpis.model_turns,
      toolCalls: raw.kpis.tool_calls,
      toolsPerRun: raw.kpis.tools_per_run,
      costPerRun: raw.kpis.cost_per_run,
      surfacesActive: raw.kpis.surfaces_active,
    },
    topTools: raw.activity.top_tools.map(
      (t): AiToolUse => ({ tool: t.tool, calls: t.calls, avgMs: t.avg_ms }),
    ),
    categories: raw.activity.categories,
    anomalies: raw.anomalies.map((a): AiAnomaly => ({ ...a })),
  };
}

interface RawCap {
  scope: string;
  period: "month" | "run";
  limit_usd: number;
  enabled: boolean;
  paused: boolean;
  paused_reason: string | null;
  paused_at: string | null;
}

export function adaptCaps(raw: { caps: RawCap[] }): AiSpendCap[] {
  return raw.caps.map((c) => ({
    scope: c.scope,
    period: c.period,
    limitUsd: c.limit_usd,
    enabled: c.enabled,
    paused: c.paused,
    pausedReason: c.paused_reason,
    pausedAt: c.paused_at,
  }));
}
