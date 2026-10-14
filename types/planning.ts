/**
 * Response shapes for the three planning surfaces added by backend
 * SPEC-227 (cash release), SPEC-228 (staffing) and SPEC-229 (allocation),
 * plus SPEC-230 (nexus thresholds). Mirrors of the API — nothing derived.
 */

// ── SPEC-227 · Cash Release ──────────────────────────────────────────────────

export interface CashReleaseItem {
  product_id: number;
  title: string;
  bucket: "180+d" | "90-180d";
  tier: string;
  discount_pct: number;
  stock: number;
  stock_value: number;
  expected_cash: number;
  margin_given_up: number;
  days_since_last_sale: number | null;
}

export interface CashReleaseWeek {
  week: number;
  /** ISO date, always a Monday. */
  starts_on: string;
  products: number;
  stock_value: number;
  expected_cash: number;
  margin_given_up: number;
  items: CashReleaseItem[];
}

export interface CashReleaseCoverage {
  products_planned: number;
  products_total: number;
  value_planned: number;
  value_total: number;
  value_pct: number;
  complete: boolean;
}

export interface CashReleasePlan {
  generated_at: string;
  horizon_weeks: number;
  /** How much of the dead-stock position this plan actually covers. */
  coverage?: CashReleaseCoverage;
  /** The estimate's own limits — rendered on the page, never dropped. */
  basis: string;
  totals: {
    products: number;
    stock_value: number;
    expected_cash: number;
    margin_given_up: number;
  };
  weeks: CashReleaseWeek[];
}

// ── SPEC-229 · Allocation ────────────────────────────────────────────────────

export interface AllocationItem {
  product_id: number;
  title: string;
  source_stock: number;
  destination_units_sold: number;
  destination_stock: number;
  move_units: number;
  unit_price: number;
  expected_value: number;
  days_since_last_sale_at_source: number | null;
}

export interface AllocationRun {
  run_key: string;
  source_location_id: number;
  source_location_name: string;
  destination_location_id: number;
  destination_location_name: string;
  units: number;
  expected_value: number;
  /** Last transfer send for this DESTINATION — not proof this run was sent. */
  already_sent_at: string | null;
  items: AllocationItem[];
}

export interface AllocationPlan {
  generated_at: string;
  basis: string;
  totals: {
    runs: number;
    moves: number;
    units: number;
    expected_value: number;
  };
  runs: AllocationRun[];
}

// ── SPEC-228 · Staffing ──────────────────────────────────────────────────────

export interface StaffingCell {
  /** 0 = Monday. */
  weekday: number;
  hour: number;
  visitors: number;
  /** A FRACTION (0.412 = 41.2%), the basis the traffic module uses throughout. */
  conversion_rate: number;
  opportunity?: number;
}

export interface StaffingMove {
  take: StaffingCell;
  give: StaffingCell;
  estimated_gain: number;
  confidence: "high" | "low";
}

export interface StaffingLocation {
  location_id: number;
  location_name: string;
  moves: StaffingMove[];
  total_estimated_gain: number;
}

export interface StaffingPlan {
  has_data: boolean;
  avg_conversion: number | null;
  aov: number;
  weeks_observed: number;
  /** Cells dropped because the counter recorded more sales than visitors. */
  excluded_cells?: number;
  basis?: string;
  locations: StaffingLocation[];
}

// ── SPEC-230 · Nexus ─────────────────────────────────────────────────────────

export type NexusStatus =
  | "exceeded"
  | "approaching"
  | "watch"
  | "registered"
  | "clear";

export interface NexusState {
  state: string;
  status: NexusStatus;
  sales: number;
  transactions: number;
  threshold_sales: number | null;
  threshold_transactions: number | null;
  combine: "and" | "or" | null;
  window: "rolling_12m" | "calendar_year" | null;
  /** Human-readable rule, or null when none is configured for this destination. */
  rule: string | null;
  sales_pct: number | null;
  transactions_pct: number | null;
  projected_crossing_date: string | null;
}

export interface NexusCoverage {
  orders: number;
  /** POS walk-ins — no shipping address by nature, so not in the denominator. */
  in_store: number;
  shippable: number;
  with_destination: number;
  /** Share of SHIPPABLE orders whose destination is known. */
  pct: number;
  complete: boolean;
}

export interface NexusThresholds {
  /** Date the rule table was last reviewed — surfaced so staleness is visible. */
  reviewed_on: string;
  window_end: string;
  coverage: NexusCoverage;
  states: NexusState[];
}
