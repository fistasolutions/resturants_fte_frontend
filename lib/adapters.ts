/**
 * Backend JSON → view-model adapters (SPEC-017). Pure and unit-tested.
 * Mapping limitations (previous-series overlay, customer KPI deltas,
 * incoming stock) are documented in the spec — values are never invented.
 */
import type { ApiCompareMeta } from "@/lib/calendar-note";
import type {
  AlertsSummary,
  ChannelShare,
  Kpi,
  RevenuePoint,
  ReturnsSpikeItem,
  TopProduct,
} from "@/types/analytics";
import type {
  AccountabilityData,
  AdChannel,
  AdCreative,
  AdKpi,
  ActivityItem as AdsActivityItem,
  BudgetSummary,
  Campaign,
  CampaignsData,
  CreativeData,
  GuardrailEvent,
  NextCampaign,
  OverviewData as AdsOverviewData,
  SpendGate,
  SpendGatesData,
} from "@/types/ads";
import type { CustomerHealthData, CustomerSegmentsData, RepeatClockData } from "@/types/customers";
import type { NetSales, WhatChanged } from "@/types/dashboard";
import type {
  BundlesData,
  LaunchWatchData,
  BuyPlanData,
  CannibalisationData,
  DiscountDecisionsData,
  ContentGapsData,
  ReturnFixesData,
  BrandVerdictsData,
  TrueProfitData,
} from "@/types/analysis";
import type {
  ClarityBlogEngagement,
  ClarityBrokeYesterday,
  ClarityCampaigns,
  ClarityFriction,
  ClarityFrictionDetail,
  ClarityFrictionPage,
  ClarityLinks,
  ClarityStatus,
} from "@/types/clarity";
import type { OrderDetail, OrderStatus, RecentOrder } from "@/types/orders";
import type {
  ManagerAccountability,
  OutcomeEntry,
  OutcomeLink,
  OutcomeOwner,
  OutcomeVerdict,
  ReportCard,
  ReportCardSendEntry,
  ReportCardSendResult,
  ResultsData,
  ValueLedger,
} from "@/types/results";
import type {
  ActivityItem,
  ActivityKind,
  BlogDraft,
  BlogDraftGrounding,
  BlogDraftStatus,
  BeatBrief,
  BlogSource,
  BrandBrainData,
  CritiqueRound,
  DailyPick,
  DailyPicksHistoryEntry,
  DailyPicksSnapshot,
  Fact,
  FaqItem,
  GoogleProperties,
  GoogleStatus,
  IndexState,
  IntentTemplate,
  JourneyCoverage,
  JsonLdObject,
  NextAction,
  OverviewData,
  Persona,
  PipelineStage,
  PipelineStatus,
  PostIndexStatus,
  PostReach,
  ProvenanceSource,
  PublishedPost,
  ReachQuery,
  SpotlightKpi,
  SpotlightQuery,
  StrikingDistanceData,
  TocItem,
  VisibilityData,
} from "@/types/spotlight";
import { formatCurrency, formatNumber } from "@/utils/format";

// ── backend payload shapes (snake_case) ──────────────────────────────────────

export interface ApiListEnvelope<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface ApiOrder {
  id: number;
  name: string;
  customer_name: string | null;
  total_price: number;
  currency: string;
  financial_status: string;
  fulfillment_status: string | null;
  source_name?: string | null;
  items_count?: number;
  created_at: string;
  /** POS location (backend SPEC-032); null/absent = online order. */
  location_id?: number | null;
  location?: string | null;
}

export interface ApiCustomerSummary {
  active: number;
  new: number;
  returning: number;
  returning_rate_pct: number;
}

export interface ApiDashboard {
  period: {
    key: string;
    start: string;
    end: string;
    /** Explicit comparison window in range mode (backend SPEC-031). */
    compare?: ApiCompareMeta | null;
  };
  kpis: {
    gross_revenue: number;
    net_revenue: number;
    orders: number;
    aov: number;
    refunds_total: number;
    /** Sales waterfall — served since backend SPEC-201; absent on older backends. */
    gross_sales?: number;
    discounts_total?: number;
    returns_total?: number;
    net_sales?: number;
    customers: ApiCustomerSummary;
    /** Null with compare=none (backend SPEC-031). */
    customers_previous?: ApiCustomerSummary | null;
    change_pct: {
      gross_revenue: number | null;
      /** Served since backend SPEC-031; optional for older backends. */
      net_revenue?: number | null;
      orders: number | null;
      aov: number | null;
      /** Real customer deltas since backend SPEC-031 (SPEC-017 limitation lifted). */
      new_customers?: number | null;
      /** Percentage-POINT delta of the returning rate. */
      returning_rate_pct?: number | null;
    };
  };
  revenue_series: { date: string; revenue: number; orders: number }[];
  revenue_series_previous: { date: string; revenue: number; orders: number }[];
  channels: { channel: string; revenue: number; orders: number }[];
  top_products: {
    product_id: number;
    title: string;
    units: number;
    revenue: number;
    image_url: string | null;
  }[];
  inventory_alerts: { available: number }[];
  /** True store-wide counts (backend SPEC-014 §3); optional for older backends. */
  inventory_counts?: { low_stock: number; out_of_stock: number };
  /** Products marked down ≥30% (backend SPEC-020); optional for older backends. */
  high_discount?: { products: number; min_markdown_pct: number };
  refunds: { count: number; total: number; pct_of_revenue: number };
  recent_orders: ApiOrder[];
  /** Dollar value of inventory about to run out (backend SPEC-039). */
  low_stock_revenue_at_risk?: number;
  /** Dead stock aggregate (backend SPEC-039). */
  dead_stock?: { products: number; units: number; stock_value: number };
  /** Returns spike signal (backend SPEC-039; product_id added SPEC-053, optional
   * for older backends). */
  returns_spike?: { product: string | null; product_id?: number | null; rate_pct: number | null };
  /** Unfulfilled >48h aggregate + cross-page send status (backend perf/UX
   * fix): `sent`/`sent_at` reflect the SAME `BriefAction` row the Morning
   * Brief and Overdue-review pages write on send, so this is never its own,
   * independently-tracked "done" state. */
  unfulfilled_alert?: {
    value: number;
    count: number;
    sent: boolean;
    sent_at: string | null;
  };
}

// ── shared helpers ────────────────────────────────────────────────────────────

export function toOrderStatus(financialStatus: string): OrderStatus {
  if (financialStatus === "paid") return "paid";
  if (financialStatus === "refunded" || financialStatus === "partially_refunded") {
    return "refunded";
  }
  return "pending";
}

const WEEKDAY = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" });
const MONTH_DAY = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});
const HOUR = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  timeZone: "UTC",
});

// ── adapters ──────────────────────────────────────────────────────────────────

export function adaptRecentOrder(order: ApiOrder): RecentOrder {
  return {
    id: String(order.id),
    number: order.name,
    customerName: order.customer_name ?? "Guest",
    total: order.total_price,
    status: toOrderStatus(order.financial_status),
    createdAt: order.created_at,
  };
}

/**
 * The net-sales waterfall (backend SPEC-201). Returns null when the backend does not
 * serve it, so an older API degrades to the previous dashboard instead of four zeros.
 * No arithmetic here — the backend computes every figure (root Rule 8).
 */
export function adaptNetSales(kpis: ApiDashboard["kpis"]): NetSales | null {
  if (kpis.gross_sales === undefined || kpis.net_sales === undefined) return null;
  return {
    grossSales: kpis.gross_sales,
    discounts: kpis.discounts_total ?? 0,
    returns: kpis.returns_total ?? 0,
    netSales: kpis.net_sales,
  };
}

export function adaptDashboardKpis(kpis: ApiDashboard["kpis"]): Kpi[] {
  return [
    {
      id: "revenue",
      label: "Revenue",
      value: kpis.gross_revenue,
      changePercent: kpis.change_pct.gross_revenue,
      format: "currency",
    },
    {
      id: "orders",
      label: "Orders",
      value: kpis.orders,
      changePercent: kpis.change_pct.orders,
      format: "number",
    },
    {
      id: "aov",
      label: "Avg. order value",
      value: kpis.aov,
      changePercent: kpis.change_pct.aov,
      format: "currency",
    },
    {
      id: "returning_customer_rate",
      label: "Returning customers",
      value: kpis.customers.returning_rate_pct,
      // Percentage-point delta, real since backend SPEC-031; null (not a
      // fake 0) for older backends or comparison off.
      changePercent: kpis.change_pct.returning_rate_pct ?? null,
      format: "percent",
    },
    {
      id: "new_customers",
      label: "New customers",
      value: kpis.customers.new,
      changePercent: kpis.change_pct.new_customers ?? null,
      format: "number",
    },
  ];
}

export function adaptRevenueSeries(
  series: ApiDashboard["revenue_series"],
  previous: ApiDashboard["revenue_series_previous"] = [],
): RevenuePoint[] {
  // Windows are the same length; the overlay pairs points by position
  // (Mon↔Mon for the weekly view, hour↔hour for single days). Hourly points
  // (backend SPEC-031 Patches) carry a full ISO timestamp; daily points a
  // bare date. Weekday labels only make sense up to a week of days.
  const hourly = series.length > 0 && series[0].date.includes("T");
  const byWeekday = series.length <= 7;
  return series.map((point, index) => {
    const date = hourly
      ? new Date(point.date)
      : new Date(`${point.date}T00:00:00Z`);
    return {
      day: hourly
        ? HOUR.format(date)
        : byWeekday
          ? WEEKDAY.format(date)
          : MONTH_DAY.format(date),
      date: point.date,
      current: point.revenue,
      previous: previous[index]?.revenue ?? 0,
    };
  });
}

export function adaptChannels(channels: ApiDashboard["channels"]): ChannelShare[] {
  const total = channels.reduce((sum, channel) => sum + channel.revenue, 0);
  return channels.map((channel) => ({
    channel: channel.channel,
    share: total > 0 ? channel.revenue / total : 0,
  }));
}

export function adaptTopProducts(
  products: ApiDashboard["top_products"],
): TopProduct[] {
  return products.map((product) => ({
    id: String(product.product_id),
    name: product.title,
    revenue: product.revenue,
    orders: product.units,
    imageUrl: product.image_url,
  }));
}

export function adaptAlerts(dashboard: ApiDashboard): AlertsSummary {
  // Prefer the backend's store-wide counts (SPEC-021: oversold variants are
  // out-of-stock, and counts are not capped by the 20-row alert list); fall
  // back to counting the list when talking to an older backend.
  const alerts = dashboard.inventory_alerts;
  const counts = dashboard.inventory_counts;
  return {
    lowStockVariants:
      counts?.low_stock ?? alerts.filter((alert) => alert.available > 0).length,
    outOfStockVariants:
      counts?.out_of_stock ?? alerts.filter((alert) => alert.available <= 0).length,
    // Live since backend SPEC-020 (products ≥30% off vs compare-at price);
    // ?? 0 keeps older backends rendering (frontend SPEC-029).
    highDiscountProducts: dashboard.high_discount?.products ?? 0,
    refundsAmount: dashboard.refunds.total,
    refundsCount: dashboard.refunds.count,
    // SPEC-044 enriched alert signals (backend SPEC-039); safe fallbacks for
    // older backends that haven't deployed the new fields yet.
    lowStockRevenueAtRisk: dashboard.low_stock_revenue_at_risk ?? 0,
    deadStockProducts: dashboard.dead_stock?.products ?? 0,
    deadStockValue: dashboard.dead_stock?.stock_value ?? 0,
    returnsSpikeProduct: dashboard.returns_spike?.product ?? null,
    returnsSpikeProductId: dashboard.returns_spike?.product_id ?? null,
    returnsSpikeRate: dashboard.returns_spike?.rate_pct ?? null,
    unfulfilledValue: dashboard.unfulfilled_alert?.value ?? 0,
    unfulfilledCount: dashboard.unfulfilled_alert?.count ?? 0,
    unfulfilledSent: dashboard.unfulfilled_alert?.sent ?? false,
    unfulfilledSentAt: dashboard.unfulfilled_alert?.sent_at ?? null,
  };
}

