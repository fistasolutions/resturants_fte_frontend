/** Daily executive reports (SPEC-022) — mirrors GET /reports responses. */

export interface ReportListItem {
  report_date: string;
  generated_by: "ai" | "fallback";
  created_at: string;
}

export interface ReportList {
  items: ReportListItem[];
  total: number;
  limit: number;
  offset: number;
}

/** Stored metric payload (SPEC-025). Every field optional — the page must
 * tolerate older reports whose payloads predate newer sections. */
export interface ReportMetrics {
  report_date?: string;
  compared_to?: string;
  sales?: {
    gross_revenue: number;
    net_revenue: number;
    orders: number;
    aov: number;
    refunds_total: number;
    previous?: { gross_revenue: number; orders: number; aov: number };
    change_pct?: {
      gross_revenue: number | null;
      orders: number | null;
      aov: number | null;
    };
  };
  channels?: { channel: string; revenue: number; orders: number }[];
  top_products?: { title: string; units: number; revenue: number }[];
  worst_products?: {
    title: string;
    units: number;
    revenue: number;
    stock: number;
  }[];
  zero_sales?: {
    total_products: number;
    top_by_stock_value: { title: string; stock: number; stock_value: number }[];
  };
  customers?: {
    active: number;
    new: number;
    returning: number;
    returning_rate_pct: number;
  };
  top_customers?: {
    customer_id: number;
    name: string | null;
    email: string | null;
    spent: number;
    orders: number;
  }[];
  refunds?: { count: number; total: number; pct_of_revenue: number };
  inventory_counts?: { low_stock: number; out_of_stock: number };
  reorder_alerts?: {
    title: string;
    units: number;
    stock: number;
    days_of_cover: number;
  }[];
  top_discounts?: {
    active_codes: number;
    total_usage: number;
    top: { code: string; status: string; usage_count: number }[];
  };
  /** SPEC-027 report v2 payload additions (absent on older reports). */
  margin?: {
    gross_revenue: number;
    cost_known_revenue: number;
    cogs: number;
    product_margin: number | null;
    margin_pct: number | null;
    coverage_pct: number;
  };
  unfulfilled_by_location?: {
    location_id: number | null;
    location: string;
    total: number;
    h0_24: number;
    h24_48: number;
    h48_plus: number;
  }[];
  dead_stock_aged?: {
    buckets: Record<"d30_60" | "d60_90" | "d90_plus", { products: number; stock_value: number }>;
    top_by_value: {
      title: string;
      stock: number;
      stock_value: number;
      days_since_last_sale: number | null;
    }[];
  };
  locations?: {
    location_id: number | null;
    location: string;
    orders: number;
    aov: number | null;
    gross_revenue: number;
    margin_pct: number | null;
    coverage_pct: number;
  }[];
  /** D-19: sales-ranked Top-10 styles (backend SPEC-105). */
  top_styles?: { product_id: number; title: string; units: number; revenue: number }[];
  /** D-09: same-store (comparable) sales — this window vs the prior equal window. */
  same_store_sales?: {
    current_period: { start: string; end: string };
    previous_period: { start: string; end: string };
    locations: {
      location_id: number | null;
      location: string;
      current_revenue: number;
      previous_revenue: number;
      current_orders: number;
      previous_orders: number;
      change_pct: number | null;
    }[];
    comparable_total: {
      store_count: number;
      current_revenue: number;
      previous_revenue: number;
      change_pct: number | null;
    };
  };
}

/** D-08: live Daily/Weekly/Monthly rollup (backend SPEC-106). */
export type ReportPeriod = "daily" | "weekly" | "monthly";

export interface ReportRollup {
  period: ReportPeriod;
  date: string;
  metrics: ReportMetrics;
}

export interface ReportDetail {
  report_date: string;
  /** "all" | "vendor:<name>" | "location:<id>" (SPEC-033). */
  scope?: string;
  content_md: string;
  metrics: ReportMetrics;
  generated_by: "ai" | "fallback";
  created_at: string;
}

/** GET /reports/scopes — the tab lists (backend SPEC-026). */
export interface ReportScopes {
  vendors: string[];
  /** has_sales=false → inventory-only (warehouse / unassigned POS). */
  locations: { id: number; name: string; has_sales?: boolean }[];
}

/** Scoped report metric payload (backend SPEC-026 compose_scope_metrics). */
export interface ScopedReportMetrics {
  report_date?: string;
  scope?: string;
  sales?: {
    gross_revenue: number;
    orders: number;
    units: number;
    aov: number;
    previous?: { gross_revenue: number; orders: number };
    change_pct?: { gross_revenue: number | null; orders: number | null };
  };
  top_products?: { title: string; units: number; revenue: number }[];
  margin?: {
    margin_pct: number | null;
    coverage_pct: number;
    product_margin: number | null;
    cogs: number;
  } | null;
  customers?: { active: number; new?: number; returning?: number };
  /** Location scopes only — vendor refund attribution would be invented. */
  refunds?: { count: number; total: number } | null;
  /** 7 days ending on the report day. */
  trend?: { date: string; revenue: number; orders: number }[];
  /** Same-weekday-last-week comparison (SPEC-028). */
  sales_last_week?: {
    gross_revenue: number;
    orders: number;
    change_pct: { gross_revenue: number | null; orders: number | null };
  };
  // Brand-scope enrichment (SPEC-028)
  channels?: { channel: string; revenue: number; orders: number }[];
  location_split?: { location: string; revenue: number; units: number; orders: number }[];
  share?: { store_revenue: number; share_pct: number; rank: number | null; brands_selling: number };
  inventory?: {
    stockout_risks: { title: string; units_sold: number; stock: number; days_of_cover: number }[];
    oversold_variants: number;
  };
  markdown?: { products_on_markdown: number; deepest: { title: string; markdown_pct: number }[] };
  codes?: { code: string; orders: number }[];
  returns?: {
    basis: string;
    products: {
      title: string;
      refunded_orders: number;
      attributed_refund: number;
      return_rate_pct: number | null;
    }[];
  };
  // Location-scope enrichment (SPEC-028)
  top_brands?: { vendor: string; revenue: number; units: number }[];
  peak_hours?: { hour_utc: number; orders: number; revenue: number }[];
  unfulfilled?: {
    total: number;
    h0_24: number;
    h24_48: number;
    h48_plus: number;
  } | null;
  shelf?: { low_stock_variants: number; units_on_hand: number; stock_value: number };
  rank?: { rank: number | null; of_locations: number };
}

/** GET /reports/history — the paginated archive (SPEC-029/035). */
export interface ReportHistory {
  items: {
    report_date: string;
    scope: string;
    generated_by: "ai" | "fallback";
    created_at: string;
    updated_at: string;
  }[];
  total: number;
  limit: number;
  offset: number;
}

