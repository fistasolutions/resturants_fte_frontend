/** AI spend and value (frontend SPEC-225, backend SPEC-234). */

/** The windows the AI Value tab can be viewed over. */
export type AiValuePeriod = "all" | "90d" | "30d" | "month";

/** How a surface's value may be described. Only `exact` ever carries a number. */
export type ValueBasis =
  | "exact"
  | "pending_attribution"
  | "engagement_only"
  | "operational"
  | "not_attributable";

export type SurfaceVerdictTone = "earning" | "watch" | "review" | "neutral" | "failing";

/** The groups the surface table can be filtered by (backend SPEC-237). */
export type AiCategory =
  | "analysis"
  | "content"
  | "social"
  | "comms"
  | "forecasting"
  | "operations";

export interface SurfaceVerdict {
  label: string;
  tone: SurfaceVerdictTone;
}

export interface AiSurface {
  key: string;
  label: string;
  detail: string;
  kinds: string[];
  runs: number;
  tokens: number;
  units: number;
  costUsd: number;
  /** Null unless the value is genuinely traceable — never an inferred figure. */
  value: number | null;
  valueBasis: ValueBasis;
  category: AiCategory;
  /** What this surface mostly ran on in the period — so switching provider in
   * Settings reads as a switch here, not as an unexplained change in cost. */
  model: string | null;
  provider: string | null;
  /** Measured from traces — how long a run of this surface actually takes. */
  medianMs: number;
  p95Ms: number;
  failureRate: number;
  /** How hard it had to think, and whether it grounded the answer in real data. */
  turnsPerRun: number;
  toolsPerRun: number;
  /** The cost figure that is actually decidable, unlike a total. */
  costPerRun: number;
}

/** The headline: what the agents did, how reliably, how fast, at what unit cost. */
export interface AiKpis {
  runs: number;
  failures: number;
  failureRate: number;
  medianMs: number;
  modelTurns: number;
  toolCalls: number;
  toolsPerRun: number;
  costPerRun: number;
  surfacesActive: number;
}

export interface AiToolUse {
  tool: string;
  calls: number;
  avgMs: number;
}

export interface AiAnomaly {
  traceId: string;
  surface: string;
  label: string;
  reason: string;
  durationMs: number;
  spanCount: number;
  error: string | null;
  at: string | null;
}

export interface AiTraceSummary {
  traceId: string;
  name: string;
  surface: string;
  jobId: string | null;
  startedAt: string | null;
  durationMs: number;
  spanCount: number;
  error: string | null;
}

export interface AiTraceStep {
  spanId: string;
  parentSpanId: string | null;
  kind: string;
  name: string;
  model: string | null;
  inputTokens: number;
  outputTokens: number;
  durationMs: number;
  startedAt: string | null;
  error: string | null;
}

export interface AiJobSpend {
  jobId: string;
  scheduled: boolean;
  runs: number;
  costUsd: number;
}


export interface AiValueTotals {
  costUsd: number;
  attributableValueUsd: number;
  measuredSurfaces: number;
  totalSurfaces: number;
  unpricedEvents: number;
  /** Calls recovered from before metering existed (backend SPEC-235). Their cost is
   * zero because tokens were never recorded — not because they were free. */
  historicCalls: number;
  historicUnits: number;
  /** Calls made since metering began — the only ones that can carry a real cost. */
  meteredCalls: number;
  /** Cost recovered by counting the model's own saved output text — exact tokens at
   * the output rate, but a floor: the prompts were never stored. */
  recoveredFloorUsd: number;
}

export interface AiValueMonth {
  spentUsd: number;
  capUsd: number | null;
  remainingUsd: number | null;
  utilization: number;
  projectedUsd: number;
}

export interface AiValueOverview {
  currency: string;
  periodLabel: string;
  totals: AiValueTotals;
  month: AiValueMonth;
  surfaces: AiSurface[];
  byJob: AiJobSpend[];
  kpis: AiKpis;
  topTools: AiToolUse[];
  categories: { key: AiCategory; label: string }[];
  anomalies: AiAnomaly[];
}

export interface AiSpendCap {
  scope: string;
  period: "month" | "run";
  limitUsd: number;
  enabled: boolean;
  paused: boolean;
  pausedReason: string | null;
  pausedAt: string | null;
}
