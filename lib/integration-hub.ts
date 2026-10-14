/**
 * The Integrations hub's logic (SPEC-328) — pure, so Vitest covers it.
 *
 * Adapters for backend SPEC-337's two reads, the status words and tones, the filters and
 * their order, the URL state of both pages, and the time formatting the timeline uses.
 * Components only draw what these return.
 */
import {
  APPS,
  AREAS,
  isIntegrationKey,
  type IntegrationApp,
  type IntegrationKey,
} from "@/lib/integration-catalog";
import { toHubOAuth } from "@/lib/klaviyo-connect";
import type {
  ActivityItem,
  HubAccount,
  HubAttention,
  HubConnection,
  HubOverview,
  HubStatus,
  RunOutcome,
  TestResult,
} from "@/types/integrations";

/* ── adapters ───────────────────────────────────────────────────────────── */

export interface ApiHubCompany {
  id: number;
  name: string;
  status: string;
  last_synced_at: string | null;
  last_error: string | null;
}

export interface ApiHubConnection {
  key: string;
  connected: boolean;
  available: boolean;
  status: HubStatus;
  attention: HubAttention | null;
  last_success_at: string | null;
  last_run_at: string | null;
  last_records: number | null;
  runs: RunOutcome[];
  errors_7d: number;
  can_sync: boolean;
  can_test: boolean;
  account: Record<string, unknown> | null;
  connected_at: string | null;
  connected_by: string | null;
  /** Klaviyo's (backend SPEC-379) or Gorgias's (SPEC-380) sign-in; absent from an older backend. */
  oauth?: unknown;
}

export interface ApiHubOverview {
  checked_at: string;
  summary: HubOverview["summary"];
  integrations: ApiHubConnection[];
}

export interface ApiActivityItem {
  at: string;
  key: string;
  type: "run" | "change";
  result: ActivityItem["result"];
  message: string;
  detail: string | null;
  records: number | null;
  duration_seconds: number | null;
  actor: string | null;
}

export interface ApiTestResult {
  ok: boolean | null;
  latency_ms?: number;
  code?: string;
  message?: string;
}

function str(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

export function toAccount(api: Record<string, unknown> | null): HubAccount | null {
  if (!api) return null;
  const companies = Array.isArray(api.companies)
    ? (api.companies as ApiHubCompany[]).map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        lastSyncedAt: c.last_synced_at,
        lastError: c.last_error,
      }))
    : undefined;
  return {
    shopDomain: str(api.shop_domain),
    scopes: str(api.scopes),
    email: str(api.email),
    propertyUrl: str(api.property_url),
    pageName: str(api.page_name),
    instagramUsername: str(api.instagram_username),
    instagramLinked: api.instagram_linked === true,
    tokenExpiresAt: str(api.token_expires_at),
    companies,
    adAccounts: Array.isArray(api.ad_accounts)
      ? (api.ad_accounts as { id: string; name: string }[]).map((a) => ({ id: a.id, name: a.name }))
      : undefined,
    availableAccounts: typeof api.available_accounts === "number" ? api.available_accounts : undefined,
  };
}

export function toConnection(api: ApiHubConnection): HubConnection {
  const oauth = toHubOAuth(api.oauth);
  return {
    key: api.key,
    connected: api.connected,
    available: api.available,
    status: api.status,
    attention: api.attention,
    lastSuccessAt: api.last_success_at,
    lastRunAt: api.last_run_at,
    lastRecords: api.last_records,
    runs: api.runs,
    errors7d: api.errors_7d,
    canSync: api.can_sync,
    canTest: api.can_test,
    account: toAccount(api.account),
    connectedAt: api.connected_at,
    connectedBy: api.connected_by,
    ...(oauth ? { oauth } : {}),
  };
}

export function toOverview(api: ApiHubOverview): HubOverview {
  return {
    checkedAt: api.checked_at,
    summary: api.summary,
    // Only the keys this build knows how to draw — a newer backend's extra key waits.
    integrations: api.integrations.filter((i) => isIntegrationKey(i.key)).map(toConnection),
  };
}

export function toActivity(api: ApiActivityItem[]): ActivityItem[] {
  return api.map((item) => ({
    at: item.at,
    key: item.key,
    type: item.type,
    result: item.result,
    message: item.message,
    detail: item.detail,
    records: item.records,
    durationSeconds: item.duration_seconds,
    actor: item.actor,
  }));
}

export function toTestResult(api: ApiTestResult): TestResult {
  return {
    ok: api.ok,
    latencyMs: api.latency_ms ?? null,
    code: api.code ?? null,
    message: api.message ?? null,
  };
}

/* ── status ─────────────────────────────────────────────────────────────── */

export type Tone = "success" | "warning" | "destructive" | "neutral" | "muted";

