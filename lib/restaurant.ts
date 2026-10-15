/**
 * Restaurant screens' pure half (frontend SPEC-377): periods, tabs, labels and the KPI tiles.
 * Formatting only — every figure arrives computed by the backend (SPEC-389).
 */
import type { StripTile } from "@/lib/kpi-strip";
import type { Permission } from "@/lib/permissions";
import type {
  BranchStatus,
  Kpi,
  KpiKey,
  MenuClass,
  NetworkOverview,
  RestaurantFilters,
} from "@/types/restaurant";
import { formatCurrency, formatNumber, formatPercent } from "@/utils/format";

// ── periods ──────────────────────────────────────────────────────────────────

export const RANGE_PRESETS = [
  { key: "7d", label: "Last 7 days", days: 7 },
  { key: "28d", label: "Last 28 days", days: 28 },
  { key: "90d", label: "Last 90 days", days: 90 },
] as const;

export type RangeKey = (typeof RANGE_PRESETS)[number]["key"] | "custom";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function shift(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export interface ResolvedPeriod {
  from: string;
  to: string;
  range: RangeKey;
}

/** The period a page reads: an explicit `from`/`to`, else a preset of complete days (the
 * default is the last 7, ending yesterday — today is still trading). */
export function resolvePeriod(
  params: { range?: string; from?: string; to?: string },
  todayISO: string,
): ResolvedPeriod {
  const { from, to } = params;
  if (from && to && ISO_DATE.test(from) && ISO_DATE.test(to) && from <= to) {
    return { from, to, range: "custom" };
  }
  const preset = RANGE_PRESETS.find((p) => p.key === params.range) ?? RANGE_PRESETS[0];
  const end = shift(todayISO, -1);
  return { from: shift(end, -(preset.days - 1)), to: end, range: preset.key };
}

function positiveInt(value: string | undefined): number | null {
  if (!value || !/^\d+$/.test(value)) return null;
  const n = Number(value);
  return n > 0 ? n : null;
}

export interface RestaurantSearchParams {
  range?: string;
  from?: string;
  to?: string;
  franchisee?: string;
  region?: string;
  branch?: string;
  target?: string;
  tab?: string;
  class?: string;
  category?: string;
  q?: string;
}

/** Every read's filters, from the URL. */
export function filtersFromParams(params: RestaurantSearchParams, todayISO: string): RestaurantFilters & { range: RangeKey } {
  const period = resolvePeriod(params, todayISO);
  const target = positiveInt(params.target);
  return {
    from: period.from,
    to: period.to,
    range: period.range,
    franchiseeId: positiveInt(params.franchisee),
    regionId: positiveInt(params.region),
    branchId: positiveInt(params.branch),
    target: target != null && target >= 5 && target <= 180 ? target : null,
  };
}

/** The filters a read is keyed and fetched by (the preset's name is only for the picker). */
export function readFilters(params: RestaurantSearchParams, todayISO: string): RestaurantFilters {
  const { from, to, franchiseeId, regionId, branchId, target } = filtersFromParams(params, todayISO);
  return { from, to, franchiseeId, regionId, branchId, target };
}

/** A link to `path` keeping the period and filters, with `changes` applied (null removes). */
export function withParams(
  path: string,
  current: Record<string, string | undefined>,
  changes: Record<string, string | null>,
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(current)) {
    if (value) params.set(key, value);
  }
  for (const [key, value] of Object.entries(changes)) {
    if (value === null) params.delete(key);
    else params.set(key, value);
  }
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

export function periodLabel(from: string, to: string): string {
  const fmt = (iso: string) =>
    new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  return from === to ? fmt(from) : `${fmt(from)} – ${fmt(to)}`;
}

// ── tabs ─────────────────────────────────────────────────────────────────────

export const NETWORK_TABS = ["overview", "branches", "franchisees", "regions", "access", "data"] as const;
export type NetworkTab = (typeof NETWORK_TABS)[number];
export const NETWORK_TAB_LABELS: Record<NetworkTab, string> = {
  overview: "Overview",
  branches: "Branches",
  franchisees: "Franchisees",
  regions: "Regions",
  access: "Access",
  data: "Data",
};
/** Tabs only head office has. */
export const HQ_TABS: ReadonlySet<NetworkTab> = new Set(["access", "data"]);

export function normalizeNetworkTab(value: string | undefined | null): NetworkTab {
  return (NETWORK_TABS as readonly string[]).includes(value ?? "") ? (value as NetworkTab) : "overview";
}

export const OPERATIONS_TABS = ["speed", "dayparts", "channels"] as const;
export type OperationsTab = (typeof OPERATIONS_TABS)[number];
export const OPERATIONS_TAB_LABELS: Record<OperationsTab, string> = {
  speed: "Speed of service",
  dayparts: "Dayparts",
  channels: "Channels",
};

export function normalizeOperationsTab(value: string | undefined | null): OperationsTab {
  return (OPERATIONS_TABS as readonly string[]).includes(value ?? "") ? (value as OperationsTab) : "speed";
}

// ── labels ───────────────────────────────────────────────────────────────────

export const BRANCH_STATUS_LABELS: Record<BranchStatus, string> = {
  coming_soon: "Coming soon",
  open: "Open",
  temporarily_closed: "Temporarily closed",
  closed: "Closed",
};

export const CHANNEL_LABELS: Record<string, string> = {
  delivery: "Delivery",
  carryout: "Carryout",
  dine_in: "Dine-in",
  catering: "Catering",
};

export const SOURCE_LABELS: Record<string, string> = {
  phone: "Phone",
  web: "Web",
  app: "App",
  walk_in: "Walk-in",
  kiosk: "Kiosk",
  doordash: "DoorDash",
  ubereats: "Uber Eats",
  grubhub: "Grubhub",
  other: "Other",
};

export function labelOf(map: Record<string, string>, key: string): string {
  return map[key] ?? key.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

/** The quadrants in reading order: what to protect, fix, push, then cut. */
export const MENU_CLASSES: { key: MenuClass; label: string; short: string }[] = [
  { key: "star", label: "Stars", short: "Popular and profitable" },
  { key: "plowhorse", label: "Plowhorses", short: "Popular, thin margin" },
  { key: "puzzle", label: "Puzzles", short: "Profitable, few orders" },
  { key: "dog", label: "Dogs", short: "Few orders, thin margin" },
  { key: "no_cost", label: "Needs cost", short: "No recipe cost yet" },
];

export function menuClassLabel(key: MenuClass): string {
  return MENU_CLASSES.find((c) => c.key === key)?.label ?? key;
}

export function normalizeMenuClass(value: string | undefined | null): MenuClass | null {
  return MENU_CLASSES.some((c) => c.key === value) ? (value as MenuClass) : null;
}

// ── figures ──────────────────────────────────────────────────────────────────

/** A share (0.123) → "12.3%"; null → "—". */
export function share(value: number | null | undefined): string {
  return value == null ? "—" : formatPercent(value * 100);
}

export function money(value: number | null | undefined): string {
  return value == null ? "—" : formatCurrency(value);
}

export function minutes(value: number | null | undefined): string {
  return value == null ? "—" : `${formatNumber(Math.round(value))} min`;
}

export function count(value: number | null | undefined): string {
  return value == null ? "—" : formatNumber(value);
}

interface TileSpec {
  key: KpiKey;
  label: string;
  format: (value: number | null) => string;
  /** A rise is bad news. */
  invert: boolean;
  sub: string;
}

const TILE_SPECS: TileSpec[] = [
  { key: "net_sales", label: "Net sales", format: money, invert: false, sub: "after discounts" },
  { key: "transactions", label: "Transactions", format: count, invert: false, sub: "completed orders" },
  { key: "average_ticket", label: "Average ticket", format: money, invert: false, sub: "net per order" },
  { key: "guests", label: "Guests", format: count, invert: false, sub: "known guests who ordered" },
  { key: "labor_pct", label: "Labor", format: share, invert: true, sub: "of net sales" },
  { key: "food_cost_pct", label: "Food cost", format: share, invert: true, sub: "of net sales" },
  { key: "prime_cost_pct", label: "Prime cost", format: share, invert: true, sub: "food + labor" },
  { key: "on_time_rate", label: "On time", format: share, invert: false, sub: "deliveries in target" },
  { key: "third_party_share", label: "Third-party", format: share, invert: true, sub: "of net sales" },
  { key: "discount_rate", label: "Discounts", format: share, invert: true, sub: "of gross sales" },
];

/** Signed % change for `DeltaBadge` (12.5 = +12.5%); a share's change is in points' terms of
 * its own value, as the backend computes it. */
function deltaOf(kpi: Kpi | undefined): number | null {
  return kpi?.change == null ? null : kpi.change * 100;
}

export function overviewTiles(overview: NetworkOverview, compareLabel: string): StripTile[] {
  return TILE_SPECS.map((spec) => {
    const kpi = overview.kpis[spec.key];
    return {
      key: spec.key,
      label: spec.label,
      value: spec.format(kpi?.value ?? null),
      delta: deltaOf(kpi),
      invertDelta: spec.invert,
      sub: kpi?.previous == null ? spec.sub : `${spec.sub} · ${compareLabel}`,
      tone: "neutral",
    };
  });
}

/** 0–1 intensity of a heat cell against the grid's busiest cell. */
export function heat(value: number, max: number): number {
  if (max <= 0 || value <= 0) return 0;
  return Math.min(1, value / max);
}

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

// ── franchise roles ──────────────────────────────────────────────────────────

/** Mirrors backend `services/restaurant/roles.py` `HQ_ONLY`: never in a franchise role. */
export const HQ_ONLY_PERMISSIONS: ReadonlySet<Permission> = new Set<Permission>([
  "network.manage",
  "team.manage",
  "roles.manage",
  "billing.view",
  "billing.manage",
  "integrations.manage",
  "ai.manage",
  "settings.manage",
  "restaurant_data.manage",
  "audit.view",
]);

/** What a franchise role may be given, in the order the dialog lists it. */
export const FRANCHISE_ROLE_PERMISSIONS: Permission[] = [
  "network.view",
  "menu.view",
  "menu.manage",
  "royalties.view",
  "franchise_team.manage",
  "chat.use",
  "report_fte.view",
  "data.export",
];

/** "Whole network", a franchisee, or "N branches of <franchisee>". */
export function scopeLabel(
  franchiseeName: string | null,
  branchIds: number[] | null,
): string {
  if (franchiseeName == null) return "Whole network";
  if (branchIds == null) return franchiseeName;
  return `${branchIds.length} branch${branchIds.length === 1 ? "" : "es"} of ${franchiseeName}`;
}
