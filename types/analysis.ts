/** Product & inventory analysis aggregates (SPEC-023/024) — mirror
 * GET /analysis/products and GET /analysis/inventory (backend SPEC-015). */

export interface AnalysisWindow {
  key: string;
  start: string;
  end: string;
}

export interface BestSeller {
  product_id: number;
  title: string;
  units: number;
  revenue: number;
  image_url: string | null;
}

export interface WorstSeller {
  product_id: number;
  title: string;
  units: number;
  revenue: number;
  orders: number;
  stock: number;
}

export interface ZeroSalesProduct {
  product_id: number;
  title: string;
  stock: number;
  stock_value: number;
}

export interface ZeroSales {
  total_products: number;
  top_by_stock_value: ZeroSalesProduct[];
}

export interface ProductReturn {
  product_id: number;
  title: string;
  refunded_orders: number;
  orders: number;
  attributed_refund: number;
  return_rate_pct: number | null;
}

export interface ProductReturns {
  basis: string;
  products: ProductReturn[];
}

export interface HeavyDiscount {
  product_id: number;
  title: string;
  units: number;
  discount_total: number;
  discounted_orders: number;
  discount_pct: number | null;
}

export interface SellThroughProduct {
  product_id: number;
  title: string;
  units: number;
  stock: number;
  revenue: number;
  sell_through_pct: number | null;
}

export interface SellThrough {
  basis: string;
  products: SellThroughProduct[];
}

export interface CategoryPerformance {
  category: string;
  revenue: number;
  units: number;
  orders: number;
  products: number;
}

export type CatalogStatus = "best_seller" | "healthy" | "slow" | "dead_stock";

export interface CatalogRow {
  product_id: number;
  title: string;
  category: string;
  units: number;
  revenue: number;
  stock: number;
  margin_pct: number | null;
  discount_pct: number | null;
  return_rate_pct: number | null;
  sell_through_pct: number | null;
  status: CatalogStatus;
}

export interface ProductVerdicts {
  best_seller: { title: string; revenue: number } | null;
  highest_margin: CatalogRow | null;
  highest_returns: ProductReturn | null;
  no_sales_60d: number;
}

export interface ReturnVerdict {
  product_id: number;
  title: string;
  verdict: string;
}

export interface ReturnVerdicts {
  verdicts: ReturnVerdict[];
  generated_at: string;
  stale: boolean;
}

/** Per-product catalog AI verdict (SPEC-105, backend SPEC-103) — one short
 * standing note per product, generated on-demand for the visible page. */
export interface CatalogVerdict {
  product_id: number;
  verdict: string;
}

export interface CatalogVerdicts {
  verdicts: CatalogVerdict[];
  generated_at: string;
  stale: boolean;
}

/** One image in a product's gallery (SPEC-146, backend product_images). */
export interface ProductGalleryImage {
  id: number;
  src: string;
  position: number;
  alt: string | null;
  width: number | null;
  height: number | null;
}

export interface ProductVariantDetail {
  variant: string;
  sku: string | null;
  price: number;
  compare_at_price: number | null;
  markdown_pct: number | null;
  margin_pct: number | null;
  stock: number;
  image_id: number | null;
  /** Resolved from the gallery — the photo this variant/colour is shown with. */
  image_src: string | null;
}

/** Single-product detail for the Product Analyst drill-in (SPEC-146). */
export interface ProductDetail {
  product_id: number;
  title: string;
  category: string;
  status: string;
  vendor: string | null;
  /** Featured thumbnail (kept for fast lists); the gallery is `images`. */
  image_url: string | null;
  images: ProductGalleryImage[];
  price_min: number;
  price_max: number;
  total_stock: number;
  variants: ProductVariantDetail[];
  window_sales: { units: number; revenue: number; orders: number };
  /** SPEC-162/160: units sold split by selling location, units-descending.
   *  `location_id: null` is the online / unattributed bucket; the backend
   *  supplies the display label, so never re-derive it here. */
  sales_by_location: ProductLocationSales[];
}

export interface ProductLocationSales {
  location_id: number | null;
  location_name: string;
  units: number;
  revenue: number;
  orders: number;
}