export const STATUS_META: Record<HubStatus, { label: string; tone: Tone }> = {
  healthy: { label: "Healthy", tone: "success" },
  syncing: { label: "Syncing", tone: "neutral" },
  pending: { label: "First sync pending", tone: "neutral" },
  warning: { label: "Check soon", tone: "warning" },
  attention: { label: "Needs attention", tone: "destructive" },
  not_connected: { label: "Not connected", tone: "muted" },
  unavailable: { label: "Not set up here", tone: "muted" },
};

const SEVERITY: Record<HubStatus, number> = {
  attention: 0,
  warning: 1,
  syncing: 2,
  pending: 3,
  healthy: 4,
  not_connected: 5,
  unavailable: 6,
};

export function needsOwner(connection: Pick<HubConnection, "status">): boolean {
  return connection.status === "attention" || connection.status === "warning";
}

/** The store first, then what needs the owner, then the rest — in catalogue order within each. */
export function sortConnections<T extends Pick<HubConnection, "key" | "status">>(list: T[]): T[] {
  const order = Object.keys(APPS);
  return [...list].sort(
    (a, b) =>
      Number(b.key === "shopify") - Number(a.key === "shopify") ||
      SEVERITY[a.status] - SEVERITY[b.status] ||
      order.indexOf(a.key) - order.indexOf(b.key),
  );
}

/* ── the hub's URL state ────────────────────────────────────────────────── */

export const HUB_TABS = ["connected", "browse", "activity", "included"] as const;
export type HubTab = (typeof HUB_TABS)[number];
export const HUB_FILTERS = ["all", "healthy", "syncing", "attention"] as const;
export type HubFilter = (typeof HUB_FILTERS)[number];
export const HUB_LAYOUTS = ["list", "cards", "areas"] as const;
export type HubLayout = (typeof HUB_LAYOUTS)[number];
export const DETAIL_TABS = ["overview", "settings", "history", "permissions"] as const;
export type DetailTab = (typeof DETAIL_TABS)[number];
export const BROWSE_CATEGORIES = ["all", ...Object.keys(AREAS), "soon"] as const;
export type BrowseCategory = (typeof BROWSE_CATEGORIES)[number];