// ── returns-spike top styles (SPEC-070, backend SPEC-054) ────────────────────

export interface RawReturnsSpikeItem {
  product: string;
  product_id: number;
  rate_pct: number;
  order_id: number | null;
}

export function adaptReturnsSpikeTop(raw: RawReturnsSpikeItem[]): ReturnsSpikeItem[] {
  return raw.map((item) => ({
    product: item.product,
    productId: item.product_id,
    ratePct: item.rate_pct,
    orderId: item.order_id,
  }));
}

// ── order detail (SPEC-061, backend SPEC-055) ────────────────────────────────

export interface ApiOrderDetail {
  id: number;
  name: string;
  financial_status: string;
  fulfillment_status: string | null;
  currency: string;
  subtotal_price: number;
  total_discounts: number;
  total_tax: number;
  total_price: number;
  source_name: string | null;
  location_id: number | null;
  location_name: string | null;
  created_at: string;
  updated_at: string;
  processed_at: string | null;
  cancelled_at: string | null;
  closed_at: string | null;
  customer: {
    name: string | null;
    email: string | null;
    orders_count: number;
    total_spent: number;
  } | null;
  line_items: {
    id: number;
    product_id: number | null;
    variant_id: number | null;
    title: string;
    variant_title: string | null;
    sku: string | null;
    quantity: number;
    price: number;
    total_discount: number;
    image_url: string | null;
  }[];
  discount_codes: { code: string; amount: number | null; value_type: string | null }[];
  refunds: { id: number; note: string | null; total_refunded: number; created_at: string }[];
}

export function adaptOrderDetail(raw: ApiOrderDetail): OrderDetail {
  return {
    id: raw.id,
    name: raw.name,
    financialStatus: raw.financial_status,
    fulfillmentStatus: raw.fulfillment_status,
    currency: raw.currency,
    subtotalPrice: raw.subtotal_price,
    totalDiscounts: raw.total_discounts,
    totalTax: raw.total_tax,
    totalPrice: raw.total_price,
    sourceName: raw.source_name,
    locationId: raw.location_id,
    locationName: raw.location_name,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    processedAt: raw.processed_at,
    cancelledAt: raw.cancelled_at,
    closedAt: raw.closed_at,
    customer: raw.customer && {
      name: raw.customer.name,
      email: raw.customer.email,
      ordersCount: raw.customer.orders_count,
      totalSpent: raw.customer.total_spent,
    },
    lineItems: raw.line_items.map((item) => ({
      id: item.id,
      productId: item.product_id,
      variantId: item.variant_id,
      title: item.title,
      variantTitle: item.variant_title,
      sku: item.sku,
      quantity: item.quantity,
      price: item.price,
      totalDiscount: item.total_discount,
      imageUrl: item.image_url,
    })),
    discountCodes: raw.discount_codes.map((dc) => ({
      code: dc.code,
      amount: dc.amount,
      valueType: dc.value_type,
    })),
    refunds: raw.refunds.map((r) => ({
      id: r.id,
      note: r.note,
      totalRefunded: r.total_refunded,
      createdAt: r.created_at,
    })),
  };
}

// ── results / decision outcomes (SPEC-067, backend SPEC-063) ────────────────

export interface ApiOutcomeOwner {
  role: "location" | "warehouse" | "support" | "returns";
  location_id: number | null;
  location_name: string | null;
}

export interface ApiOutcomeEntry {
  headline: string;
  meta: string;
  sent_at: string;
  verdict: OutcomeVerdict;
  detail: string;
  link: OutcomeLink;
  owner?: ApiOutcomeOwner | null;
  responded_hours?: number | null;
}

export interface ApiResults {
  overdue: ApiOutcomeEntry[];
  transfers: ApiOutcomeEntry[];
  winback: ApiOutcomeEntry[];
  dead_inventory: ApiOutcomeEntry[];
  orders: ApiOutcomeEntry[];
  store_traffic: ApiOutcomeEntry[];
  discount_review: ApiOutcomeEntry[];
  warehouse: ApiOutcomeEntry[];
  support: ApiOutcomeEntry[];
  returns: ApiOutcomeEntry[];
}

function adaptOutcomeOwner(owner: ApiOutcomeOwner | null | undefined): OutcomeOwner | null {
  if (!owner) return null;
  return { role: owner.role, locationId: owner.location_id, locationName: owner.location_name };
}

function adaptOutcomeEntry(e: ApiOutcomeEntry): OutcomeEntry {
  return {
    headline: e.headline,
    meta: e.meta,
    sentAt: e.sent_at,
    verdict: e.verdict,
    detail: e.detail,
    link: e.link,
    owner: adaptOutcomeOwner(e.owner),
    respondedHours: e.responded_hours ?? null,
  };
}

function adaptOutcomeEntries(entries: ApiOutcomeEntry[]): OutcomeEntry[] {
  return entries.map(adaptOutcomeEntry);
}

// ── manager accountability (SPEC-241, backend SPEC-248) ─────────────────────

export interface ApiManagerRow {
  key: string;
  email: string | null;
  name: string;
  roles: ApiOutcomeOwner[];
  nudges: number;
  worked: number;
  none: number;
  early: number;
  act_rate: number | null;
  median_responded_hours: number | null;
  last_nudge_at: string | null;
  days_since_last: number | null;
  by_category: Record<string, number>;
  latest: (ApiOutcomeEntry & { category: string })[];
  settings_href: string;
}

export interface ApiManagerAccountability {
  generated_at: string;
  summary: {
    managers: number;
    with_email: number;
    never_nudged: number;
    nudges: number;
    worked: number;
    none: number;
    early: number;
  };
  managers: ApiManagerRow[];
}

export function adaptManagers(raw: ApiManagerAccountability): ManagerAccountability {
  return {
    generatedAt: raw.generated_at,
    summary: {
      managers: raw.summary.managers,
      withEmail: raw.summary.with_email,
      neverNudged: raw.summary.never_nudged,
      nudges: raw.summary.nudges,
      worked: raw.summary.worked,
      none: raw.summary.none,
      early: raw.summary.early,
    },
    managers: raw.managers.map((m) => ({
      key: m.key,
      email: m.email,
      name: m.name,
      roles: m.roles.map((r) => adaptOutcomeOwner(r)).filter((r): r is OutcomeOwner => r !== null),
      nudges: m.nudges,
      worked: m.worked,
      none: m.none,
      early: m.early,
      actRate: m.act_rate,
      medianRespondedHours: m.median_responded_hours,
      lastNudgeAt: m.last_nudge_at,
      daysSinceLast: m.days_since_last,
      byCategory: m.by_category,
      latest: m.latest.map((e) => ({ ...adaptOutcomeEntry(e), category: e.category })),
      settingsHref: m.settings_href,
    })),
  };
}

export interface ApiReportCard {
  location: { id: number; name: string; manager_email: string | null };
  week: { start: string; end: string };
  scoreboard: {
    health: number | null;
    health_prev: number | null;
    net_margin_pct: number | null;
    conversion_pct: number | null;
    discount_rate_pct: number | null;
    discount_discipline: string | null;
    return_rate_pct: number | null;
    fulfill_days: number | null;
    rank: number | null;
    of: number;
  };
  nudges: (ApiOutcomeEntry & { category: string })[];
  open_now: { unfulfilled_48h: number; unfulfilled_48h_value: number };
  subject: string;
  text: string;
  html: string;
}

export function adaptReportCard(raw: ApiReportCard): ReportCard {
  const sb = raw.scoreboard;
  return {
    location: {
      id: raw.location.id,
      name: raw.location.name,
      managerEmail: raw.location.manager_email,
    },
    week: raw.week,
    scoreboard: {
      health: sb.health,
      healthPrev: sb.health_prev,
      netMarginPct: sb.net_margin_pct,
      conversionPct: sb.conversion_pct,
      discountRatePct: sb.discount_rate_pct,
      discountDiscipline: sb.discount_discipline,
      returnRatePct: sb.return_rate_pct,
      fulfillDays: sb.fulfill_days,
      rank: sb.rank,
      of: sb.of,
    },
    nudges: raw.nudges.map((e) => ({ ...adaptOutcomeEntry(e), category: e.category })),
    openNow: {
      unfulfilled48h: raw.open_now.unfulfilled_48h,
      unfulfilled48hValue: raw.open_now.unfulfilled_48h_value,
    },
    subject: raw.subject,
    text: raw.text,
  };
}

export interface ApiReportCardSendEntry {
  location_id: number;
  location_name: string;
  recipient?: string;
  reason?: string;
}

export interface ApiReportCardSendResult {
  sent: ApiReportCardSendEntry[];
  skipped: ApiReportCardSendEntry[];
  failed: ApiReportCardSendEntry[];
}

export function adaptReportCardSend(raw: ApiReportCardSendResult): ReportCardSendResult {
  const entry = (e: ApiReportCardSendEntry): ReportCardSendEntry => ({
    locationId: e.location_id,
    locationName: e.location_name,
    recipient: e.recipient,
    reason: e.reason,
  });
  return { sent: raw.sent.map(entry), skipped: raw.skipped.map(entry), failed: raw.failed.map(entry) };
}

export function adaptResults(raw: ApiResults): ResultsData {
  return {
    overdue: adaptOutcomeEntries(raw.overdue),
    transfers: adaptOutcomeEntries(raw.transfers),
    winback: adaptOutcomeEntries(raw.winback),
    deadInventory: adaptOutcomeEntries(raw.dead_inventory),
    orders: adaptOutcomeEntries(raw.orders),
    storeTraffic: adaptOutcomeEntries(raw.store_traffic),
    discountReview: adaptOutcomeEntries(raw.discount_review),
    warehouse: adaptOutcomeEntries(raw.warehouse),
    support: adaptOutcomeEntries(raw.support),
    returns: adaptOutcomeEntries(raw.returns),
  };
}

// ── Spotlight Brand Brain (SPEC-108) ─────────────────────────────────────────

export interface ApiBrandBrainFact {
  /** Row id (SPEC-111) — null/absent for measured facts (never stored). */
  id?: number | null;
  /** Section group (SPEC-111): identity | voice | guardrail | proof_point. */
  section?: string;
  label: string;
  value: string;
  provenance: string;
  source_note: string | null;
  confirmed_at: string | null;
  /** SPEC-263 */
  status?: string;
  enabled?: boolean;
  source_id?: number | null;
  source_locator?: string | null;
}

export interface ApiBrandPersona {
  /** Row id (SPEC-111) — the CRUD target. */
  id?: number | null;
  name: string;
  role: string;
  description: string;
  tags: string[];
  provenance: string;
  /** SPEC-263 */
  confirmed_at?: string | null;
  /** SPEC-267 — the Knowledge Base item it was read from. */
  source_id?: number | null;
}

export interface ApiBrandBrain {
  confirmed_at: string;
  identity: ApiBrandBrainFact[];
  voice: { tone: ApiBrandBrainFact | null; avoid: ApiBrandBrainFact | null };
  personas: ApiBrandPersona[];
  guardrails: ApiBrandBrainFact[];
  proof_points: ApiBrandBrainFact[];
  intent_templates?: ApiIntentTemplate[];
}

export interface ApiIntentTemplate {
  id: number;
  template: string;
  intent: string;
  persona: string;
  provenance: string;
  sort: number;
}

export function adaptIntentTemplate(raw: ApiIntentTemplate): IntentTemplate {
  return {
    id: raw.id,
    template: raw.template,
    intent: raw.intent,
    persona: raw.persona,
    provenance: raw.provenance,
    sort: raw.sort,
  };
}

/** Backend provenance → the UI's ProvenanceSource chip. The owner-authored
 * layer maps to the "onboarding" chip; the rest pass through by name. */
function brandBrainSource(provenance: string): ProvenanceSource {
  switch (provenance) {
    case "owner":
      return "onboarding";
    case "measured":
      return "measured";
    case "research":
      return "research";
    case "file":
      return "file";
    default:
      return "manual";
  }
}

const FACT_SECTIONS = [
  "identity",
  "voice",
  "guardrail",
  "proof_point",
  "product",
  "policy",
  "calendar",
  "competitor",
  "market",
] as const;

