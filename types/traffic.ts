/** Store traffic & conversion (backend SPEC-101). In-store footfall from V-Count
 * paired with Shopify orders → the conversion metric Shopify can't provide. */

/** Net sales + transparency + profit (backend SPEC-131). `sales` is NET
 * (gross − tax) everywhere, so stores that collect tax compare fairly with those
 * that don't. Profit fields are null unless COGS coverage ≥ 70% (never overstated). */
export interface SalesBreakdown {
  /** Gross sales (tax-inclusive) — the transparency counterpart to net `sales`. */
  gross_sales: number | null;
  /** Sales tax collected (gross − net); $0 for a non-taxed store. */
  tax_collected: number | null;
  gross_profit: number | null;
  profit_per_visitor: number | null;
  profit_margin: number | null;
  /** Units-with-a-known-cost ÷ total units (0–1); gates the profit fields. */
  cogs_coverage: number | null;
}

export interface TrafficTotals extends SalesBreakdown {
  visitors: number;
  transactions: number;
  /** Total units sold in-store (sum of POS order-item quantities). */
  units: number;
  /** transactions ÷ visitors, as a fraction (0–1); null when no traffic. */
  conversion_rate: number | null;
  /** NET sales (total_price − total_tax). */
  sales: number;
  sales_per_visitor: number | null;
  avg_order_value: number | null;
}

export interface HourlyTraffic {
  hour: number;
  visitors: number;
  visitors_out: number;
  transactions: number;
  conversion_rate: number | null;
}

export interface DailyTraffic {
  date: string;
  visitors: number;
  visitors_out: number;
  transactions: number;
  conversion_rate: number | null;
}

export interface TrafficPeaks {
  busiest_hour: number | null;
  busiest_hour_visitors: number | null;
  best_converting_hour: number | null;
  best_converting_rate: number | null;
}

/** Per-store conversion (SPEC-101 Patches / SPEC-112): each store's visitors
 * paired with only that location's POS orders. `counter_suspect` = more sales
 * than counted visitors → the door sensor is under-counting. */
export interface TrafficByStore extends SalesBreakdown {
  store_code: string;
  location: string;
  /** Shopify location id when matched — links the League row to its detail page. */
  location_id: number | null;
  matched: boolean;
  visitors: number;
  visitors_out: number;
  transactions: number | null;
  /** Units sold at this store (sum of POS order-item quantities); null unmatched. */
  units: number | null;
  conversion_rate: number | null;
  /** NET sales (total_price − total_tax); null unmatched. */
  sales: number | null;
  sales_per_visitor: number | null;
  avg_order_value: number | null;
  counter_suspect: boolean;
  /** Share of total footfall / sales across stores (0–1); gap = leader conversion
   * minus this store's (fraction; 0 for the leader, null when suspect/no data). */
  visitor_share: number | null;
  sales_share: number | null;
  conversion_gap: number | null;
  /** Conversion in the equal window immediately before this one, and the
   * point delta (current − previous, fraction); null when suspect/no prior data. */
  prev_conversion_rate: number | null;
  conversion_delta: number | null;
}

/** Lost-sales opportunity: lift under-performing stores to the best reliable
 * store's conversion (SPEC-112). */
export interface TrafficLostSalesStore {
  location: string;
  /** Drill-down target; null when unmatched. */
  location_id: number | null;
  current_rate: number | null;
  /** Week-over-week conversion delta (fraction) — is the gap widening/narrowing. */
  conversion_delta: number | null;
  uplift_transactions: number;
  uplift_sales: number;
}

export interface TrafficLostSales {
  benchmark_store: string | null;
  benchmark_rate: number | null;
  stores: TrafficLostSalesStore[];
  total_opportunity: number;
}

/** Per-store daily in/out series (SPEC-112 Patches) — feeds the Overview
 * "visitors by store" multi-line chart. Arrays are aligned to `dates`. */
export interface TrafficStoreSeries {
  store_code: string;
  location: string;
  visitors_in: number[];
  visitors_out: number[];
}
export interface TrafficStoreDaily {
  dates: string[];
  stores: TrafficStoreSeries[];
}

/** Peak-hours / heatmap payload (SPEC-113): weekday×hour footfall + the
 * "lost hours" staffing signal (busy hours converting below the store average). */
export interface TrafficHeatCell {
  weekday: number; // 0=Mon … 6=Sun
  hour: number;
  visitors: number;
  transactions: number;
  conversion_rate: number | null;
}
export interface TrafficLostHour {
  hour: number;
  visitors: number;
  conversion_rate: number | null;
  est_lost_sales: number;
}
export interface TrafficPeakHours {
  has_data: boolean;
  heatmap: TrafficHeatCell[];
  hours: { hour: number; visitors: number; transactions: number; conversion_rate: number | null }[];
  peak: { weekday: number; hour: number; visitors: number } | null;
  quiet: { weekday: number; hour: number; visitors: number } | null;
  busiest_day: { weekday: number; visitors: number } | null;
  lost_hours: {
    avg_conversion: number | null;
    hours: TrafficLostHour[];
    total_lost: number;
  };
  /** Hours dropped because the counter recorded more sales than visitors — they were
   *  inflating the store average every other figure is measured against (SPEC-113 patch). */
  excluded_cells?: number;
  /** Busy hours dropped because the shop was barely trading in them. */
  excluded_not_trading?: number;
  last_sync: string | null;
}

/** One store's drill-down (backend SPEC-101 Patch) — `/traffic/stores/[id]`. */
export interface TrafficStoreDetail {
  found: boolean;
  location_id: number;
  location: string;
  matched: boolean;
  counter_suspect: boolean;
  has_data: boolean;
  totals: SalesBreakdown & {
    visitors: number;
    visitors_out: number;
    transactions: number;
    units: number;
    /** NET sales (total_price − total_tax). */
    sales: number;
    conversion_rate: number | null;
    avg_order_value: number | null;
    sales_per_visitor: number | null;
  };
  trend: { prev_conversion_rate: number | null; conversion_delta: number | null };
  benchmark: {
    store: string | null;
    rate: number | null;
    gap_pts: number | null;
    opportunity: number | null;
    uplift_transactions: number | null;
  };
  daily: {
    date: string;
    visitors: number;
    visitors_out: number;
    transactions: number;
    conversion_rate: number | null;
  }[];
  heatmap: TrafficHeatCell[];
  lost_by_weekday: {
    weekday: number;
    visitors: number;
    conversion_rate: number | null;
    est_lost_sales: number;
  }[];
  peak: { weekday: number; hour: number; visitors: number } | null;
  busiest_day: { weekday: number; visitors: number } | null;
  lost_hours: { avg_conversion: number | null; hours: TrafficLostHour[]; total_lost: number };
  last_sync: string | null;
}

export interface TrafficOverview {
  has_data: boolean;
  totals: TrafficTotals;
  by_store: TrafficByStore[];
  lost_sales: TrafficLostSales;
  store_daily: TrafficStoreDaily;
  hourly: HourlyTraffic[];
  daily: DailyTraffic[];
  peaks: TrafficPeaks;
  last_sync: string | null;
}
