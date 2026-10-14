/** Returns Intelligence — merchandising + margin analytics (backend SPEC-087).
 * Mirrors GET /loop/returns/{overview,by-style,by-size,by-category,style/{id}}.
 * All rates/margins are fractions (0..1) or null (nothing sold → never ÷0). */

export interface ReasonCount {
  reason: string;
  count: number;
}

export interface ReturnsOverview {
  has_data: boolean;
  returns_count: number;
  units_returned: number;
  units_sold: number;
  return_rate: number | null;
  return_value: number;
  refund_total: number;
  exchange_total: number;
  credit_total: number;
  exchange_pct: number | null;
  open_backlog: number;
  profit_lost: number;
  profit_lost_annualized: number;
  window_days: number;
  cost_coverage: number | null;
  reason_breakdown: ReasonCount[];
}

export interface StyleRow {
  product_id: number;
  style_code: string | null;
  style_name: string | null;
  category: string | null;
  units_sold: number;
  units_returned: number;
  return_rate: number | null;
  revenue: number;
  margin_pct: number | null;
  top_reason: string | null;
  profit_lost: number;
}

export interface ByStyleResponse {
  has_data: boolean;
  styles: StyleRow[];
}

export interface SizeCell {
  size: string;
  units_sold: number;
  units_returned: number;
  return_rate: number | null;
  flagged: boolean;
}

export interface SizingStyleRow {
  product_id: number;
  style_code: string | null;
  style_name: string | null;
  style_return_rate: number | null;
  has_defect: boolean;
  sizes: SizeCell[];
}

/** Store-wide size return profile (backend SPEC-087 Patch) — every size cell
 * aggregated across all styles, in canonical size order. */
export interface SizeProfileCell {
  size: string;
  units_sold: number;
  units_returned: number;
  return_rate: number | null;
}

export interface BySizeResponse {
  has_data: boolean;
  styles: SizingStyleRow[];
  /** Optional — absent on backends predating SPEC-087's size-profile patch. */
  size_profile?: SizeProfileCell[];
}

export interface CategoryRow {
  category: string;
  units_sold: number;
  units_returned: number;
  return_rate: number | null;
  profit_lost: number;
}

export interface ByCategoryResponse {
  has_data: boolean;
  categories: CategoryRow[];
}

export type Recommendation = "keep" | "fix" | "kill";

export interface RecentReturn {
  order_name: string | null;
  /** Shopify order id — resolves on the Orders page. */
  order_id: string | null;
  returned_on: string | null;
  outcome: string | null;
  variant_title: string | null;
  reason: string | null;
  refund: number;
  /** Value of the returned item — shown instead of a $0 refund on exchanges. */
  item_value: number;
}

/** AI Returns Action Plan (backend SPEC-096) — cached commentary shape. */
export interface ReturnsActionPlan {
  page: string;
  period: string;
  content_md: string;
  generated_at: string;
  stale: boolean;
}

export interface StyleDetail {
  has_data: boolean;
  product_id: number;
  style_code: string | null;
  style_name: string | null;
  category: string | null;
  units_sold: number;
  units_returned: number;
  return_rate: number | null;
  revenue: number;
  margin_pct: number | null;
  profit_lost: number;
  recommendation: Recommendation;
  sizes: SizeCell[];
  reason_mix: ReasonCount[];
  recent_returns: RecentReturn[];
}
