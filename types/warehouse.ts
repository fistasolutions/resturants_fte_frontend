/** Warehouse packing analytics (backend SPEC-097). Per-packer productivity/
 * quality from iPacky + the live Shopify unfulfilled backlog. */

export interface PackerRow {
  packer_name: string;
  orders_packed: number;
  items_packed: number;
  avg_packing_seconds: number | null;
  avg_lead_seconds: number | null;
  active_seconds: number;
  orders_per_hour: number | null;
  items_per_hour: number | null;
  deviations: number;
  repacks: number;
  deviation_rate: number | null;
  utilization: number | null;
}

export interface BacklogAging {
  d0_2: number;
  d3_7: number;
  d8_30: number;
  d30_plus: number;
}

/** Supervision signal on the backlog (SPEC-147) — computed from the aging buckets. */
export interface BacklogAttention {
  needs_attention: boolean;
  severity: "red" | "yellow" | "none";
  aged_count: number;
  why: string;
}

export interface WarehouseBacklog {
  waiting_to_pack: number;
  aging: BacklogAging;
  burn_down_days: number | null;
  daily_pack_rate: number;
  oldest_unfulfilled_order: string | null;
  oldest_unfulfilled_created_at: string | null;
  oldest_unfulfilled_age_days: number | null;
  attention: BacklogAttention;
}

export interface WarehouseTotals {
  orders_packed: number;
  items_packed: number;
  deviations: number;
  repacks: number;
  packers: number;
  orders_per_hour: number | null;
  active_seconds: number;
  avg_pack_seconds: number | null;
  avg_lead_seconds: number | null;
}

export interface HourlyBucket {
  hour: number;
  orders: number;
}

export interface WarehouseOverview {
  has_data: boolean;
  totals: WarehouseTotals;
  packers: PackerRow[];
  hourly: HourlyBucket[];
  backlog: WarehouseBacklog;
  last_sync: string | null;
}

/** Drilldown: one packer's individual order-checks (backend SPEC-097). */
export interface PackerOrder {
  order_number: string;
  checked_at: string | null;
  picked_at: string | null;
  pack_seconds: number | null;
  lead_seconds: number | null;
  item_quantity: number | null;
  line_count: number | null;
  deviation: boolean;
  note: string | null;
}

export interface PackerOrders {
  packer_name: string;
  orders: PackerOrder[];
}

export type BacklogBucket = "all" | "d0_2" | "d3_7" | "d8_30" | "d30_plus" | "aged";

/** Drilldown: an actual still-waiting Shopify order in a backlog aging bucket. */
export interface BacklogOrder {
  order_number: string;
  created_at: string | null;
  age_days: number;
  total_price: number | null;
}

export interface BacklogOrders {
  bucket: string;
  count: number;
  orders: BacklogOrder[];
}