const FACT_STATUSES = ["approved", "pending", "rejected", "conflict"] as const;

function normalizeStatus(status?: string): Fact["status"] {
  return FACT_STATUSES.includes(status as (typeof FACT_STATUSES)[number])
    ? (status as Fact["status"])
    : "approved";
}

function normalizeSection(section?: string): Fact["section"] {
  return FACT_SECTIONS.includes(section as (typeof FACT_SECTIONS)[number])
    ? (section as Fact["section"])
    : undefined;
}

export function adaptBrandFact(fact: ApiBrandBrainFact): Fact {
  return {
    id: fact.id ?? null,
    section: normalizeSection(fact.section),
    label: fact.label,
    value: fact.value,
    source: brandBrainSource(fact.provenance),
    sourceNote: fact.source_note,
    confirmedAt: fact.confirmed_at,
    status: normalizeStatus(fact.status),
    enabled: fact.enabled ?? true,
    sourceId: fact.source_id ?? null,
    sourceLocator: fact.source_locator ?? null,
  };
}

function slugifyPersona(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function adaptBrandPersona(persona: ApiBrandPersona): Persona {
  return {
    id: slugifyPersona(persona.name),
    dbId: persona.id ?? null,
    name: persona.name,
    tagline: persona.role,
    description: persona.description,
    traits: persona.tags ?? [],
    source: brandBrainSource(persona.provenance),
    confirmedAt: persona.confirmed_at ?? null,
    sourceId: persona.source_id ?? null,
    // No per-persona revenue share from the backend — omitted, never invented.
  };
}

export function adaptBrandBrain(raw: ApiBrandBrain): BrandBrainData {
  return {
    lastConfirmed: raw.confirmed_at,
    identity: raw.identity.map(adaptBrandFact),
    voice: {
      tone: raw.voice?.tone ? adaptBrandFact(raw.voice.tone) : null,
      avoid: raw.voice?.avoid ? adaptBrandFact(raw.voice.avoid) : null,
    },
    guardrails: raw.guardrails.map(adaptBrandFact),
    personas: raw.personas.map(adaptBrandPersona),
    proofPoints: raw.proof_points.map(adaptBrandFact),
    intentTemplates: (raw.intent_templates ?? []).map(adaptIntentTemplate),
  };
}

// ── Spotlight Inbound Engine + blog drafts (backend SPEC-109) ────────────────
// Pure + client-safe (types only), so the "use client" mutation service can
// reuse `adaptBlogDraft` on the proxy response.

export interface ApiSpotlightQuery {
  id: number;
  keyword: string;
  monthly_volume: number | null;
  persona: string;
  intent: string;
  source: string;
  /** The topic this query belongs to (backend SPEC-125); null = ungrouped. */
  cluster?: string | null;
  /** The real category behind a discovered keyword (backend SPEC-163). Absent on
   * rows written before that change. */
  parent_category?: string | null;
}

/** Grounding is stored with mixed casing on the backend: `personaId`/`povPillar`
 * are already camelCase, `guardrails_ok` and `products[].product_id` are snake. */
export interface ApiBlogDraftGrounding {
  personaId?: string | null;
  povPillar?: string | null;
  guardrails_ok?: boolean;
  products?: {
    product_id: number;
    title: string;
    handle?: string | null;
    image_url?: string | null;
    url?: string | null;
  }[];
}

/** One round of the SPEC-121 critic scorecard. `scores`/`notes` are keyed by the
 * four dimensions; `min`/`overall`/`feedback` are optional so a leaner payload
 * still maps. */
export interface ApiCritiqueRound {
  round: number;
  scores?: { seo?: number; aeo?: number; geo?: number; quality?: number };
  min?: number;
  overall?: number;
  notes?: { seo?: string; aeo?: string; geo?: string; quality?: string };
  feedback?: string;
  is_final?: boolean;
}

export interface ApiBlogDraft {
  id: number;
  title: string;
  handle: string;
  meta_description: string;
  target_keyword: string;
  persona: string;
  pov_pillar: string;
  seo_score: number;
  /** Quality-harness scores (backend SPEC-121): null for pre-harness drafts,
   * absent on older backends. `harness_rounds` defaults to 1. */
  aeo_score?: number | null;
  geo_score?: number | null;
  quality_score?: number | null;
  harness_rounds?: number;
  /** Detail-read only: the per-round critique and the researched source URLs
   * (backend serves bare strings). */
  critique?: ApiCritiqueRound[];
  sources?: (string | { url?: string | null })[];
  /** Backend SPEC-286 — the page-one brief the draft was written to beat; null or
   * absent when none was read. */
  beat?: ApiBeatBrief | null;
  word_count: number;
  status: string;
  /** The effective brief/instruction for this draft (backend SPEC-113). */
  prompt?: string | null;
  created_at: string | null;
  updated_at: string | null;
  /** Publish state (backend SPEC-118): present on publish/unpublish/delete and
   * published-list reads; absent on plain draft reads. */
  live_url?: string | null;
  published_at?: string | null;
  live?: boolean;
  // Present only on the detail / generate / status-transition reads.
  body_md?: string;
  grounding?: ApiBlogDraftGrounding;
  agent_trace?: string[];
  sections?: string[];
  /** Rich-blog derivations (backend SPEC-124) — detail read only. */
  faq?: { q: string; a: string }[];
  toc?: { id: string; text: string }[];
  json_ld?: Record<string, unknown>[];
}

export function adaptSpotlightQuery(raw: ApiSpotlightQuery): SpotlightQuery {
  return {
    id: raw.id,
    keyword: raw.keyword,
    monthlyVolume: raw.monthly_volume ?? null,
    persona: raw.persona,
    intent: raw.intent,
    source: raw.source,
    cluster: raw.cluster ?? null,
    parentCategory: raw.parent_category ?? null,
  };
}

/* ── Daily Picks (backend SPEC-155) ───────────────────────────────────────── */

export interface ApiDailyPick {
  cluster: string;
  keyword: string;
  intent: string;
  persona: string;
  title: string;
  angle: string;
  fills: string;
  rationale: string;
  featured_product_ids: number[];
  score: number;
  score_parts: {
    fit?: number;
    demand: number;
    margin: number;
    catalog: number;
    brand_fit: number;
    /** Multipliers, optional: absent on snapshots frozen before backend
     * SPEC-159/161. Both default to 1 (neutral) when missing. */
    freshness?: number;
    performance?: number;
    /** Backend SPEC-264 — present only when measured. */
    striking?: number;
  };
  /** Absent on snapshots frozen before backend SPEC-159 — defaults to "derived". */
  source?: string;
  /** Backend SPEC-286 — the competitor's domain behind a `competitor_gap` pick. */
  source_ref?: string | null;
  /** Backend SPEC-264; absent on older snapshots. */
  striking?: {
    query: string;
    position: number;
    impressions: number;
    potential_clicks: number;
    matched_queries: number;
  } | null;
  /** Attached at read time (backend SPEC-155); absent on the frozen snapshot. */
  draft_id?: number | null;
  draft_status?: string | null;
}

export interface ApiDailyPicksSnapshot {
  pick_date: string;
  generated_at: string | null;
  source: string;
  picks: ApiDailyPick[];
}

export interface ApiDailyPicksHistoryEntry {
  pick_date: string;
  generated_at: string | null;
}

function adaptDailyPick(raw: ApiDailyPick): DailyPick {
  return {
    cluster: raw.cluster,
    keyword: raw.keyword,
    intent: raw.intent,
    persona: raw.persona,
    title: raw.title,
    angle: raw.angle,
    fills: raw.fills,
    rationale: raw.rationale,
    featuredProductIds: raw.featured_product_ids ?? [],
    score: raw.score,
    scoreParts: {
      ...(typeof raw.score_parts?.fit === "number" ? { fit: raw.score_parts.fit } : {}),
      demand: raw.score_parts?.demand ?? 0,
      margin: raw.score_parts?.margin ?? 0,
      catalog: raw.score_parts?.catalog ?? 0,
      brandFit: raw.score_parts?.brand_fit ?? 0,
      // Multipliers default to 1 (neutral), NOT 0 — a missing multiplier means
      // "no effect", and defaulting to 0 would zero out every historical pick.
      freshness: raw.score_parts?.freshness ?? 1,
      performance: raw.score_parts?.performance ?? 1,
      // Deliberately NOT defaulted: absent means "unmeasured", and only a measured
      // part may draw a bar (SPEC-265).
      ...(typeof raw.score_parts?.striking === "number"
        ? { striking: raw.score_parts.striking }
        : {}),
    },
    source: raw.source ?? "derived",
    sourceRef: raw.source_ref ?? null,
    draftId: raw.draft_id ?? null,
    draftStatus: raw.draft_status ?? null,
    striking: raw.striking
      ? {
          query: raw.striking.query,
          position: raw.striking.position,
          impressions: raw.striking.impressions,
          potentialClicks: raw.striking.potential_clicks,
          matchedQueries: raw.striking.matched_queries,
        }
      : null,
  };
}

// ── Striking distance (backend SPEC-264) ────────────────────────────────────

export interface ApiStrikingOpportunity {
  query: string;
  position: number;
  impressions: number;
  clicks: number;
  potential_clicks: number;
  cluster: string | null;
}

export interface ApiStrikingDistance {
  window_end: string | null;
  window_days: number;
  opportunities: ApiStrikingOpportunity[];
}

export function adaptStrikingDistance(raw: ApiStrikingDistance): StrikingDistanceData {
  return {
    windowEnd: raw.window_end ?? null,
    windowDays: raw.window_days ?? 28,
    opportunities: (raw.opportunities ?? []).map((row) => ({
      query: row.query,
      position: row.position,
      impressions: row.impressions,
      clicks: row.clicks ?? 0,
      potentialClicks: row.potential_clicks,
      cluster: row.cluster ?? null,
    })),
  };
}

export function adaptDailyPicksSnapshot(
  raw: ApiDailyPicksSnapshot,
): DailyPicksSnapshot {
  return {
    pickDate: raw.pick_date,
    generatedAt: raw.generated_at ?? null,
    source: raw.source === "manual" ? "manual" : "scheduled",
    picks: (raw.picks ?? []).map(adaptDailyPick),
  };
}

export function adaptDailyPicksHistoryEntry(
  raw: ApiDailyPicksHistoryEntry,
): DailyPicksHistoryEntry {
  return { pickDate: raw.pick_date, generatedAt: raw.generated_at ?? null };
}

const DRAFT_STATUSES: readonly BlogDraftStatus[] = [
  "in_review",
  "approved",
  "changes_requested",
  "published",
  "unpublished",
  "draft",
];

/** Coerce the backend status string to the UI union; anything unexpected is
 * treated as still-in-review rather than silently mislabelled. */
function normalizeDraftStatus(status: string): BlogDraftStatus {
  return DRAFT_STATUSES.includes(status as BlogDraftStatus)
    ? (status as BlogDraftStatus)
    : "in_review";
}

function adaptGrounding(raw: ApiBlogDraftGrounding): BlogDraftGrounding {
  return {
    personaId: raw.personaId ?? null,
    povPillar: raw.povPillar ?? "",
    guardrailsOk: raw.guardrails_ok ?? false,
    products: (raw.products ?? []).map((p) => ({
      productId: p.product_id,
      title: p.title,
      handle: p.handle ?? null,
      imageUrl: p.image_url ?? null,
      url: p.url ?? null,
    })),
  };
}

/** Map one critic round (backend SPEC-121). Missing per-dimension entries fall
 * back to a neutral 0 / empty note so the scorecard never renders `undefined`. */
function adaptCritiqueRound(raw: ApiCritiqueRound): CritiqueRound {
  return {
    round: raw.round,
    scores: {
      seo: raw.scores?.seo ?? 0,
      aeo: raw.scores?.aeo ?? 0,
      geo: raw.scores?.geo ?? 0,
      quality: raw.scores?.quality ?? 0,
    },
    min: raw.min ?? 0,
    overall: raw.overall ?? 0,
    isFinal: raw.is_final ?? false,
    notes: {
      seo: raw.notes?.seo ?? "",
      aeo: raw.notes?.aeo ?? "",
      geo: raw.notes?.geo ?? "",
      quality: raw.notes?.quality ?? "",
    },
    feedback: raw.feedback ?? "",
  };
}

/** Map the rich-blog FAQ (backend SPEC-124). Pairs missing either side are
 * dropped (never fabricated). */
function adaptFaq(raw: ApiBlogDraft["faq"]): FaqItem[] {
  return (raw ?? [])
    .map((item) => ({ q: item?.q ?? "", a: item?.a ?? "" }))
    .filter((item) => item.q.length > 0 && item.a.length > 0);
}

/** Map the table of contents (backend SPEC-124). Entries missing an id or text
 * are dropped so a TOC link never points at a missing anchor. */
function adaptToc(raw: ApiBlogDraft["toc"]): TocItem[] {
  return (raw ?? [])
    .map((item) => ({ id: item?.id ?? "", text: item?.text ?? "" }))
    .filter((item) => item.id.length > 0 && item.text.length > 0);
}

/** Map the schema.org JSON-LD objects (backend SPEC-124), keeping only real
 * objects. The backend owns the shape; the adapter never invents one. */
function adaptJsonLd(raw: ApiBlogDraft["json_ld"]): JsonLdObject[] {
  return (raw ?? []).filter(
    (obj): obj is JsonLdObject =>
      typeof obj === "object" && obj !== null && !Array.isArray(obj),
  );
}

export interface ApiBeatBrief {
  url?: string;
  domain?: string;
  name?: string;
  title?: string;
  headings?: string[];
  word_count?: number;
  misses?: string[];
  read_at?: string | null;
}

/** The page-one brief (SPEC-292): null when the backend read nothing, and a brief
 * without a domain is treated the same — never a panel about nothing. */
export function adaptBeat(raw: ApiBeatBrief | null | undefined): BeatBrief | null {
  if (!raw || !raw.domain) return null;
  return {
    url: raw.url ?? "",
    domain: raw.domain,
    name: raw.name ?? raw.domain,
    title: raw.title ?? "",
    headings: raw.headings ?? [],
    wordCount: raw.word_count ?? 0,
    misses: raw.misses ?? [],
    readAt: raw.read_at ?? null,
  };
}

/** Map the researched-sources list. The backend serves bare URL strings; an
 * object `{ url }` is tolerated for forward-compat. Blank/urlless entries are
 * dropped (never fabricated). */
function adaptSources(raw: ApiBlogDraft["sources"]): BlogSource[] {
  return (raw ?? [])
    .map((entry) => (typeof entry === "string" ? entry : (entry?.url ?? "")))
    .filter((url): url is string => url.length > 0)
    .map((url) => ({ url }));
}

export function adaptBlogDraft(raw: ApiBlogDraft): BlogDraft {
  return {
    id: raw.id,
    title: raw.title,
    handle: raw.handle,
    metaDescription: raw.meta_description,
    targetKeyword: raw.target_keyword,
    persona: raw.persona,
    povPillar: raw.pov_pillar,
    seoScore: raw.seo_score,
    // Quality-harness scores (backend SPEC-121) — null for pre-harness drafts.
    aeoScore: raw.aeo_score ?? null,
    geoScore: raw.geo_score ?? null,
    qualityScore: raw.quality_score ?? null,
    harnessRounds: raw.harness_rounds ?? 1,
    critique: (raw.critique ?? []).map(adaptCritiqueRound),
    sources: adaptSources(raw.sources),
    beat: adaptBeat(raw.beat),
    // Rich-blog derivations (backend SPEC-124) — detail read only.
    faq: adaptFaq(raw.faq),
    toc: adaptToc(raw.toc),
    jsonLd: adaptJsonLd(raw.json_ld),
    wordCount: raw.word_count,
    status: normalizeDraftStatus(raw.status),
    prompt: raw.prompt ?? null,
    createdAt: raw.created_at ?? null,
    updatedAt: raw.updated_at ?? null,
    // Publish state (backend SPEC-118) — null/undefined until the draft goes live.
    liveUrl: raw.live_url ?? null,
    publishedAt: raw.published_at ?? null,
    live: raw.live,
    // Heavy/optional fields — mapped only when the read includes them.
    bodyMd: raw.body_md,
    grounding: raw.grounding ? adaptGrounding(raw.grounding) : undefined,
    agentTrace: raw.agent_trace,
    sections: raw.sections,
  };
}

// ── Spotlight published posts (backend SPEC-118) ─────────────────────────────
// The `GET /spotlight/published` payload: the draft record's core fields + a
// `live` reconcile flag. `seo_score`/`persona`/`image_url` are optional — the
// current backend payload omits them, so they map through only if a later
// backend adds them and are otherwise null (never fabricated; root Rule 8).

export interface ApiPublishedPost {
  id: number;
  title: string;
  handle: string;
  status: string;
  target_keyword: string;
  live_url: string | null;
  published_at: string | null;
  unpublished_at?: string | null;
  unpublished_reason?: string | null;
  /** Added by the list read's Shopify reconcile; defaults to true if absent. */
  live?: boolean;
  seo_score?: number | null;
  persona?: string | null;
  image_url?: string | null;
  /** Blog → sales attribution (backend SPEC-126); 0 when nothing attributed. */
  attributed_orders?: number;
  attributed_revenue?: number;
  first_touch_orders?: number;
  first_touch_revenue?: number;
  last_touch_orders?: number;
  last_touch_revenue?: number;
}

export function adaptPublishedPost(raw: ApiPublishedPost): PublishedPost {
  return {
    id: raw.id,
    title: raw.title,
    handle: raw.handle,
    status: normalizeDraftStatus(raw.status),
    targetKeyword: raw.target_keyword,
    liveUrl: raw.live_url ?? null,
    publishedAt: raw.published_at ?? null,
    unpublishedAt: raw.unpublished_at ?? null,
    unpublishedReason: raw.unpublished_reason ?? null,
    live: raw.live ?? true,
    seoScore: raw.seo_score ?? null,
    persona: raw.persona ?? null,
    imageUrl: raw.image_url ?? null,
    // Attribution is a real backend aggregate — default to 0, never fabricated.
    attributedOrders: raw.attributed_orders ?? 0,
    attributedRevenue: raw.attributed_revenue ?? 0,
    // Journey attribution (backend SPEC-197), same rule: absent means 0.
    firstTouchOrders: raw.first_touch_orders ?? 0,
    firstTouchRevenue: raw.first_touch_revenue ?? 0,
    lastTouchOrders: raw.last_touch_orders ?? 0,
    lastTouchRevenue: raw.last_touch_revenue ?? 0,
  };
}

export interface ApiJourneyCoverage {
  orders?: number;
  fetched?: number;
  with_journey?: number;
  ratio?: number;
}

/** Journey coverage (backend SPEC-197). Absent fields become 0 — an unknown
 * coverage is reported as unmeasured, never optimistically assumed complete. */
export function adaptJourneyCoverage(
  raw: ApiJourneyCoverage | null | undefined,
): JourneyCoverage {
  return {
    orders: raw?.orders ?? 0,
    fetched: raw?.fetched ?? 0,
    withJourney: raw?.with_journey ?? 0,
    ratio: raw?.ratio ?? 0,
  };
}

// ── Microsoft Clarity (backend SPEC-219) ─────────────────────────────────────
// The critical rule here is the `null` vs `0` distinction. Where a field means "has
// this been measured", an absent value stays **null** — rendering it as 0 would make a
// post nobody has looked at identical to a post nobody read, and those call for
// opposite reactions. Where a field is a real count, absent means 0.

const cNum = (v: unknown): number =>
  typeof v === "number" && Number.isFinite(v) ? v : 0;
const cMaybe = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null;
const cStr = (v: unknown, fallback = ""): string =>
  typeof v === "string" ? v : fallback;
const cList = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

export function adaptClarityStatus(raw: Record<string, unknown> | null): ClarityStatus {
  const sync = (raw?.sync ?? null) as Record<string, unknown> | null;
  const budget = (raw?.budget ?? null) as Record<string, unknown> | null;
  const num = (value: unknown, fallback: number): number =>
    typeof value === "number" && Number.isFinite(value) ? value : fallback;
  const numOrNull = (value: unknown): number | null =>
    typeof value === "number" && Number.isFinite(value) ? value : null;
  const strOrNull = (value: unknown): string | null =>
    typeof value === "string" ? value : null;
  const state = sync?.state;
  return {
    configured: raw?.configured === true,
    connected: raw?.connected === true,
    capturedOn: typeof raw?.captured_on === "string" ? raw.captured_on : null,
    sync:
      sync && (state === "running" || state === "success" || state === "error")
        ? {
            state,
            startedAt: strOrNull(sync.started_at),
            finishedAt: strOrNull(sync.finished_at),
            records: num(sync.records, 0),
            done: numOrNull(sync.done),
            total: numOrNull(sync.total),
            error: strOrNull(sync.error),
            reason: strOrNull(sync.reason),
          }
        : null,
    budget: {
      used: num(budget?.used, 0),
      limit: num(budget?.limit, 10),
      remaining: num(budget?.remaining, 10),
    },
    nextRunUtc: typeof raw?.next_run_utc === "string" ? raw.next_run_utc : "04:15",
  };
}

export function adaptClarityBlogEngagement(
  raw: Record<string, unknown> | null,
): ClarityBlogEngagement {
  return {
    connected: raw?.connected === true,
    capturedOn: typeof raw?.captured_on === "string" ? raw.captured_on : null,
    windowDays: cNum(raw?.window_days),
    posts: cList<Record<string, unknown>>(raw?.posts).map((p) => ({
      draftId: cNum(p.draft_id),
      title: cStr(p.title),
      handle: cStr(p.handle),
      liveUrl: typeof p.live_url === "string" ? p.live_url : null,
      wordCount: cNum(p.word_count),
      seoScore: cMaybe(p.seo_score),
      qualityScore: cMaybe(p.quality_score),
      measured: p.measured === true,
      // null, not 0 — see the note above.
      sessions: cMaybe(p.sessions),
      avgScrollDepth: cMaybe(p.avg_scroll_depth),
      avgActiveSeconds: cMaybe(p.avg_active_seconds),
      rageClicks: cMaybe(p.rage_clicks),
      deadClicks: cMaybe(p.dead_clicks),
      stopsAroundWord: cMaybe(p.stops_around_word),
    })),
  };
}

function cLinks(raw: unknown): ClarityLinks | null {
  if (!raw || typeof raw !== "object") return null;
  const l = raw as Record<string, unknown>;
  return {
    dashboard: cStr(l.dashboard),
    recordings: cStr(l.recordings),
    rageClicks: cStr(l.rage_clicks),
    deadClicks: cStr(l.dead_clicks),
    quickBacks: cStr(l.quick_backs),
    scriptErrors: cStr(l.script_errors),
    errorClicks: cStr(l.error_clicks),
  };
}

function cFrictionPage(p: Record<string, unknown>): ClarityFrictionPage {
  return {
    handle: cStr(p.handle),
    title: cStr(p.title),
    path: cStr(p.path),
    sessions: cNum(p.sessions),
    rageClicks: cNum(p.rage_clicks),
    deadClicks: cNum(p.dead_clicks),
    scriptErrors: cNum(p.script_errors),
    errorClicks: cNum(p.error_clicks),
    quickBacks: cNum(p.quick_backs),
    excessiveScroll: cNum(p.excessive_scroll),
    avgScrollDepth: cNum(p.avg_scroll_depth),
    avgActiveSeconds: cNum(p.avg_active_seconds),
    frictionEvents: cNum(p.friction_events),
    revenue90d: cNum(p.revenue_90d),
    units90d: cNum(p.units_90d),
    // Defaults FALSE: unknown margin must never look like known margin.
    marginKnown: p.margin_known === true,
    clarity: cLinks(p.clarity),
  };
}

export function adaptClarityFriction(
  raw: Record<string, unknown> | null,
): ClarityFriction {
  return {
    connected: raw?.connected === true,
    capturedOn: typeof raw?.captured_on === "string" ? raw.captured_on : null,
    windowDays: cNum(raw?.window_days),
    revenueDays: cNum(raw?.revenue_days),
    pages: cList<Record<string, unknown>>(raw?.pages).map(cFrictionPage),
  };
}

/** The Brief's "what broke yesterday" (backend SPEC-281). */
export function adaptClarityBrokeYesterday(
  raw: Record<string, unknown> | null,
): ClarityBrokeYesterday {
  return {
    connected: raw?.connected === true,
    capturedOn: typeof raw?.captured_on === "string" ? raw.captured_on : null,
    windowDays: cNum(raw?.window_days),
    revenueDays: cNum(raw?.revenue_days),
    minRevenue: cNum(raw?.min_revenue),
    pages: cList<Record<string, unknown>>(raw?.pages).map((p) => ({
      ...cFrictionPage(p),
      reason: p.reason === "new" ? "new" : "up",
      priorDailyAvg: cNum(p.prior_daily_avg),
    })),
    others: cNum(raw?.others),
    othersMaxRevenue: cNum(raw?.others_max_revenue),
    totalRevenue: cNum(raw?.total_revenue),
  };
}

/** One page's friction by day and by path (backend SPEC-278). */
export function adaptClarityFrictionDetail(
  raw: Record<string, unknown> | null,
): ClarityFrictionDetail {
  const page = raw?.page && typeof raw.page === "object" ? (raw.page as Record<string, unknown>) : {};
  return {
    connected: raw?.connected === true,
    capturedOn: typeof raw?.captured_on === "string" ? raw.captured_on : null,
    windowDays: cNum(raw?.window_days),
    revenueDays: cNum(raw?.revenue_days),
    page: cFrictionPage(page),
    days: cList<Record<string, unknown>>(raw?.days).map((d) => ({
      capturedOn: cStr(d.captured_on),
      sessions: cNum(d.sessions),
      rageClicks: cNum(d.rage_clicks),
      deadClicks: cNum(d.dead_clicks),
      scriptErrors: cNum(d.script_errors),
      errorClicks: cNum(d.error_clicks),
      quickBacks: cNum(d.quick_backs),
      excessiveScroll: cNum(d.excessive_scroll),
      avgScrollDepth: cNum(d.avg_scroll_depth),
      frictionEvents: cNum(d.friction_events),
    })),
    paths: cList<Record<string, unknown>>(raw?.paths).map((p) => ({
      path: cStr(p.path),
      sessions: cNum(p.sessions),
      frictionEvents: cNum(p.friction_events),
    })),
  };
}

export function adaptClarityCampaigns(
  raw: Record<string, unknown> | null,
): ClarityCampaigns {
  return {
    connected: raw?.connected === true,
    capturedOn: typeof raw?.captured_on === "string" ? raw.captured_on : null,
    windowDays: cNum(raw?.window_days),
    daysCaptured: cNum(raw?.days_captured),
    fromDay: typeof raw?.from_day === "string" ? raw.from_day : null,
    sources: cList<Record<string, unknown>>(raw?.sources).map((s) => ({
      source: cStr(s.source, "unknown"),
      label: cStr(s.label, cStr(s.source, "unknown")),
      rawSources: cList<unknown>(s.raw_sources).filter((r): r is string => typeof r === "string"),
      internal: s.internal === true,
      sessions: cNum(s.sessions),
      avgScrollDepth: cNum(s.avg_scroll_depth),
      avgActiveSeconds: cNum(s.avg_active_seconds),
      rageClicks: cNum(s.rage_clicks),
      quickBacks: cNum(s.quick_backs),
      attributedOrders: cNum(s.attributed_orders),
      attributedRevenue: cNum(s.attributed_revenue),
    })),
  };
}

// ── Performance Ads (backend SPEC-198) ───────────────────────────────────────
// The backend already returns camelCase matching `types/ads.ts`, so these are thin —
// but deliberately NOT pass-throughs. This is a page about money: a field the API
// omits must render as an honest 0 or [], never `undefined` or `NaN`. `utilization`
// is passed through unclamped on purpose — the backend reports overspend above 1.0
// and the UI must not hide the one number an operator most needs to see.

const num = (value: unknown): number =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;
const str = (value: unknown, fallback = ""): string =>
  typeof value === "string" ? value : fallback;
const list = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

export function adaptAdsBudget(raw: Record<string, unknown> | null): BudgetSummary {
  return {
    periodLabel: str(raw?.periodLabel, "This month"),
    totalCap: num(raw?.totalCap),
    spent: num(raw?.spent),
    remaining: num(raw?.remaining),
    utilization: num(raw?.utilization),
    liveCampaigns: num(raw?.liveCampaigns),
    pendingApprovals: num(raw?.pendingApprovals),
    // Defaults to FALSE — an unknown stop state must never render as "stopped" and
    // lull the operator into thinking spending is halted when it is not.
    killSwitchActive: raw?.killSwitchActive === true,
    monthlyCapSet: raw?.monthlyCapSet === true,
  };
}

function adaptNextCampaign(raw: Record<string, unknown> | undefined): NextCampaign {
  return {
    name: str(raw?.name, "—"),
    channel: (str(raw?.channel, "meta") as AdChannel),
    objective: str(raw?.objective, "—"),
    reason: (str(raw?.reason, "scale_winner") as NextCampaign["reason"]),
    reasonDetail: str(raw?.reasonDetail),
    projectedSpend: str(raw?.projectedSpend, "$0"),
    href: str(raw?.href, "/ads"),
  };
}

export function adaptAdsOverview(
  raw: Record<string, unknown> | null,
): AdsOverviewData {
  return {
    kpis: list<Record<string, unknown>>(raw?.kpis).map((kpi) => ({
      id: str(kpi.id),
      label: str(kpi.label),
      value: str(kpi.value, "—"),
      delta: typeof kpi.delta === "number" ? kpi.delta : undefined,
      deltaKind: kpi.deltaKind as AdKpi["deltaKind"],
      hint: typeof kpi.hint === "string" ? kpi.hint : undefined,
    })),
    blendedTrend: list<Record<string, unknown>>(raw?.blendedTrend).map((point) => ({
      label: str(point.label),
      spend: num(point.spend),
      profit: num(point.profit),
    })),
    nextCampaign: adaptNextCampaign(
      raw?.nextCampaign as Record<string, unknown> | undefined,
    ),
    activity: list<Record<string, unknown>>(raw?.activity).map((item) => ({
      id: str(item.id),
      kind: (str(item.kind, "measure") as AdsActivityItem["kind"]),
      title: str(item.title),
      detail: str(item.detail),
      timestamp: str(item.timestamp),
    })),
  };
}

export function adaptAdsCampaigns(raw: Record<string, unknown> | null): CampaignsData {
  return {
    campaigns: list<Record<string, unknown>>(raw?.campaigns).map((c) => ({
      id: str(c.id),
      name: str(c.name),
      channel: (str(c.channel, "meta") as AdChannel),
      objective: str(c.objective),
      persona: str(c.persona),
      offer: str(c.offer),
      status: (str(c.status, "draft") as Campaign["status"]),
      dailyCap: num(c.dailyCap),
      totalCap: num(c.totalCap),
      spent: num(c.spent),
      roas: num(c.roas),
      cac: num(c.cac),
      profit: num(c.profit),
      revenue: num(c.revenue),
    })),
    recommended: adaptNextCampaign(
      raw?.recommended as Record<string, unknown> | undefined,
    ),
  };
}

export function adaptAdsCreative(raw: Record<string, unknown> | null): CreativeData {
  return {
    creatives: list<Record<string, unknown>>(raw?.creatives).map((c) => ({
      id: str(c.id),
      source: (str(c.source, "social") as AdCreative["source"]),
      channel: (str(c.channel, "meta") as AdChannel),
      format: (str(c.format, "feed") as AdCreative["format"]),
      productName: str(c.productName),
      headline: str(c.headline),
      keyword: typeof c.keyword === "string" ? c.keyword : undefined,
      spent: num(c.spent),
      roas: num(c.roas),
    })),
  };
}

export function adaptAdsSpendGates(
  raw: Record<string, unknown> | null,
): SpendGatesData {
  return {
    gates: list<Record<string, unknown>>(raw?.gates).map((g) => ({
      id: str(g.id),
      action: (str(g.action, "launch_campaign") as SpendGate["action"]),
      title: str(g.title),
      channel: (str(g.channel, "meta") as AdChannel),
      rationale: str(g.rationale),
      projectedSpend: str(g.projectedSpend, "$0"),
      capContext: str(g.capContext),
      expectedProfit: str(g.expectedProfit, "$0"),
      expectedRoas: num(g.expectedRoas),
    })),
  };
}

export function adaptAdsAccountability(
  raw: Record<string, unknown> | null,
): AccountabilityData {
  return {
    // Defaults to FALSE: an unknown connection state must show the setup nudge, never
    // imply a live ad-platform integration that does not exist.
    connected: raw?.connected === true,
    ledger: list<Record<string, unknown>>(raw?.ledger).map((row) => ({
      id: str(row.id),
      date: str(row.date),
      campaign: str(row.campaign, "—"),
      channel: (str(row.channel, "meta") as AdChannel),
      amount: num(row.amount),
      attributedProfit: num(row.attributedProfit),
    })),
    capUtilization: list<Record<string, unknown>>(raw?.capUtilization).map((row) => ({
      id: str(row.id),
      campaign: str(row.campaign),
      channel: (str(row.channel, "meta") as AdChannel),
      spent: num(row.spent),
      cap: num(row.cap),
      utilization: num(row.utilization),
    })),
    guardrails: list<Record<string, unknown>>(raw?.guardrails).map((row) => ({
      id: str(row.id),
      kind: (str(row.kind, "cap_hit") as GuardrailEvent["kind"]),
      title: str(row.title),
      detail: str(row.detail),
      timestamp: str(row.timestamp),
    })),
  };
}

// ── Google Search Console connect + Spotlight visibility (backend SPEC-119) ──
// The status endpoint reports connection state + non-sensitive metadata only
// (never a token). The visibility endpoint serves per-post reach from local
// `gsc_daily`; the tab's KPI roll-ups (sum/count/weighted avg) are pure display
// aggregations of those posts — the same category as `adaptChannels` above,
// never a fabricated baseline, so they carry no deltas (root Rule 8).

export interface ApiGoogleSyncRun {
  state: "running" | "success" | "error";
  started_at: string | null;
  finished_at: string | null;
  records: number;
  done: number | null;
  total: number | null;
  error: string | null;
}

export interface ApiGoogleStatus {
  connected: boolean;
  configured: boolean;
  email: string | null;
  property_url: string | null;
  last_pull: string | null;
  /** Backend SPEC-257; optional so a pre-257 status still adapts. */
  needs_property?: boolean;
  sync?: ApiGoogleSyncRun | null;
}

export function adaptGoogleStatus(raw: ApiGoogleStatus): GoogleStatus {
  const sync = raw.sync ?? null;
  return {
    connected: raw.connected,
    configured: raw.configured,
    email: raw.email ?? null,
    propertyUrl: raw.property_url ?? null,
    lastPull: raw.last_pull ?? null,
    needsProperty: raw.needs_property ?? (raw.connected && !raw.property_url),
    sync: sync
      ? {
          state: sync.state,
          startedAt: sync.started_at ?? null,
          finishedAt: sync.finished_at ?? null,
          records: sync.records ?? 0,
          done: sync.done ?? null,
          total: sync.total ?? null,
          error: sync.error ?? null,
        }
      : null,
  };
}

export interface ApiGoogleProperty {
  site_url: string;
  permission_level: string | null;
  selectable: boolean;
  recommended: boolean;
}

export interface ApiGoogleProperties {
  selected: string | null;
  properties: ApiGoogleProperty[];
}

export function adaptGoogleProperties(raw: ApiGoogleProperties): GoogleProperties {
  return {
    selected: raw.selected ?? null,
    properties: (raw.properties ?? []).map((row) => ({
      siteUrl: row.site_url,
      permissionLevel: row.permission_level ?? null,
      selectable: Boolean(row.selectable),
      recommended: Boolean(row.recommended),
    })),
  };
}

export interface ApiReachQuery {
  query: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
}

export interface ApiPostIndexStatus {
  state: IndexState;
  coverage_state: string;
  verdict: string;
  last_crawl_time: string | null;
  google_canonical: string | null;
  referring_urls?: string[];
  inspected_at: string | null;
}

export interface ApiPostReach {
  draft_id: number;
  title: string;
  live_url: string | null;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
  estimated: boolean;
  top_queries?: ApiReachQuery[];
  /** Backend SPEC-261; optional so a pre-261 payload still adapts. */
  index?: ApiPostIndexStatus | null;
}

export interface ApiVisibility {
  connected: boolean;
  email?: string | null;
  property_url?: string | null;
  window_days: number;
  last_pull: string | null;
  posts: ApiPostReach[];
  index_summary?: { indexed: number; not_indexed: number; uninspected: number };
}

function adaptPostIndex(raw: ApiPostIndexStatus | null | undefined): PostIndexStatus | null {
  if (!raw) return null;
  return {
    state: raw.state,
    coverageState: raw.coverage_state ?? "",
    verdict: raw.verdict ?? "",
    lastCrawlTime: raw.last_crawl_time ?? null,
    googleCanonical: raw.google_canonical ?? null,
    referringUrls: raw.referring_urls ?? [],
    inspectedAt: raw.inspected_at ?? null,
  };
}

function adaptReachQuery(raw: ApiReachQuery): ReachQuery {
  return {
    query: raw.query,
    impressions: raw.impressions,
    clicks: raw.clicks,
    ctr: raw.ctr,
    position: raw.position,
  };
}

function adaptPostReach(raw: ApiPostReach): PostReach {
  return {
    draftId: raw.draft_id,
    title: raw.title,
    liveUrl: raw.live_url ?? null,
    impressions: raw.impressions,
    clicks: raw.clicks,
    ctr: raw.ctr,
    position: raw.position,
    estimated: raw.estimated,
    topQueries: (raw.top_queries ?? []).map(adaptReachQuery),
    index: adaptPostIndex(raw.index),
  };
}

/** Roll up the returned posts into the tab's KPI tiles: sum impressions/clicks,
 * count measured posts (rows exist — not Google's index status, SPEC-261), and an
 * impression-weighted mean position over measured posts (null when none). Weighting by impressions is the standard GSC
 * roll-up — a plain mean would over-weight low-reach pages. */
function rollUpTotals(posts: PostReach[]): VisibilityData["totals"] {
  const indexedPosts = posts.filter((post) => !post.estimated);
  const impressions = posts.reduce((sum, post) => sum + post.impressions, 0);
  const clicks = posts.reduce((sum, post) => sum + post.clicks, 0);
  const weight = indexedPosts.reduce((sum, post) => sum + post.impressions, 0);
  let avgPosition: number | null = null;
  if (indexedPosts.length > 0) {
    avgPosition =
      weight > 0
        ? indexedPosts.reduce((sum, post) => sum + post.position * post.impressions, 0) /
          weight
        : indexedPosts.reduce((sum, post) => sum + post.position, 0) /
          indexedPosts.length;
  }
  return { impressions, clicks, avgPosition, measured: indexedPosts.length };
}

/** Merge every post's top queries into one leaderboard: sum impressions/clicks
 * per keyword, keep the best (lowest) position, sort by impressions desc. */
function aggregateTopQueries(posts: PostReach[], limit = 10): ReachQuery[] {
  const byKeyword = new Map<string, ReachQuery>();
  for (const post of posts) {
    for (const query of post.topQueries) {
      const existing = byKeyword.get(query.query);
      if (existing) {
        existing.impressions += query.impressions;
        existing.clicks += query.clicks;
        existing.position = Math.min(existing.position, query.position);
        existing.ctr =
          existing.impressions > 0 ? existing.clicks / existing.impressions : 0;
      } else {
        byKeyword.set(query.query, { ...query });
      }
    }
  }
  return [...byKeyword.values()]
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, limit);
}

