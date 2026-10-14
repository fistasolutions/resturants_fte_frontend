/** Loop Returns team-level range+compare metrics (SPEC-082/SPEC-084) —
 * mirror GET /loop/metrics (backend SPEC-076/SPEC-079). No per-employee
 * breakdown anywhere: Loop's API has no employee-identity field to
 * attribute one. */

export type ComparableReturnsField =
  | "returns_processed"
  | "items_processed"
  | "avg_returns_per_hour"
  | "avg_processing_seconds"
  | "refunds_completed"
  | "exchanges_completed"
  | "avg_arrival_to_resolution_seconds"
  | "median_arrival_to_resolution_seconds";

export interface ReturnsMetrics {
  /** "Has anything ever synced" — distinct from "zero returns this period"
   * (a real good period, represented honestly by the zeros/nulls below). */
  has_data: boolean;
  returns_processed: number;
  items_processed: number;
  avg_returns_per_hour: number;
  avg_processing_seconds: number | null;
  refunds_completed: number;
  exchanges_completed: number;
  needs_review: number;
  open_backlog_eod: number;
  oldest_unprocessed_age_hours: number | null;
  /** E-05 — the headline metric: package arrival to customer refund/exchange. */
  avg_arrival_to_resolution_seconds: number | null;
  median_arrival_to_resolution_seconds: number | null;
  change_pct: Record<ComparableReturnsField, number | null>;
}

export interface ReturnsMetricsResponse {
  period: {
    start: string;
    end: string;
    compare: { mode: string; start: string; end: string } | null;
  };
  metrics: ReturnsMetrics;
}

/** Aging returns-queue supervision signal (SPEC-149). */
export interface ReturnsAttention {
  recipient: string | null;
  needs_attention: boolean;
  severity: "red" | "yellow" | "none";
  returns_waiting: number;
  refunds_pending: number;
  why: string;
}