function pick<T extends string>(allowed: readonly T[], value: string | null | undefined, fallback: T): T {
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

export const parseHubTab = (v: string | null | undefined): HubTab => pick(HUB_TABS, v, "connected");
export const parseFilter = (v: string | null | undefined): HubFilter => pick(HUB_FILTERS, v, "all");
export const parseLayout = (v: string | null | undefined): HubLayout => pick(HUB_LAYOUTS, v, "list");
export const parseCategory = (v: string | null | undefined): BrowseCategory =>
  pick(BROWSE_CATEGORIES, v, "all");

/** Coming back from a provider's sign-in opens the Settings tab, where its card says how it went. */
const RETURN_PARAMS = [
  "google",
  "meta",
  "ads",
  "connected",
  "qbo_error",
  "qbo_cancelled",
  // SPEC-371: the Klaviyo round trip and its install link.
  "klaviyo",
  "klaviyo_error",
  "connect",
  // SPEC-372: the Gorgias round trip and its install link (Gorgias adds `account`).
  "gorgias",
  "gorgias_error",
  "account",
];

export function parseDetailTab(params: URLSearchParams): DetailTab {
  const fallback = RETURN_PARAMS.some((p) => params.has(p)) ? "settings" : "overview";
  return pick(DETAIL_TABS, params.get("tab"), fallback);
}

export interface HubState {
  tab: HubTab;
  filter: HubFilter;
  view: HubLayout;
  category: BrowseCategory;
}

/** The hub's href for a state — defaults are left out so the plain URL stays plain. */
export function hubHref(state: Partial<HubState>): string {
  const query = new URLSearchParams();
  if (state.tab && state.tab !== "connected") query.set("tab", state.tab);
  if (state.filter && state.filter !== "all") query.set("filter", state.filter);
  if (state.view && state.view !== "list") query.set("view", state.view);
  if (state.category && state.category !== "all") query.set("category", state.category);
  const text = query.toString();
  return text ? `/integrations?${text}` : "/integrations";
}

export function detailHref(key: string, tab?: DetailTab, extra?: Record<string, string>): string {
  const query = new URLSearchParams();
  if (tab && tab !== "overview") query.set("tab", tab);
  for (const [name, value] of Object.entries(extra ?? {})) query.set(name, value);
  const text = query.toString();
  return text ? `/integrations/${key}?${text}` : `/integrations/${key}`;
}

/* ── filtering ──────────────────────────────────────────────────────────── */

export function matchesFilter(connection: Pick<HubConnection, "status">, filter: HubFilter): boolean {
  switch (filter) {
    case "all":
      return true;
    case "healthy":
      return connection.status === "healthy";
    case "syncing":
      return connection.status === "syncing" || connection.status === "pending";
    case "attention":
      return needsOwner(connection);
  }
}

export function filterCounts(list: Pick<HubConnection, "status">[]): Record<HubFilter, number> {
  return {
    all: list.length,
    healthy: list.filter((c) => matchesFilter(c, "healthy")).length,
    syncing: list.filter((c) => matchesFilter(c, "syncing")).length,
    attention: list.filter((c) => matchesFilter(c, "attention")).length,
  };
}

export function matchesQuery(app: IntegrationApp | { name: string; description: string }, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const parts = [app.name, app.description];
  if ("powers" in app) parts.push(app.sub, AREAS[app.area], ...app.powers.map((p) => p.label));
  return parts.join(" ").toLowerCase().includes(q);
}

/** The strip's segments as percentages of the connected apps, in drawing order. */
export function healthSegments(summary: HubOverview["summary"]): { tone: Tone; percent: number }[] {
  const total = summary.connected;
  if (!total) return [];
  const parts: [Tone, number][] = [
    ["success", summary.healthy],
    ["neutral", summary.syncing + summary.pending],
    ["warning", summary.warning],
    ["destructive", summary.attention],
  ];
  return parts
    .filter(([, n]) => n > 0)
    .map(([tone, n]) => ({ tone, percent: Math.round((n / total) * 1000) / 10 }));
}

/* ── the owner's next step ──────────────────────────────────────────────── */

export type NextStep =
  | { kind: "signin"; label: string }
  | { kind: "settings"; label: string }
  | { kind: "sync"; label: string };

export function nextStep(connection: Pick<HubConnection, "attention" | "canSync">): NextStep | null {
  const attention = connection.attention;
  if (!attention) return null;
  switch (attention.action) {
    case "reconnect":
      return { kind: "signin", label: "Reconnect" };
    case "renew":
      return { kind: "signin", label: "Renew login" };
    case "choose_property":
      return { kind: "settings", label: "Choose property" };
    case "open_settings":
      return { kind: "settings", label: "Open settings" };
    case "retry":
      return connection.canSync
        ? { kind: "sync", label: "Sync now" }
        : { kind: "settings", label: "Open settings" };
  }
}

/* ── time ───────────────────────────────────────────────────────────────── */

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function relativeTime(iso: string | null, now: Date): string {
  if (!iso) return "Never";
  const then = new Date(iso);
  const diff = now.getTime() - then.getTime();
  if (Number.isNaN(diff)) return "Never";
  if (diff < MINUTE) return "Just now";
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)} min ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)} h ago`;
  if (diff < 2 * DAY) return "Yesterday";
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)} days ago`;
  return then.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function clockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export function dayLabel(iso: string, now: Date): string {
  const days = Math.round((startOfDay(now) - startOfDay(new Date(iso))) / DAY);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return new Date(iso).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

export function groupByDay<T extends { at: string }>(items: T[], now: Date): { label: string; items: T[] }[] {
  const groups: { label: string; items: T[] }[] = [];
  for (const item of items) {
    const label = dayLabel(item.at, now);
    const last = groups.at(-1);
    if (last && last.label === label) last.items.push(item);
    else groups.push({ label, items: [item] });
  }
  return groups;
}

export function formatDuration(seconds: number | null): string {
  if (seconds === null) return "—";
  if (seconds < 60) return `${seconds.toFixed(seconds < 10 ? 1 : 0)} s`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes} min ${Math.round(seconds % 60)} s`;
}

/** Poll the overview while something is syncing, and not otherwise. */
export function overviewPollInterval(overview: HubOverview | undefined): number | false {
  return overview?.integrations.some((i) => i.status === "syncing") ? 5_000 : false;
}

/** The detail chart: the newest runs, oldest first, as bars. */
export function runBars(items: ActivityItem[], limit = 24): { at: string; records: number; result: RunOutcome }[] {
  return items
    .filter((i): i is ActivityItem & { result: RunOutcome } => i.type === "run" && i.result !== "change")
    .slice(0, limit)
    .reverse()
    .map((i) => ({ at: i.at, records: i.records ?? 0, result: i.result }));
}

export function appFor(key: string): IntegrationApp | null {
  return isIntegrationKey(key) ? APPS[key] : null;
}

export function keyOf(connection: HubConnection): IntegrationKey | null {
  return isIntegrationKey(connection.key) ? connection.key : null;
}

/** Events per page on the timeline (SPEC-328 patch, 2026-09-30). */
export const ACTIVITY_PAGE_SIZE = 25;

/** Pages for `total` events; at least 1. Pure. */
export function activityPages(total: number, pageSize = ACTIVITY_PAGE_SIZE): number {
  return Math.max(1, Math.ceil(Math.max(0, total) / pageSize));
}