export function adaptVisibility(raw: ApiVisibility): VisibilityData {
  const posts = raw.posts.map(adaptPostReach);
  return {
    connected: raw.connected,
    email: raw.email ?? null,
    propertyUrl: raw.property_url ?? null,
    windowDays: raw.window_days,
    lastPull: raw.last_pull ?? null,
    posts,
    totals: rollUpTotals(posts),
    topQueries: aggregateTopQueries(posts),
    indexSummary: {
      indexed: raw.index_summary?.indexed ?? 0,
      notIndexed: raw.index_summary?.not_indexed ?? 0,
      uninspected: raw.index_summary?.uninspected ?? posts.length,
    },
  };
}

// ── Spotlight Overview rollup (backend SPEC-120) ─────────────────────────────
// The backend owns every count (root Rule 8): pipeline statuses, KPI numbers,
// activity events, and next-actions all arrive computed. The adapter only maps
// the snake_case payload to the view model and pre-formats display strings —
// impressions render as a real number only when GSC is connected, else a neutral
// "—" (never a fabricated figure).

export interface ApiPipelineStage {
  key: string;
  label: string;
  status: string;
  detail: string;
  progress: number;
}

export interface ApiOverviewKpis {
  brand_dna_ready: boolean;
  drafts_in_review: number;
  published_total: number;
  published_this_month: number;
  impressions_28d: number;
  gsc_connected: boolean;
  /** Blog → sales attribution (backend SPEC-126): store-total revenue + orders
   * attributed to blog landings over the attribution window. */
  revenue_from_blogs: number;
  attributed_orders: number;
}

