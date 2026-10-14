export interface DueToReorderCustomer {
  customer_id: number;
  first_name: string | null;
  last_name: string | null;
  email: string;
  orders_count: number;
  total_spent: number;
  avg_gap_days: number;
  days_since_last: number;
  days_overdue: number;
}

export interface VipSummary {
  count: number;
  total_value: number;
}

export interface DueToReorderPage {
  customers: DueToReorderCustomer[];
  total: number;
  total_candidates: number;
  page: number;
  pages: number;
}

export interface CategoryLoverCustomer {
  customer_id: number;
  first_name: string | null;
  last_name: string | null;
  email: string;
  orders_count: number;
  total_spent: number;
  category_spend: number;
  days_silent: number;
}

export interface CategoryLoversSegment {
  category: string;
  customers: CategoryLoverCustomer[];
  count: number;
  total_value: number;
  avg_orders: number;
  min_days_silent: number;
  max_days_silent: number;
}

export interface SaleOnlyShopperCustomer {
  customer_id: number;
  first_name: string | null;
  last_name: string | null;
  email: string;
  orders_count: number;
  discount_rate_pct: number;
  total_spent: number;
  days_silent: number;
}

export interface SaleOnlyShoppersSegment {
  customers: SaleOnlyShopperCustomer[];
  count: number;
  total_value: number;
}

export interface HeroSummary {
  total_customers: number;
  total_value: number;
  segment_count: number;
}

export interface MoneyFinderResponse {
  hero: HeroSummary;
  vip_summary: VipSummary;
  due_to_reorder: DueToReorderPage;
  category_lovers: CategoryLoversSegment | null;
  sale_only_shoppers: SaleOnlyShoppersSegment | null;
}



/** Discount segments (backend SPEC-208 / frontend SPEC-189). */
export interface CustomerSegment {
  segment: string;
  label: string;
  customers: number;
  orders: number;
  revenue: number;
  aov: number;
  discountGiven: number;
}

export interface CustomerSegmentsData {
  segments: CustomerSegment[];
  customersCounted: number;
  excludedGuestOrders: number;
}

/** Repeat-purchase clock (backend SPEC-209 / frontend SPEC-189). */
export interface RepeatClockBucket {
  label: string;
  low: number;
  high: number | null;
  customers: number;
  sharePct: number;
}

export interface RepeatClockData {
  summary: {
    customersMeasured: number;
    /** Null on an empty population — never a misleading 0. */
    medianDays: number | null;
    p25Days: number | null;
    p75Days: number | null;
  };
  buckets: RepeatClockBucket[];
}

/** One top customer with every platform's view (backend SPEC-253 / frontend SPEC-247). */
export type CustomerHealthVerdict = "open_issue" | "going_quiet" | "draining" | "healthy";

export interface CustomerHealthRow {
  customerId: number;
  name: string;
  email: string | null;
  orders: number;
  spent: number;
  refunds: number;
  refunded: number;
  /** Null when nothing was spent. */
  refundPct: number | null;
  net: number;
  lastOrderAt: string;
  daysSinceLastOrder: number;
  /** Null under three orders — no cadence to speak of. */
  avgGapDays: number | null;
  loopReturns: number;
  loopOpen: number;
  tickets: number;
  openTickets: number;
  lastTicketAt: string | null;
  openTicketReason: string | null;
  openTicketSince: string | null;
  verdict: CustomerHealthVerdict;
  verdictLabel: string;
  verdictTone: "bad" | "warn" | "neutral" | "good";
  why: string;
}

export interface CustomerHealthData {
  windowDays: number;
  /** SPEC-365: the days the window really covers — a full year, or since the first order. */
  coveredDays: number;
  /** ISO date the covered window starts; null from an older backend. */
  coveredSince: string | null;
  summary: {
    customers: number;
    spendReviewed: number;
    openIssue: number;
    goingQuiet: number;
    draining: number;
    healthy: number;
    atStake: number;
    refundedByDraining: number;
    /** Null when the window holds no tickets at all. */
    ticketEmailCoveragePct: number | null;
  };
  customers: CustomerHealthRow[];
}