export interface ProductAnalysis {
  period: AnalysisWindow;
  verdicts: ProductVerdicts;
  best_sellers: BestSeller[];
  worst_sellers: WorstSeller[];
  zero_sales: ZeroSales;
  returns: ProductReturns;
  top_returns: ProductReturn[];
  heavy_discounting: HeavyDiscount[];
  sell_through: SellThrough;
  categories: CategoryPerformance[];
  catalog: CatalogRow[];
}

export type TransferUrgency = "critical" | "high" | "medium" | "low";

export interface InventoryTransfer {
  product_id: number;
  title: string;
  warehouse_units: number;
  store_units: number;
  units_sold: number;
  daily_rate: number;
  days_of_cover: number;
  suggested_transfer: number;
  revenue_at_risk: number;
  urgency: TransferUrgency;
}

export interface TransferSummary {
  products_misallocated: number;
  total_units_to_transfer: number;
  revenue_at_risk: number;
}

export interface InventoryTransfers {
  warehouse_location: string;
  summary: TransferSummary;
  transfers: InventoryTransfer[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// ── Unified Transfer Plan (backend SPEC-084) ──────────────────────────────────

export type TransferDirection = "warehouse_to_store" | "store_to_store";

export interface TransferPlanRow {
  direction: TransferDirection;
  product_id: number;
  title: string;
  from_location: string;
  /** null for warehouse rows (aggregate destination — UI shows "Stores"). */
  to_location: string | null;
  /** Destination location id for store→store rows; drives the drill-down link. */
  to_location_id: number | null;
  suggested_units: number;
  /** Dollar opportunity — the ranking key. */
  opportunity_value: number;
  /** Present on warehouse rows only. */
  urgency: TransferUrgency | null;
  reason: string;
  sendable: boolean;
}

export interface TransferPlanDirectionSummary {
  rows: number;
  value: number;
  units: number;
}

export interface TransferPlanSummary {
  total_opportunity_value: number;
  warehouse_to_store: TransferPlanDirectionSummary;
  store_to_store: TransferPlanDirectionSummary;
}

export interface TransferPlan {
  generated_at: string;
  warehouse_location: string;
  summary: TransferPlanSummary;
  rows: TransferPlanRow[];
}

export interface PageCommentary {
  page: string;
  period: string;
  content_md: string;
  generated_at: string;
  stale: boolean;
}

export interface InventoryCounts {
  low_stock: number;
  out_of_stock: number;
}

export interface OutOfStockSeller {
  product_id: number;
  title: string;
  units: number;
  window_revenue: number;
  stock: number;
}

export interface ReorderAlert {
  product_id: number;
  title: string;
  units: number;
  stock: number;
  days_of_cover: number;
  revenue_at_risk: number;
  units_to_reorder: number;
}

export interface DeadStockAgeBucket {
  products: number;
  stock_value: number;
}

export interface DeadStockAgedTopItem {
  product_id: number;
  title: string;
  stock: number;
  stock_value: number;
  days_since_last_sale: number | null;
}

export interface DeadStockAged {
  buckets: {
    d90_180: DeadStockAgeBucket;
    d180_plus: DeadStockAgeBucket;
  };
  top_by_value: DeadStockAgedTopItem[];
}

/** One rung of the escalating markdown ladder (backend SPEC-085). */
export interface DiscountTier {
  label: string;
  discount_pct: number;
  projected_recovery: number;
}

export type DeadStockUrgency = "clear_now" | "high" | "moderate";

export interface DeadStockRecommendation {
  product_id: number;
  title: string;
  recommended_discount_pct: number;
  action: string;
  projected_recovery: number;
  // SPEC-085 enrichment — optional so pre-enrichment cached plans still parse.
  rationale?: string;
  urgency?: DeadStockUrgency;
  discount_ladder?: DiscountTier[];
}

export interface DeadStockPlan {
  headline: string;
  total_projected_recovery: number;
  recommendations: DeadStockRecommendation[];
  generated_at: string;
  stale: boolean;
}

export interface DeadStockProduct {
  product_id: number;
  title: string;
  stock: number;
  stock_value: number;
}

export interface DeadStock {
  total_products: number;
  total_units: number;
  total_stock_value: number;
  top_by_stock_value: DeadStockProduct[];
}

export interface OverstockProduct {
  product_id: number;
  title: string;
  units: number;
  stock: number;
  stock_value: number;
  days_of_cover: number;
}

export interface Mover {
  product_id: number;
  title: string;
  units: number;
  revenue: number;
  stock: number;
}

export interface LocationStock {
  location_id: number;
  name: string;
  units: number;
  items: number;
}

/** Enriched per-location inventory dashboard (backend SPEC-100). */
export interface InventoryLocationRow {
  location_id: number;
  name: string;
  units: number;
  stock_value: number;
  variants: number;
  out_of_stock: number;
  low_stock: number;
  value_share: number | null;
}

export interface InventoryByLocationDashboard {
  locations: InventoryLocationRow[];
  totals: {
    locations: number;
    units: number;
    stock_value: number;
    out_of_stock: number;
    low_stock: number;
  };
}

export interface InventoryVerdicts {
  out_of_stock_variants: number;
  most_urgent_reorder: ReorderAlert | null;
  top_missed_seller: OutOfStockSeller | null;
  dead_stock_value: { total_stock_value: number; total_products: number };
}

export interface InventoryAnalysis {
  period: AnalysisWindow;
  verdicts: InventoryVerdicts;
  counts: InventoryCounts;
  out_of_stock_sellers: OutOfStockSeller[];
  reorder_alerts: ReorderAlert[];
  dead_stock: DeadStock;
  overstock: OverstockProduct[];
  fast_movers: Mover[];
  slow_movers: Mover[];
  by_location: LocationStock[];
}

// ── Dead-inventory cross-location alerts ────────────────────────────────────

export interface DeadInventoryElsewhere {
  location_id: number;
  location_name: string;
  units_sold: number;
}

export interface DeadInventorySizeBreakdown {
  variant_title: string;
  sku: string | null;
  units: number;
}

export interface DeadInventoryAlert {
  product_id: number;
  title: string;
  location_id: number;
  location_name: string;
  stock: number;
  stock_value: number;
  /** Null when this location has never recorded a sale of this style. */
  days_since_last_sale: number | null;
  selling_elsewhere: DeadInventoryElsewhere[];
  sales_gap: number;
  size_breakdown: DeadInventorySizeBreakdown[];
  /** Null when the product has no synced thumbnail yet. */
  image_url: string | null;
  sent: boolean;
  sent_at: string | null;
}

export interface DeadInventoryAlerts {
  generated_at: string;
  window_days: number;
  summary: {
    styles_flagged: number;
    total_value: number;
    locations_affected: number;
  };
  alerts: DeadInventoryAlert[];
}

/** A selling (non-warehouse) location (SPEC-083, backend SPEC-078) — the
 * Store Transfers index page's list of stores to drill into. */
export interface TransferEligibleLocation {
  id: number;
  name: string;
}

/** One transfer-in candidate for a destination location (SPEC-081, backend
 * SPEC-075) — the same cross-location data `DeadInventoryAlert` flags,
 * reshaped by destination instead of source. */
export interface LocationTransferOpportunity {
  product_id: number;
  title: string;
  source_location_id: number;
  source_location_name: string;
  source_stock: number;
  source_stock_value: number;
  /** Null when the source location has never recorded a sale of this style. */
  days_since_last_sale_at_source: number | null;
  /** This destination location's own sales in the window — the demand signal. */
  destination_units_sold: number;
  /** This destination location's own current stock of the style. */
  destination_stock: number;
  size_breakdown: DeadInventorySizeBreakdown[];
  /** Null when the product has no synced thumbnail yet. */
  image_url: string | null;
}

export interface LocationTransferOpportunities {
  generated_at: string;
  window_days: number;
  location_id: number;
  location_name: string;
  summary: {
    styles_available: number;
    total_units_available: number;
  };
  opportunities: LocationTransferOpportunity[];
}

export interface DeadInventorySendResult {
  email_sent: boolean;
  email_error: string | null;
  location_email: string;
}


/** True Profit per SKU (backend SPEC-204 / frontend SPEC-185). */
export interface TrueProfitRow {
  productId: number;
  title: string;
  category: string;
  units: number;
  unitsReturned: number;
  grossRevenue: number;
  discounts: number;
  cogs: number;
  returns: number;
  trueProfit: number;
  /** Null when there is no revenue to divide by. */
  marginPct: number | null;
  /** Share of the product's revenue that sits on cost-known lines. */
  costCoveragePct: number;
  verdict: string;
  verdictTone: "good" | "bad" | "muted";
}

export interface TrueProfitSummary {
  grossRevenue: number;
  discounts: number;
  cogs: number;
  returns: number;
  trueProfit: number;
  productsCounted: number;
  lossMakers: number;
  lossMakerTotal: number;
  missingCostProducts: number;
}

export interface TrueProfitData {
  summary: TrueProfitSummary;
  products: TrueProfitRow[];
}

/** Brand verdicts (backend SPEC-246 / frontend SPEC-239). */
export type BrandVerdict = "stop" | "buy_less" | "buy_more" | "hold" | "too_few_sales";
export type BrandVerdictTone = "bad" | "warn" | "good" | "neutral" | "muted";

export interface BrandRow {
  vendor: string;
  products: number;
  units: number;
  revenue: number;
  orders: number;
  /** Shopify refund lines across every channel, the counter included. */
  unitsReturned: number;
  refundValue: number;
  /** unitsReturned ÷ units; 0 when nothing sold. */
  returnRate: number;
  stockUnits: number;
  stockValue: number;
  /** units ÷ (units + stockUnits); null when both are 0. */
  sellThrough: number | null;
  deadProducts: number;
  deadStockValue: number;
  /** Null without any cost data. */
  productMargin: number | null;
  marginPct: number | null;
  /** Share of the brand's revenue on cost-known lines; margin only judges ≥ the floor. */
  coveragePct: number;
  verdict: BrandVerdict;
  verdictLabel: string;
  verdictTone: BrandVerdictTone;
  /** One sentence naming the number that tripped the verdict. */
  why: string;
}

export interface BrandVerdictsSummary {
  vendors: number;
  withVerdict: number;
  stop: number;
  buyLess: number;
  buyMore: number;
  hold: number;
  tooFewSales: number;
  returnsSource: string;
  marginMinCoveragePct: number;
}

export interface BrandVerdictsData {
  summary: BrandVerdictsSummary;
  brands: BrandRow[];
}


/** Discount cannibalisation (backend SPEC-205 / frontend SPEC-186). */
export interface CannibalisationCode {
  code: string;
  orders: number;
  discountGiven: number;
  discountToExisting: number;
  existingSharePct: number;
  newCustomers: number;
  existingOrders: number;
  unattributedOrders: number;
  /** Null when the code acquired nobody — not 0, which would read as "free". */
  costPerNewCustomer: number | null;
  verdict: string;
  verdictTone: "good" | "bad" | "warn" | "muted";
}

export interface CannibalisationData {
  summary: {
    codesCounted: number;
    discountGiven: number;
    discountToExisting: number;
    existingSharePct: number;
    newCustomers: number;
    notAcquiringCodes: number;
    notAcquiringSpend: number;
  };
  codes: CannibalisationCode[];
}

/** Discount decisions (backend SPEC-251 / frontend SPEC-244). */
export type DiscountDecisionVerdict = "cost_margin" | "no_lift" | "worked" | "always_on" | "too_small";

export interface DiscountDecisionStore {
  ordersPerDayBefore: number;
  ordersPerDayDuring: number;
  ordersDeltaPct: number | null;
  revenuePerDayBefore: number;
  revenuePerDayDuring: number;
  revenueDeltaPct: number | null;
  marginPctBefore: number | null;
  marginPctDuring: number | null;
  marginDeltaPts: number | null;
  /** The lower of the two windows' cost coverage. */
  coveragePct: number;
}

export interface DiscountDecision {
  code: string;
  periodDays: number;
  /** Shopify's own start/end when the code has a row (`source: "shopify"`), else first/last use. */
  window: { start: string; end: string; days: number; source: "shopify" | "orders"; openEnded: boolean };
  codeOrders: number;
  codeRevenue: number;
  discountGiven: number;
  newCustomers: number;
  existingOrders: number;
  discountToExisting: number;
  existingSharePct: number | null;
  store: DiscountDecisionStore;
  verdict: DiscountDecisionVerdict;
  verdictLabel: string;
  verdictTone: "warn" | "bad" | "good" | "neutral" | "muted";
  why: string;
}

export interface DiscountDecisionsData {
  summary: {
    codesJudged: number;
    worked: number;
    costMargin: number;
    noLift: number;
    alwaysOn: number;
    tooSmall: number;
    discountGiven: number;
    discountToExisting: number;
  };
  decisions: DiscountDecision[];
}


/** Return-reason product fixes (backend SPEC-206 / frontend SPEC-187). */
export interface ReturnReasonMix {
  reason: string;
  lines: number;
  value: number;
  sharePct: number;
  fix: string;
}

export interface ReturnFixProduct {
  productId: string;
  title: string;
  returns: number;
  refundValue: number;
  topReason: string;
  topReasonSharePct: number;
  fix: string;
  /** Money that already went out for the dominant reason — NOT a projected saving. */
  valueAtStake: number;
}

export interface ReturnFixesData {
  summary: {
    returnsWithReason: number;
    refundValue: number;
    fixableValue: number;
    fixableSharePct: number;
    productsCounted: number;
    allRefundLines: number;
    reasonCoveragePct: number;
  };
  reasonMix: ReturnReasonMix[];
  products: ReturnFixProduct[];
}


/** Size-curve buy plan (backend SPEC-210 / frontend SPEC-211). */
export interface BuyPlanCurveSize {
  size: string;
  unitsSold: number;
  onHand: number;
  sharePct: number;
  sellThroughPct: number;
  /** Sell-through >= 90%: the size ran out, so its true demand is understated. */
  constrained: boolean;
}

export interface BuyPlanSplit {
  size: string;
  units: number;
  constrained: boolean;
}

export interface BuyPlanProduct {
  productId: number;
  title: string;
  category: string;
  unitsSold: number;
  onHand: number;
  revenue: number;
  daysOfCover: number;
  suggestedUnits: number;
  split: BuyPlanSplit[];
  splitBasis: string;
}

export interface BuyPlanData {
  summary: {
    productsToReorder: number;
    unitsSuggested: number;
    revenueAtRisk: number;
    coverDaysTarget: number;
    categoriesWithCurve: number;
  };
  curves: { category: string; sizes: BuyPlanCurveSize[] }[];
  products: BuyPlanProduct[];
}


/** Product content gaps (backend SPEC-212 / frontend SPEC-213). */
export interface ContentGapProduct {
  productId: number;
  title: string;
  category: string;
  imageCount: number;
  unitsSold: number;
  revenue: number;
  /** Null when there are no images to divide by. */
  revenuePerImage: number | null;
  gap: string;
}

export interface ContentGapsData {
  summary: {
    productsFlagged: number;
    revenueBehindThem: number;
    byGap: { gap: string; products: number }[];
    productsSelling: number;
  };
  products: ContentGapProduct[];
}


/** Margin-ranked bundle candidates (backend SPEC-215 / frontend SPEC-191). */
export interface BundleCandidate {
  productA: number;
  productB: number;
  titleA: string;
  titleB: string;
  ordersTogether: number;
  /** Against the RARER product's order count. Null when neither ever sold alone. */
  attachRatePct: number | null;
  marginA: number;
  marginB: number;
  marginPerBundle: number;
  /** Margin already moving through this pair — not a forecast. */
  marginFlowing: number;
}

export interface BundlesData {
  summary: {
    pairsConsidered: number;
    pairsRanked: number;
    pairsWithoutCost: number;
    marginFlowingTop: number;
    topPairByMargin: number | null;
    topPairByFrequencyMargin: number | null;
  };
  bundles: BundleCandidate[];
}


/** New-drop launch watch (backend SPEC-216 / frontend SPEC-192). */
export interface LaunchDrop {
  productId: number;
  title: string;
  category: string;
  firstSoldAt: string;
  ageDays: number;
  unitsTotal: number;
  revenueTotal: number;
  onHand: number;
  /** Null until the drop has lived through a milestone. */
  milestoneDays: number | null;
  unitsAtMilestone: number | null;
  benchmarkUnits: number | null;
  paceRatio: number | null;
  daysOfCover: number | null;
  verdict: string;
  verdictTone: "good" | "warn" | "muted";
}

export interface LaunchWatchData {
  summary: {
    dropsWatched: number;
    atOrAboveWinnerPace: number;
    benchmarkCohort: number;
    watchDays: number;
    urgentReorders: number;
  };
  benchmark: {
    d7: number | null;
    d14: number | null;
    d30: number | null;
    basis: string;
  };
  drops: LaunchDrop[];
}