export interface ApiActivityItem {
  kind: string;
  text: string;
  detail: string;
  when: string;
}

export interface ApiNextAction {
  text: string;
  cta_tab: string;
}

export interface ApiOverview {
  pipeline: ApiPipelineStage[];
  kpis: ApiOverviewKpis;
  activity: ApiActivityItem[];
  next_actions: ApiNextAction[];
}

const PIPELINE_STATUS: Record<string, PipelineStatus> = {
  done: "complete",
  active: "in_progress",
  queued: "not_started",
};

const ACTIVITY_KINDS: readonly ActivityKind[] = [
  "research",
  "draft",
  "publish",
  "approval",
  "measure",
];

function normalizeActivityKind(kind: string): ActivityKind {
  return ACTIVITY_KINDS.includes(kind as ActivityKind)
    ? (kind as ActivityKind)
    : "draft";
}

/** Per-tab CTA label + supporting copy for a next-best-action. The backend
 * decides WHICH actions are true (never fabricated); the UI owns the wording. */
const ACTION_COPY: Record<string, { cta: string; detail: string }> = {
  approvals: {
    cta: "Review approvals",
    detail: "Approve drafts and publish them to your storefront.",
  },
  "brand-brain": {
    cta: "Open Brand Brain",
    detail: "Confirm your identity, voice, and personas.",
  },
  inbound: {
    cta: "Open Inbound Engine",
    detail: "Generate SEO drafts from your query bank.",
  },
  visibility: {
    cta: "Go to Visibility",
    detail: "Turn published posts into measured organic reach.",
  },
};

