/** Foresight — Profit Lens types (SPEC-152 / V4). Backend-computed; UI only presents. */

export interface MarginShape {
  gross_revenue: number;
  cost_known_revenue: number;
  cogs: number;
  /** Revenue − COGS over cost-known lines (nets line discounts), or null if no cost. */
  product_margin: number | null;
  margin_pct: number | null;
  /** % of revenue that has a known cost — how trustworthy the margin is. */
  coverage_pct: number;
}

export interface ProfitCategory extends MarginShape {
  category: string;
}

export interface ProfitStore extends MarginShape {
  location_id: number | null;
  location: string;
  orders: number;
  aov: number | null;
}

export interface ProfitProduct extends MarginShape {
  product_id: number;
  title: string;
  category: string;
  units: number;
  verdict: string;
  verdict_tone: "good" | "warn" | "bad" | "muted";
}

/** The four Profit Lens headline tiles + vs-prior deltas (SPEC-152). */
export interface ProfitSummary {
  gross_sales: number;
  net_profit: number;
  net_margin_pct: number | null;
  lost_to_leaks: number;
  /** % of (post-discount) revenue with a known cost — how trustworthy net is. */
  coverage_pct: number;
  gross_delta_pct: number | null;
  net_delta_pct: number | null;
  margin_delta_pts: number | null;
}

/** One step of the profit bridge: gross (+) → −COGS → −discounts → −returns → net (+). */
export interface ProfitBridgeStep {
  label: string;
  amount: number;
  kind: "gross" | "cogs" | "discounts" | "returns" | "net";
}

export interface ProfitLens {
  summary: ProfitSummary;
  bridge: ProfitBridgeStep[];
  categories: ProfitCategory[];
  stores: ProfitStore[];
  products: ProfitProduct[];
  /** A computed read of the biggest margin leak (Rule 8), or null. */
  ai_read: string | null;
}

/** One store's composite health row (SPEC-153) — all scoreboard columns. */
export interface StoreHealthRow {
  rank: number;
  location_id: number | null;
  location: string;
  health: number | null;
  net_margin_pct: number | null;
  conversion_pct: number | null;
  discount_rate_pct: number;
  discount_discipline: string;
  discipline_tone: "good" | "warn" | "bad";
  return_rate_pct: number;
  fulfill_days: number | null;
  support_csat: number | null;
}

export interface StoreHealth {
  stores: StoreHealthRow[];
  highlights: {
    best_converter: string | null;
    best_converter_value: number | null;
    cleanest_margins: string | null;
    cleanest_margins_value: number | null;
    needs_look: string | null;
    needs_look_health: number | null;
  };
  verdict: string | null;
  has_conversion: boolean;
}

export type SizeTone = "good" | "warn" | "bad" | "muted";

/** One size's catalog row (SPEC-153): sell-through vs return rate + buy-signal verdict. */
export interface SizeRow {
  size: string;
  units_sold: number;
  units_returned: number;
  return_rate: number | null;
  on_hand: number;
  /** units sold ÷ (units sold + on-hand); null when neither. */
  sell_through: number | null;
  avg_price: number;
  verdict: string;
  tone: SizeTone;
}

export interface SizeIntelligence {
  has_data: boolean;
  sizes: SizeRow[];
  kpis: {
    return_value: number;
    markdown_risk: number;
    understocked: string[];
    over_bought: string[];
  };
  ai_read: string | null;
}

export type PaceStatus = "ahead" | "on_track" | "behind" | "no_goal";

/** One "pace by store" row (SPEC-153) — live MTD vs projected vs the store's own goal. */
export interface ForecastStoreRow {
  location_id: number | null;
  location: string;
  mtd: number;
  projected: number;
  goal: number | null;
  /** % of goal reached so far — the bar fill. */
  goal_reached_pct: number | null;
  /** % of goal the current run rate projects to — drives ahead/behind. */
  projected_pct: number | null;
  /** Where a linear pace would put you today (days elapsed ÷ days in month) — the marker. */
  expected_pct: number;
  /** Projected vs goal, signed — "▲ 11% ahead" / "▼ 16% behind". */
  delta_pct: number | null;
  status: PaceStatus;
}

/** Forecast & Pace-to-Goal (SPEC-153). Calendar-month based. Company goal = the sum of
 * per-store goals when set. */
