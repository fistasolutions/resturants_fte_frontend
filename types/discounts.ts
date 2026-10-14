/** Discount Monitoring read models (backend SPEC-099, frontend SPEC-098). */

export interface DiscountCompany {
  gross: number;
  discount: number;
  discount_pct: number | null;
  orders: number;
  discounted_orders: number;
  avg_discount: number | null;
}

export interface DiscountLocation {
  location_id: number | null;
  location: string;
  gross: number;
  discount: number;
  discount_pct: number | null;
  orders: number;
  discounted_orders: number;
  avg_discount: number | null;
}

export interface DiscountTypeBucket {
  amount: number;
  orders: number;
}

export interface DiscountOverview {
  company: DiscountCompany;
  locations: DiscountLocation[];
  type_split: {
    manual: DiscountTypeBucket;
    code: DiscountTypeBucket;
    automatic: DiscountTypeBucket;
    script: DiscountTypeBucket;
  };
  alert_counts: { red: number; yellow: number };
}

export interface DiscountPromotion {
  title: string;
  type: string;
  value_type: string | null;
  discount: number;
  orders: number;
}

export interface DiscountEmployee {
  staff_user_id: number | null;
  staff_name: string | null;
  mapped: boolean;
  manual_orders: number;
  manual_amount: number;
  avg_discount: number | null;
  max_discount: number;
  total_orders: number;
  pct_orders_discounted: number | null;
  outlier: boolean;
}

/** Discounts-by-reason breakdown (WHY) — backend SPEC-137. */
export interface DiscountReason {
  reason: string;
  amount: number;
  orders: number;
}
export interface DiscountReasons {
  reasons: DiscountReason[];
  no_reason: { amount: number; orders: number };
  total_manual: number;
  /** Share of manual-discount $ with no captured reason (0–100), or null. */
  no_reason_pct: number | null;
}

export interface DiscountTransaction {
  order_id: number;
  order_number: string;
  created_at: string | null;
  location: string;
  device_id: string | null;
  customer_name: string | null;
  original_value: number;
  final_value: number;
  discount: number;
  discount_pct: number | null;
}

export interface DiscountApplication {
  type: string;
  label: string | null;
  reason_captured: boolean;
  value: number | null;
  value_type: string | null;
  amount: number;
}

export interface DiscountItem {
  title: string;
  sku: string | null;
  quantity: number;
  unit_price: number;
  original_value: number;
  final_value: number;
  discount: number;
  discount_pct: number | null;
}

export interface DiscountTransactionDetail {
  order_id: number;
  order_number: string;
  created_at: string | null;
  location: string;
  device_id: string | null;
  staff_user_id: number | null;
  staff_name: string | null;
  customer_name: string | null;
  original_value: number;
  final_value: number;
  discount: number;
  discount_pct: number | null;
  /** Discount applied to the whole order, not to specific line items (SPEC-138). */
  order_level_discount: number;
  item_count: number;
  applications: DiscountApplication[];
  items: DiscountItem[];
}

export interface DiscountAlert {
  order_id: number;
  order_number: string;
  created_at: string | null;
  location: string;
  staff_user_id: number | null;
  staff_name: string | null;
  discount: number;
  discount_pct: number | null;
  reasons: string[];
  severity: "red" | "yellow";
}

export interface DiscountAlerts {
  signal: "green" | "yellow" | "red";
  counts: { red: number; yellow: number };
  alerts: DiscountAlert[];
}

/** A supervision action item (SPEC-142) — a flagged discount turned into
 * State · Reason · Action: WHY it's flagged, WHERE (location + staff), the
 * location's manager to email, and a ready-to-send draft. */
export interface DiscountAttentionItem {
  order_id: number;
  order_number: string;
  created_at: string | null;
  location: string;
  location_id: number | null;
  staff_name: string | null;
  /** The location's manager email (Settings), or null → action disabled. */
  manager_email: string | null;
  discount: number;
  discount_pct: number | null;
  reasons: string[];
  severity: "red" | "yellow";
  /** Plain-English "why this is flagged". */
  why: string;
  /** Ready-to-send manager email. */
  draft: { subject: string; body: string };
  /** ISO timestamp of the last review email sent for this order, or null (SPEC-143). */
  sent_at: string | null;
}
export interface DiscountAttention {
  signal: "green" | "yellow" | "red";
  counts: { red: number; yellow: number };
  items: DiscountAttentionItem[];
}