function adaptPipelineStage(raw: ApiPipelineStage): PipelineStage {
  return {
    id: raw.key,
    name: raw.label,
    description: raw.detail,
    progress: raw.progress,
    status: PIPELINE_STATUS[raw.status] ?? "not_started",
  };
}

function adaptActivityItem(raw: ApiActivityItem, index: number): ActivityItem {
  return {
    id: `${raw.kind}-${raw.when}-${index}`,
    kind: normalizeActivityKind(raw.kind),
    title: raw.text,
    detail: raw.detail,
    timestamp: raw.when,
  };
}

function adaptNextAction(raw: ApiNextAction, index: number): NextAction {
  const copy = ACTION_COPY[raw.cta_tab];
  return {
    id: `${raw.cta_tab}-${index}`,
    title: raw.text,
    detail: copy?.detail ?? "",
    cta: copy?.cta ?? "Open",
    href: `/spotlight?tab=${raw.cta_tab}`,
  };
}

/** Build the four Overview KPI tiles from the backend counts. No deltas — the
 * rollup carries no prior-period baseline, so none is invented (root Rule 8).
 * Reach shows a real number only when GSC is connected, else a neutral dash. */
function buildKpis(kpis: ApiOverviewKpis): SpotlightKpi[] {
  return [
    {
      id: "brand-dna",
      label: "Brand DNA",
      value: kpis.brand_dna_ready ? "Ready" : "Pending",
      hint: kpis.brand_dna_ready
        ? "Grounds every draft"
        : "Seed your Brand Brain",
    },
    {
      id: "drafts-in-review",
      label: "Drafts in review",
      value: formatNumber(kpis.drafts_in_review),
      hint: "Awaiting your approval",
    },
    {
      id: "published",
      label: "Published posts",
      value: formatNumber(kpis.published_total),
      hint: `${formatNumber(kpis.published_this_month)} this month`,
    },
    {
      id: "reach",
      label: "Reach · 28d",
      // Impressions are measured, not estimated — show them only when Search
      // Console is connected; otherwise a neutral dash with a connect nudge.
      value: kpis.gsc_connected ? formatNumber(kpis.impressions_28d) : "—",
      hint: kpis.gsc_connected
        ? "Impressions, trailing 28 days"
        : "Connect Search Console to measure",
    },
    {
      // SPEC-126: revenue attributed to blog landings. Always a real number
      // (a set-based backend aggregate) — $0.00 with an honest hint before any
      // blog earns, never a fabricated figure (root Rule 8).
      id: "revenue-from-blogs",
      label: "Revenue from blogs",
      value: formatCurrency(kpis.revenue_from_blogs),
      hint:
        kpis.attributed_orders > 0
          ? `${formatNumber(kpis.attributed_orders)} ${
              kpis.attributed_orders === 1 ? "order" : "orders"
            } · trailing 90 days`
          : "No attributed sales yet",
    },
  ];
}

export function adaptOverview(raw: ApiOverview): OverviewData {
  return {
    pipeline: raw.pipeline.map(adaptPipelineStage),
    kpis: buildKpis(raw.kpis),
    activity: raw.activity.map(adaptActivityItem),
    nextActions: raw.next_actions.map(adaptNextAction),
  };
}



/** Raw True Profit response (backend SPEC-204). */
export interface ApiTrueProfit {
  summary: {
    gross_revenue: number;
    discounts: number;
    cogs: number;
    returns: number;
    true_profit: number;
    products_counted: number;
    loss_makers: number;
    loss_maker_total: number;
    missing_cost_products: number;
  };
  products: {
    product_id: number;
    title: string;
    category: string;
    units: number;
    units_returned: number;
    gross_revenue: number;
    discounts: number;
    cogs: number;
    returns: number;
    true_profit: number;
    margin_pct: number | null;
    cost_coverage_pct: number;
    verdict: string;
    verdict_tone: string;
  }[];
}

/**
 * True Profit per SKU (frontend SPEC-185). Pure field mapping — every figure is
 * computed by the backend (root Rule 8); nothing is recomputed here, including the
 * margin, which stays null rather than being derived when revenue is zero.
 */
export interface ApiBrandVerdicts {
  period: { key: string; start: string; end: string };
  summary: {
    vendors: number;
    with_verdict: number;
    stop: number;
    buy_less: number;
    buy_more: number;
    hold: number;
    too_few_sales: number;
    returns_source: string;
    margin_min_coverage_pct: number;
  };
  brands: {
    vendor: string;
    products: number;
    units: number;
    revenue: number;
    orders: number;
    units_returned: number;
    refund_value: number;
    return_rate: number;
    stock_units: number;
    stock_value: number;
    sell_through: number | null;
    dead_products: number;
    dead_stock_value: number;
    product_margin: number | null;
    margin_pct: number | null;
    coverage_pct: number;
    verdict: "stop" | "buy_less" | "buy_more" | "hold" | "too_few_sales";
    verdict_label: string;
    verdict_tone: "bad" | "warn" | "good" | "neutral" | "muted";
    why: string;
  }[];
}

/**
 * Brand verdicts (frontend SPEC-239). Pure field mapping — sell-through, return
 * rate, margin and the verdict itself all arrive computed (root Rule 8); nulls stay
 * null rather than becoming a 0 that would read as a real figure.
 */