export interface ForecastPace {
  has_goal: boolean;
  goal: number | null;
  month_label: string;
  mtd_revenue: number;
  days_elapsed: number;
  days_in_month: number;
  days_remaining: number;
  daily_rate: number;
  projected: number;
  pct_to_goal: number | null;
  gap: number | null;
  needed_per_day: number | null;
  /** Extra $/day above the current run rate needed to close the projected gap. */
  catch_up_per_day: number | null;
  status: PaceStatus;
  stores: ForecastStoreRow[];
  ai_read: string | null;
  series: { date: string; revenue: number; cumulative: number }[];
}

// ── Stockout Risk + outcome ledger (SPEC-169 / backend SPEC-176) ─────────────

export type RiskBand = "critical" | "warning" | "healthy";

export interface StockoutItem {
  variant_id: number;
  location_id: number;
  product_title: string;
  variant_title: string | null;
  location_name: string | null;
  on_hand: number;
  units_sold: number;
  daily_units: number;
  days_of_cover: number;
  predicted_out_on: string;
  revenue_at_risk: number;
  band: RiskBand;
}

export interface StockoutBoard {
  has_data: boolean;
  generated_at: string;
  window_days: number;
  /** Days a reorder takes — the bar on each row is scaled against this. */
  lead_days: number;
  counts: Record<RiskBand, number>;
  revenue_at_risk_total: number;
  items: StockoutItem[];
}

/** `acted_upon` = the merchant reordered because of the warning, so the run-out
 * never happened. Deliberately NOT a hit and NOT a miss (backend SPEC-176 §5.1). */
export type StockoutVerdict = "hit" | "miss" | "acted_upon" | "unscorable";

export interface StockoutScoredRow {
  product_title: string;
  variant_title: string | null;
  location_name: string | null;
  predicted_out_on: string;
  actual_out_on: string | null;
  abs_error_days: number | null;
  tolerance_days: number;
  verdict: StockoutVerdict | null;
  resolution: string | null;
  driver: string | null;
  critic_verdict: string | null;
  revenue_at_risk: number;
  scored_at: string | null;
}

export interface StockoutAccuracy {
  has_data: boolean;
  judged: number;
  hits: number;
  /** Over judged rows only — `acted_upon` is excluded from the denominator. */
  hit_rate: number | null;
  mean_abs_error_days: number | null;
  acted_upon: number;
  unscorable: number;
  pending: number;
  next_horizon: string | null;
  predictions: StockoutScoredRow[];
}

// ── Season Radar (SPEC-170 / backend SPEC-177) ───────────────────────────────

export type SeasonStatus = "ok" | "suppressed" | "insufficient_history";
export type SeasonConfidence = "high" | "medium" | "low" | "insufficient_history";

export interface SeasonStoreRow {
  location_id: number;
  location_name: string | null;
  lift: number;
  baseline_daily: number;
  expected_daily: number;
  observations: number;
}

export type SeasonCategoryDirection = "surge" | "collapse" | "flat";

export interface SeasonCategoryRow {
  category: string;
  lift: number;
  observations: number;
  /** A collapse is as actionable as a surge — Tees run ~10.8x for Pesach and
   * ~0.14x for Rosh Hashanah, and the company-wide figure hides both. */
  direction: SeasonCategoryDirection;
}

export interface SeasonRampPoint {
  weeks_out: number;
  lift: number | null;
}

export interface SeasonOccasion {
  name: string;
  date: string;
  days_until: number;
  observations: number;
  confidence: SeasonConfidence;
  theme_hint: string;
  status: SeasonStatus;
  /** null when there is not enough history — never a multiplier from one year. */
  lift: number | null;
  lift_range?: [number, number];
  stores: SeasonStoreRow[];
  categories: SeasonCategoryRow[];
  ramp: SeasonRampPoint[];
  ramp_start_on: string | null;
  /** The decision: stock must be ORDERED by this date to be on the floor
   * before the ramp. */
  order_by_on: string | null;
  order_by_passed?: boolean;
  tolerance_pct?: number;
}

export interface SeasonRadar {
  has_data: boolean;
  generated_at: string;
  horizon_weeks: number;
  lead_days: number;
  occasions: SeasonOccasion[];
}

export interface SeasonScoredRow {
  occasion_name: string;
  occasion_date: string;
  location_name: string | null;
  predicted_lift: number;
  actual_lift: number | null;
  predicted_daily_revenue: number;
  actual_daily_revenue: number | null;
  abs_error_pct: number | null;
  confidence: SeasonConfidence;
  verdict: string | null;
  scored_at: string | null;
}

export interface SeasonAccuracy {
  has_data: boolean;
  judged: number;
  hits: number;
  hit_rate: number | null;
  mean_abs_error_pct: number | null;
  unscorable: number;
  pending: number;
  forecasts: SeasonScoredRow[];
}