export function adaptBrandVerdicts(raw: ApiBrandVerdicts): BrandVerdictsData {
  return {
    summary: {
      vendors: raw.summary.vendors,
      withVerdict: raw.summary.with_verdict,
      stop: raw.summary.stop,
      buyLess: raw.summary.buy_less,
      buyMore: raw.summary.buy_more,
      hold: raw.summary.hold,
      tooFewSales: raw.summary.too_few_sales,
      returnsSource: raw.summary.returns_source,
      marginMinCoveragePct: raw.summary.margin_min_coverage_pct,
    },
    brands: raw.brands.map((b) => ({
      vendor: b.vendor,
      products: b.products,
      units: b.units,
      revenue: b.revenue,
      orders: b.orders,
      unitsReturned: b.units_returned,
      refundValue: b.refund_value,
      returnRate: b.return_rate,
      stockUnits: b.stock_units,
      stockValue: b.stock_value,
      sellThrough: b.sell_through,
      deadProducts: b.dead_products,
      deadStockValue: b.dead_stock_value,
      productMargin: b.product_margin,
      marginPct: b.margin_pct,
      coveragePct: b.coverage_pct,
      verdict: b.verdict,
      verdictLabel: b.verdict_label,
      verdictTone: b.verdict_tone,
      why: b.why,
    })),
  };
}

export function adaptTrueProfit(raw: ApiTrueProfit): TrueProfitData {
  return {
    summary: {
      grossRevenue: raw.summary.gross_revenue,
      discounts: raw.summary.discounts,
      cogs: raw.summary.cogs,
      returns: raw.summary.returns,
      trueProfit: raw.summary.true_profit,
      productsCounted: raw.summary.products_counted,
      lossMakers: raw.summary.loss_makers,
      lossMakerTotal: raw.summary.loss_maker_total,
      missingCostProducts: raw.summary.missing_cost_products,
    },
    products: raw.products.map((p) => ({
      productId: p.product_id,
      title: p.title,
      category: p.category,
      units: p.units,
      unitsReturned: p.units_returned,
      grossRevenue: p.gross_revenue,
      discounts: p.discounts,
      cogs: p.cogs,
      returns: p.returns,
      trueProfit: p.true_profit,
      marginPct: p.margin_pct,
      costCoveragePct: p.cost_coverage_pct,
      verdict: p.verdict,
      verdictTone:
        p.verdict_tone === "good" || p.verdict_tone === "bad" ? p.verdict_tone : "muted",
    })),
  };
}


/** Raw discount-cannibalisation response (backend SPEC-205). */
export interface ApiCannibalisation {
  summary: {
    codes_counted: number;
    discount_given: number;
    discount_to_existing: number;
    existing_share_pct: number;
    new_customers: number;
    not_acquiring_codes: number;
    not_acquiring_spend: number;
  };
  codes: {
    code: string;
    orders: number;
    discount_given: number;
    discount_to_existing: number;
    existing_share_pct: number;
    new_customers: number;
    existing_orders: number;
    unattributed_orders: number;
    cost_per_new_customer: number | null;
    verdict: string;
    verdict_tone: string;
  }[];
}

const CANNIBALISATION_TONES = new Set(["good", "bad", "warn", "muted"]);

/** Discount cannibalisation (frontend SPEC-186). Field mapping only — the split,
 * the share and the verdict are all computed backend-side (root Rule 8). */
export interface ApiDiscountDecisions {
  period: { start: string; end: string };
  summary: {
    codes_judged: number;
    worked: number;
    cost_margin: number;
    no_lift: number;
    always_on: number;
    too_small: number;
    discount_given: number;
    discount_to_existing: number;
  };
  decisions: {
    code: string;
    period_days: number;
    window: { start: string; end: string; days: number; source: "shopify" | "orders"; open_ended: boolean };
    code_orders: number;
    code_revenue: number;
    discount_given: number;
    new_customers: number;
    existing_orders: number;
    discount_to_existing: number;
    existing_share_pct: number | null;
    store: {
      orders_per_day_before: number;
      orders_per_day_during: number;
      orders_delta_pct: number | null;
      revenue_per_day_before: number;
      revenue_per_day_during: number;
      revenue_delta_pct: number | null;
      margin_pct_before: number | null;
      margin_pct_during: number | null;
      margin_delta_pts: number | null;
      coverage_pct: number;
    };
    verdict: "cost_margin" | "no_lift" | "worked" | "always_on" | "too_small";
    verdict_label: string;
    verdict_tone: "warn" | "bad" | "good" | "neutral" | "muted";
    why: string;
  }[];
}

/** Discount decisions (frontend SPEC-244). Pure field mapping — every before/during
 * figure, delta and verdict arrives computed (root Rule 8); nulls stay null. */
export function adaptDiscountDecisions(raw: ApiDiscountDecisions): DiscountDecisionsData {
  return {
    summary: {
      codesJudged: raw.summary.codes_judged,
      worked: raw.summary.worked,
      costMargin: raw.summary.cost_margin,
      noLift: raw.summary.no_lift,
      alwaysOn: raw.summary.always_on,
      tooSmall: raw.summary.too_small,
      discountGiven: raw.summary.discount_given,
      discountToExisting: raw.summary.discount_to_existing,
    },
    decisions: raw.decisions.map((d) => ({
      code: d.code,
      periodDays: d.period_days,
      window: {
        start: d.window.start,
        end: d.window.end,
        days: d.window.days,
        source: d.window.source,
        openEnded: d.window.open_ended,
      },
      codeOrders: d.code_orders,
      codeRevenue: d.code_revenue,
      discountGiven: d.discount_given,
      newCustomers: d.new_customers,
      existingOrders: d.existing_orders,
      discountToExisting: d.discount_to_existing,
      existingSharePct: d.existing_share_pct,
      store: {
        ordersPerDayBefore: d.store.orders_per_day_before,
        ordersPerDayDuring: d.store.orders_per_day_during,
        ordersDeltaPct: d.store.orders_delta_pct,
        revenuePerDayBefore: d.store.revenue_per_day_before,
        revenuePerDayDuring: d.store.revenue_per_day_during,
        revenueDeltaPct: d.store.revenue_delta_pct,
        marginPctBefore: d.store.margin_pct_before,
        marginPctDuring: d.store.margin_pct_during,
        marginDeltaPts: d.store.margin_delta_pts,
        coveragePct: d.store.coverage_pct,
      },
      verdict: d.verdict,
      verdictLabel: d.verdict_label,
      verdictTone: d.verdict_tone,
      why: d.why,
    })),
  };
}

export function adaptCannibalisation(raw: ApiCannibalisation): CannibalisationData {
  return {
    summary: {
      codesCounted: raw.summary.codes_counted,
      discountGiven: raw.summary.discount_given,
      discountToExisting: raw.summary.discount_to_existing,
      existingSharePct: raw.summary.existing_share_pct,
      newCustomers: raw.summary.new_customers,
      notAcquiringCodes: raw.summary.not_acquiring_codes,
      notAcquiringSpend: raw.summary.not_acquiring_spend,
    },
    codes: raw.codes.map((c) => ({
      code: c.code,
      orders: c.orders,
      discountGiven: c.discount_given,
      discountToExisting: c.discount_to_existing,
      existingSharePct: c.existing_share_pct,
      newCustomers: c.new_customers,
      existingOrders: c.existing_orders,
      unattributedOrders: c.unattributed_orders,
      costPerNewCustomer: c.cost_per_new_customer,
      verdict: c.verdict,
      verdictTone: (CANNIBALISATION_TONES.has(c.verdict_tone)
        ? c.verdict_tone
        : "muted") as CannibalisationData["codes"][number]["verdictTone"],
    })),
  };
}


/** Raw return-fixes response (backend SPEC-206). */
export interface ApiReturnFixes {
  summary: {
    returns_with_reason: number;
    refund_value: number;
    fixable_value: number;
    fixable_share_pct: number;
    products_counted: number;
    all_refund_lines: number;
    reason_coverage_pct: number;
  };
  reason_mix: {
    reason: string;
    lines: number;
    value: number;
    share_pct: number;
    fix: string;
  }[];
  products: {
    product_id: string;
    title: string;
    returns: number;
    refund_value: number;
    top_reason: string;
    top_reason_share_pct: number;
    fix: string;
    value_at_stake: number;
  }[];
}

/** Return-reason product fixes (frontend SPEC-187). Field mapping only — the
 * dominant reason, the fix and the shares are all computed backend-side (Rule 8). */
export function adaptReturnFixes(raw: ApiReturnFixes): ReturnFixesData {
  return {
    summary: {
      returnsWithReason: raw.summary.returns_with_reason,
      refundValue: raw.summary.refund_value,
      fixableValue: raw.summary.fixable_value,
      fixableSharePct: raw.summary.fixable_share_pct,
      productsCounted: raw.summary.products_counted,
      allRefundLines: raw.summary.all_refund_lines,
      reasonCoveragePct: raw.summary.reason_coverage_pct,
    },
    reasonMix: raw.reason_mix.map((m) => ({
      reason: m.reason,
      lines: m.lines,
      value: m.value,
      sharePct: m.share_pct,
      fix: m.fix,
    })),
    products: raw.products.map((p) => ({
      productId: p.product_id,
      title: p.title,
      returns: p.returns,
      refundValue: p.refund_value,
      topReason: p.top_reason,
      topReasonSharePct: p.top_reason_share_pct,
      fix: p.fix,
      valueAtStake: p.value_at_stake,
    })),
  };
}


/** Raw value-ledger response (backend SPEC-207). */
export interface ApiValueLedger {
  summary: {
    actions_taken: number;
    worked: number;
    no_effect: number;
    still_measuring: number;
    measured_value: number;
    actions_with_value: number;
  };
  by_category: { category: string; actions: number; worked: number; value: number }[];
  entries: {
    category: string;
    headline: string;
    detail: string;
    meta: string;
    sent_at: string;
    verdict: string;
    value: number | null;
    value_basis: string | null;
  }[];
}

/** Value ledger (frontend SPEC-188). `value` stays null where the backend could not
 * attribute one — mapping it to 0 would read as "this action was worth nothing"
 * rather than "this action is not monetisable", which is a different claim. */
export function adaptValueLedger(raw: ApiValueLedger): ValueLedger {
  return {
    summary: {
      actionsTaken: raw.summary.actions_taken,
      worked: raw.summary.worked,
      noEffect: raw.summary.no_effect,
      stillMeasuring: raw.summary.still_measuring,
      measuredValue: raw.summary.measured_value,
      actionsWithValue: raw.summary.actions_with_value,
    },
    byCategory: raw.by_category.map((c) => ({
      category: c.category,
      actions: c.actions,
      worked: c.worked,
      value: c.value,
    })),
    entries: raw.entries.map((e) => ({
      category: e.category,
      headline: e.headline,
      detail: e.detail,
      meta: e.meta,
      sentAt: e.sent_at,
      verdict: (["worked", "early", "none"].includes(e.verdict)
        ? e.verdict
        : "none") as OutcomeVerdict,
      value: e.value,
      valueBasis: e.value_basis,
    })),
  };
}


/** Raw customer-segments response (backend SPEC-208). */
export interface ApiCustomerSegments {
  segments: {
    segment: string;
    label: string;
    customers: number;
    orders: number;
    revenue: number;
    aov: number;
    discount_given: number;
  }[];
  customers_counted: number;
  excluded_guest_orders: number;
}

/** Raw repeat-clock response (backend SPEC-209). */
export interface ApiRepeatClock {
  summary: {
    customers_measured: number;
    median_days: number | null;
    p25_days: number | null;
    p75_days: number | null;
  };
  buckets: {
    label: string;
    low: number;
    high: number | null;
    customers: number;
    share_pct: number;
  }[];
}

/** Customer discount segments (frontend SPEC-189). Field mapping only. */
export function adaptCustomerSegments(
  raw: ApiCustomerSegments,
): CustomerSegmentsData {
  return {
    segments: raw.segments.map((s) => ({
      segment: s.segment,
      label: s.label,
      customers: s.customers,
      orders: s.orders,
      revenue: s.revenue,
      aov: s.aov,
      discountGiven: s.discount_given,
    })),
    customersCounted: raw.customers_counted,
    excludedGuestOrders: raw.excluded_guest_orders,
  };
}

/** Repeat-purchase clock (frontend SPEC-189). Percentiles stay null on an empty
 * population — 0 would read as "customers return the same day". */
export function adaptRepeatClock(raw: ApiRepeatClock): RepeatClockData {
  return {
    summary: {
      customersMeasured: raw.summary.customers_measured,
      medianDays: raw.summary.median_days,
      p25Days: raw.summary.p25_days,
      p75Days: raw.summary.p75_days,
    },
    buckets: raw.buckets.map((b) => ({
      label: b.label,
      low: b.low,
      high: b.high,
      customers: b.customers,
      sharePct: b.share_pct,
    })),
  };
}


/** Raw customer-health response (backend SPEC-253). */
export interface ApiCustomerHealth {
  window_days: number;
  /** Backend SPEC-374. */
  covered_days?: number;
  covered_since?: string;
  summary: {
    customers: number;
    spend_reviewed: number;
    open_issue: number;
    going_quiet: number;
    draining: number;
    healthy: number;
    at_stake: number;
    refunded_by_draining: number;
    ticket_email_coverage_pct: number | null;
  };
  customers: {
    customer_id: number;
    name: string;
    email: string | null;
    orders: number;
    spent: number;
    refunds: number;
    refunded: number;
    refund_pct: number | null;
    net: number;
    last_order_at: string;
    days_since_last_order: number;
    avg_gap_days: number | null;
    loop_returns: number;
    loop_open: number;
    tickets: number;
    open_tickets: number;
    last_ticket_at: string | null;
    open_ticket_reason: string | null;
    open_ticket_since: string | null;
    verdict: CustomerHealthData["customers"][number]["verdict"];
    verdict_label: string;
    verdict_tone: CustomerHealthData["customers"][number]["verdictTone"];
    why: string;
  }[];
}

/** Customer health (frontend SPEC-247). Field mapping only — the verdict is the backend's. */
export function adaptCustomerHealth(raw: ApiCustomerHealth): CustomerHealthData {
  return {
    windowDays: raw.window_days,
    coveredDays: raw.covered_days ?? raw.window_days,
    coveredSince: raw.covered_since ?? null,
    summary: {
      customers: raw.summary.customers,
      spendReviewed: raw.summary.spend_reviewed,
      openIssue: raw.summary.open_issue,
      goingQuiet: raw.summary.going_quiet,
      draining: raw.summary.draining,
      healthy: raw.summary.healthy,
      atStake: raw.summary.at_stake,
      refundedByDraining: raw.summary.refunded_by_draining,
      ticketEmailCoveragePct: raw.summary.ticket_email_coverage_pct,
    },
    customers: raw.customers.map((c) => ({
      customerId: c.customer_id,
      name: c.name,
      email: c.email,
      orders: c.orders,
      spent: c.spent,
      refunds: c.refunds,
      refunded: c.refunded,
      refundPct: c.refund_pct,
      net: c.net,
      lastOrderAt: c.last_order_at,
      daysSinceLastOrder: c.days_since_last_order,
      avgGapDays: c.avg_gap_days,
      loopReturns: c.loop_returns,
      loopOpen: c.loop_open,
      tickets: c.tickets,
      openTickets: c.open_tickets,
      lastTicketAt: c.last_ticket_at,
      openTicketReason: c.open_ticket_reason,
      openTicketSince: c.open_ticket_since,
      verdict: c.verdict,
      verdictLabel: c.verdict_label,
      verdictTone: c.verdict_tone,
      why: c.why,
    })),
  };
}

/** Raw buy-plan response (backend SPEC-210). */
export interface ApiBuyPlan {
  summary: {
    products_to_reorder: number;
    units_suggested: number;
    revenue_at_risk: number;
    cover_days_target: number;
    categories_with_curve: number;
  };
  curves: {
    category: string;
    sizes: {
      size: string;
      units_sold: number;
      on_hand: number;
      share_pct: number;
      sell_through_pct: number;
      constrained: boolean;
    }[];
  }[];
  products: {
    product_id: number;
    title: string;
    category: string;
    units_sold: number;
    on_hand: number;
    revenue: number;
    days_of_cover: number;
    suggested_units: number;
    split: { size: string; units: number; constrained: boolean }[];
    split_basis: string;
  }[];
}

/** Size-curve buy plan (frontend SPEC-211). Field mapping only — the curve, the
 * narrowing and the largest-remainder split are all backend maths (Rule 8). */
export function adaptBuyPlan(raw: ApiBuyPlan): BuyPlanData {
  return {
    summary: {
      productsToReorder: raw.summary.products_to_reorder,
      unitsSuggested: raw.summary.units_suggested,
      revenueAtRisk: raw.summary.revenue_at_risk,
      coverDaysTarget: raw.summary.cover_days_target,
      categoriesWithCurve: raw.summary.categories_with_curve,
    },
    curves: raw.curves.map((c) => ({
      category: c.category,
      sizes: c.sizes.map((s) => ({
        size: s.size,
        unitsSold: s.units_sold,
        onHand: s.on_hand,
        sharePct: s.share_pct,
        sellThroughPct: s.sell_through_pct,
        constrained: s.constrained,
      })),
    })),
    products: raw.products.map((p) => ({
      productId: p.product_id,
      title: p.title,
      category: p.category,
      unitsSold: p.units_sold,
      onHand: p.on_hand,
      revenue: p.revenue,
      daysOfCover: p.days_of_cover,
      suggestedUnits: p.suggested_units,
      split: p.split.map((s) => ({
        size: s.size,
        units: s.units,
        constrained: s.constrained,
      })),
      splitBasis: p.split_basis,
    })),
  };
}


/** Raw content-gaps response (backend SPEC-212). */
export interface ApiContentGaps {
  summary: {
    products_flagged: number;
    revenue_behind_them: number;
    by_gap: { gap: string; products: number }[];
    products_selling: number;
  };
  products: {
    product_id: number;
    title: string;
    category: string;
    image_count: number;
    units_sold: number;
    revenue: number;
    revenue_per_image: number | null;
    gap: string;
  }[];
}

/** Product content gaps (frontend SPEC-213). Field mapping only. */
export function adaptContentGaps(raw: ApiContentGaps): ContentGapsData {
  return {
    summary: {
      productsFlagged: raw.summary.products_flagged,
      revenueBehindThem: raw.summary.revenue_behind_them,
      byGap: raw.summary.by_gap.map((g) => ({ gap: g.gap, products: g.products })),
      productsSelling: raw.summary.products_selling,
    },
    products: raw.products.map((p) => ({
      productId: p.product_id,
      title: p.title,
      category: p.category,
      imageCount: p.image_count,
      unitsSold: p.units_sold,
      revenue: p.revenue,
      revenuePerImage: p.revenue_per_image,
      gap: p.gap,
    })),
  };
}


/** Raw what-changed response (backend SPEC-214). */
export interface ApiWhatChanged {
  summary: {
    revenue_now: number;
    revenue_prev: number;
    total_delta: number;
    total_delta_pct: number | null;
    products_moved: number;
    concentration_pct: number;
  };
  movers: {
    product_id: number;
    title: string;
    category: string;
    revenue_now: number;
    revenue_prev: number;
    delta: number;
    units_now: number;
    units_prev: number;
    on_hand: number;
    signal: string;
    share_of_change_pct: number | null;
  }[];
}

/** What changed, and why (frontend SPEC-190). Field mapping only — the whole point
 * is that the backend's deltas sum exactly to its total, so nothing is recomputed. */
export function adaptWhatChanged(raw: ApiWhatChanged): WhatChanged {
  return {
    summary: {
      revenueNow: raw.summary.revenue_now,
      revenuePrev: raw.summary.revenue_prev,
      totalDelta: raw.summary.total_delta,
      totalDeltaPct: raw.summary.total_delta_pct,
      productsMoved: raw.summary.products_moved,
      concentrationPct: raw.summary.concentration_pct,
    },
    movers: raw.movers.map((m) => ({
      productId: m.product_id,
      title: m.title,
      category: m.category,
      revenueNow: m.revenue_now,
      revenuePrev: m.revenue_prev,
      delta: m.delta,
      unitsNow: m.units_now,
      unitsPrev: m.units_prev,
      onHand: m.on_hand,
      signal: m.signal,
      shareOfChangePct: m.share_of_change_pct,
    })),
  };
}


/** Raw bundles response (backend SPEC-215). */
export interface ApiBundles {
  summary: {
    pairs_considered: number;
    pairs_ranked: number;
    pairs_without_cost: number;
    margin_flowing_top: number;
    top_pair_by_margin: number | null;
    top_pair_by_frequency_margin: number | null;
  };
  bundles: {
    product_a: number;
    product_b: number;
    title_a: string;
    title_b: string;
    orders_together: number;
    attach_rate_pct: number | null;
    margin_a: number;
    margin_b: number;
    margin_per_bundle: number;
    margin_flowing: number;
  }[];
}

/** Margin-ranked bundle candidates (frontend SPEC-191). Field mapping only. */
export function adaptBundles(raw: ApiBundles): BundlesData {
  return {
    summary: {
      pairsConsidered: raw.summary.pairs_considered,
      pairsRanked: raw.summary.pairs_ranked,
      pairsWithoutCost: raw.summary.pairs_without_cost,
      marginFlowingTop: raw.summary.margin_flowing_top,
      topPairByMargin: raw.summary.top_pair_by_margin,
      topPairByFrequencyMargin: raw.summary.top_pair_by_frequency_margin,
    },
    bundles: raw.bundles.map((b) => ({
      productA: b.product_a,
      productB: b.product_b,
      titleA: b.title_a,
      titleB: b.title_b,
      ordersTogether: b.orders_together,
      attachRatePct: b.attach_rate_pct,
      marginA: b.margin_a,
      marginB: b.margin_b,
      marginPerBundle: b.margin_per_bundle,
      marginFlowing: b.margin_flowing,
    })),
  };
}


/** Raw launch-watch response (backend SPEC-216). */
export interface ApiLaunchWatch {
  summary: {
    drops_watched: number;
    at_or_above_winner_pace: number;
    benchmark_cohort: number;
    watch_days: number;
    urgent_reorders: number;
  };
  benchmark: { d7: number | null; d14: number | null; d30: number | null; basis: string };
  drops: {
    product_id: number;
    title: string;
    category: string;
    first_sold_at: string;
    age_days: number;
    units_total: number;
    revenue_total: number;
    on_hand: number;
    milestone_days: number | null;
    units_at_milestone: number | null;
    benchmark_units: number | null;
    pace_ratio: number | null;
    days_of_cover: number | null;
    verdict: string;
    verdict_tone: string;
  }[];
}

const LAUNCH_TONES = new Set(["good", "warn", "muted"]);

/** New-drop launch watch (frontend SPEC-192). Field mapping only — the pace ratio
 * and the winner benchmark are backend maths (Rule 8). Nulls stay null: a drop too
 * young to score is not a drop scoring zero. */
export function adaptLaunchWatch(raw: ApiLaunchWatch): LaunchWatchData {
  return {
    summary: {
      dropsWatched: raw.summary.drops_watched,
      atOrAboveWinnerPace: raw.summary.at_or_above_winner_pace,
      benchmarkCohort: raw.summary.benchmark_cohort,
      watchDays: raw.summary.watch_days,
      urgentReorders: raw.summary.urgent_reorders,
    },
    benchmark: raw.benchmark,
    drops: raw.drops.map((d) => ({
      productId: d.product_id,
      title: d.title,
      category: d.category,
      firstSoldAt: d.first_sold_at,
      ageDays: d.age_days,
      unitsTotal: d.units_total,
      revenueTotal: d.revenue_total,
      onHand: d.on_hand,
      milestoneDays: d.milestone_days,
      unitsAtMilestone: d.units_at_milestone,
      benchmarkUnits: d.benchmark_units,
      paceRatio: d.pace_ratio,
      daysOfCover: d.days_of_cover,
      verdict: d.verdict,
      verdictTone: (LAUNCH_TONES.has(d.verdict_tone)
        ? d.verdict_tone
        : "muted") as LaunchWatchData["drops"][number]["verdictTone"],
    })),
  };
}
