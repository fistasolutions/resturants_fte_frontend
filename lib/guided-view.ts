/**
 * The guided view (SPEC-357 over backend SPEC-366) — pure. The workspace's `visibility` block
 * says, for a guided organization, which pages and tabs have data and what would unlock the rest.
 * This module adapts it, finds the tab a URL opens, picks the tab a page should open on, and
 * filters a tab bar. A `full` organization (FOC, root Rule 12) has no locked tabs, so every
 * helper here returns exactly what it was given.
 */
import { pageKey } from "@/lib/first-sync";

/** Why a guided page or tab is hidden (backend `capabilities.py`). */
export type GuidedReason =
  | "not_connected"
  | "needs_locations"
  | "needs_pos"
  | "needs_history"
  | "needs_action"
  | "calendar"
  | "guided_hidden"
  | "inactive_employee"
  | "no_data"
  /** SPEC-368: the company turned it off. */
  | "turned_off"
  /** SPEC-368: turned on and waiting for its connection — shown, opening on the connect screen. */
  | "awaiting_connection";

export const AWAITING: GuidedReason = "awaiting_connection";

/** What would unlock a page or tab; the backend sets one field. */
export interface Need {
  connection?: string;
  /** Any one of these shows the page (navigation's gate). */
  any_of?: string[];
  /** SPEC-369: every app the page's content reads — Store Traffic: V-Count, then Clarity. */
  apps?: string[];
  locations?: number;
  pos?: boolean;
  history_days?: number;
  calendar?: string;
  action?: string;
  employee?: string;
}

export interface PageVisibility {
  visible: boolean;
  reason: string | null;
  needs: Need | null;
}

export interface TabLock {
  reason: GuidedReason;
  needs: Need | null;
}

export interface EmployeeState {
  key: string;
  active: boolean;
  needs: string[];
  ready: boolean;
}

/** What a setup step is for: an employee, a page, or one tab of a page. */
export type SetupFor =
  | { kind: "employee"; key: string }
  | { kind: "page"; key: string }
  | { kind: "tab"; page: string; tab: string };

/** One step of the setup checklist (backend SPEC-368): connect one of `any_of`. */
export interface SetupStep {
  integration: string;
  any_of: string[];
  for: SetupFor[];
  done: boolean;
}

export interface Visibility {
  disclosure: "guided" | "full";
  pages: Record<string, PageVisibility>;
  tabs: Record<string, Record<string, TabLock>>;
  employees: EmployeeState[];
  setup: SetupStep[];
  integrationsShown: string[];
}

export interface ApiVisibility {
  disclosure?: string;
  pages?: Record<string, Partial<PageVisibility>>;
  tabs?: Record<string, Record<string, Partial<TabLock>>>;
  employees?: EmployeeState[];
  setup?: SetupStep[];
  integrations_shown?: string[];
}

const NO_LOCKS: Readonly<Record<string, TabLock>> = Object.freeze({});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toNeed(value: unknown): Need | null {
  return isRecord(value) ? (value as Need) : null;
}

/** The `visibility` block, or null when it is missing or malformed (null changes nothing). */
export function toVisibility(api: ApiVisibility | null | undefined): Visibility | null {
  if (!isRecord(api) || !isRecord(api.pages)) return null;
  const pages: Record<string, PageVisibility> = {};
  for (const [key, page] of Object.entries(api.pages)) {
    if (!isRecord(page) || typeof page.visible !== "boolean") continue;
    pages[key] = {
      visible: page.visible,
      reason: typeof page.reason === "string" ? page.reason : null,
      needs: toNeed(page.needs),
    };
  }
  const tabs: Record<string, Record<string, TabLock>> = {};
  for (const [page, locks] of Object.entries(isRecord(api.tabs) ? api.tabs : {})) {
    if (!isRecord(locks)) continue;
    const out: Record<string, TabLock> = {};
    for (const [tab, lock] of Object.entries(locks)) {
      if (isRecord(lock) && typeof lock.reason === "string") {
        out[tab] = { reason: lock.reason as GuidedReason, needs: toNeed(lock.needs) };
      }
    }
    if (Object.keys(out).length > 0) tabs[page] = out;
  }
  return {
    disclosure: api.disclosure === "full" ? "full" : "guided",
    pages,
    tabs,
    employees: Array.isArray(api.employees) ? api.employees : [],
    setup: Array.isArray(api.setup) ? api.setup : [],
    integrationsShown: Array.isArray(api.integrations_shown) ? api.integrations_shown : [],
  };
}

/** The locked tabs of the page at `href` — empty for a full organization or an unread one. */
export function lockedTabs(
  visibility: Visibility | null,
  href: string,
): Readonly<Record<string, TabLock>> {
  return visibility?.tabs[pageKey(href)] ?? NO_LOCKS;
}

/** A tab bar without its locked tabs. The open tab is always kept, so a link never lands under
 * a missing highlight (the access gate answers it instead), and so is a tab the company turned
 * on that waits for its connection (SPEC-368) — it opens on the connect screen. */
export function guidedTabs<T>(
  tabs: readonly T[],
  keyOf: (tab: T) => string,
  locked: Readonly<Record<string, TabLock>>,
  activeKey: string | null,
): T[] {
  if (Object.keys(locked).length === 0) return [...tabs];
  return tabs.filter((tab) => {
    const key = keyOf(tab);
    return key === activeKey || !(key in locked) || locked[key].reason === AWAITING;
  });
}

interface TabRoute {
  /** The page's root route. */
  root: string;
  /** `query`: `?tab=<key>`; `path`: `<root>/<key>` (the first tab is the root itself). */
  form: "query" | "path";
  tabs: readonly { key: string; label: string }[];
  /** SPEC-365: sub-pages of a `query` page that belong to one of its tabs — a direct link to
   * one goes through that tab's gate (`/returns/style/12` is By Style's). */
  subRoutes?: Readonly<Record<string, string>>;
}

type Pairs = readonly (readonly [key: string, label: string])[];

const route = (root: string, form: TabRoute["form"], pairs: Pairs): TabRoute => ({
  root,
  form,
  tabs: pairs.map(([key, label]) => ({ key, label })),
});

/**
 * The pages whose tabs can be locked and are named in the URL, in each page's own bar order and
 * URL form. Results is left out: it picks its tab in component state, so no URL names one.
 *
 * The lists are copied here, not imported, because the sidebar and the access gate load this
 * module on every page and the pages' own modules are large (Spotlight, Email Marketing and
 * Customer Support are ~1,000 lines each). `tests/guided-view.test.ts` pins every list equal to
 * its page's own, so a new or renamed tab fails the build until it is copied here too.
 */
export const TAB_ROUTES: Readonly<Record<string, TabRoute>> = {
  products: route("/products", "path", [
    ["overview", "Overview"],
    ["catalog", "Catalog"],
    ["returns", "Return Leak"],
    ["fit", "Fit"],
    ["true-profit", "True Profit"],
    ["content-gaps", "Content Gaps"],
    ["bundles", "Bundles"],
    ["brands", "Brands"],
    ["costs", "Costs"],
  ]),
  inventory: route("/inventory", "path", [
    ["overview", "Overview"],
    ["reorder", "Reorder"],
    ["overstock-movers", "Overstock & Movers"],
    ["transfers", "Warehouse → Store"],
    ["dead-stock", "Dead Stock"],
    ["by-location", "By Location"],
    ["buy-plan", "Buy Plan"],
    ["cash-release", "Cash Release"],
    ["allocation", "Allocation"],
    ["data-trust", "Data Trust"],
  ]),
  traffic: route("/traffic", "path", [
    ["overview", "Overview"],
    ["stores", "Store League"],
    ["opportunity", "Lost-Sales"],
    ["hours", "Peak Hours"],
    ["staffing", "Staffing"],
    ["website", "Website"],
  ]),
  foresight: route("/foresight", "path", [
    ["profit", "Profit Lens"],
    ["season", "Season Radar"],
    ["forecast", "Forecast & Pace"],
    ["sizes", "Size Intelligence"],
    ["stockout", "Stockout Risk"],
    ["launch", "Launch Watch"],
  ]),
  discounts: route("/discounts", "path", [
    ["overview", "Overview"],
    ["attention", "Needs attention"],
    ["staff", "Staff"],
    ["reasons", "Reasons"],
    ["cannibalisation", "Cannibalisation"],
    ["decisions", "Decisions"],
  ]),
  returns: {
    ...route("/returns", "query", [
      ["overview", "Overview"],
      ["by-style", "By Style"],
      ["sizing", "Sizing"],
      ["categories", "Categories"],
      ["fixes", "Product Fixes"],
      ["bracketing", "Bracketing"],
    ]),
    // SPEC-365: a style's page and the backlog send are Loop's, like the tabs they open from.
    subRoutes: { style: "by-style", backlog: "overview" },
  },
  spotlight: route("/spotlight", "query", [
    ["overview", "Overview"],
    ["chat", "Chat"],
    ["brand-brain", "Brand Brain"],
    ["inbound", "Inbound Engine"],
    ["daily-picks", "Daily Picks"],
    ["approvals", "Needs review"],
    ["published", "Published"],
    ["money-pages", "Money pages"],
    ["visibility", "Visibility"],
  ]),
  ads: route("/ads", "query", [
    ["overview", "Overview"],
    ["audit", "Audit"],
    ["campaigns", "Campaigns"],
    ["creative", "Creative"],
    ["spend-gates", "Spend Gates"],
    ["accountability", "Accountability"],
  ]),
  "email-marketing": route("/email-marketing", "query", [
    ["overview", "Overview"],
    ["plan", "Plan"],
    ["campaigns", "Campaigns"],
    ["flows", "Flows"],
    ["audiences", "Audiences"],
    ["content", "Content"],
    ["approvals", "Approvals"],
    ["performance", "Performance"],
    ["deliverability", "Deliverability"],
    ["chat", "Chat"],
    ["settings", "Settings"],
  ]),
  "customer-support": route("/customer-support", "query", [
    ["overview", "Overview"],
    ["inbox", "Inbox"],
    ["approvals", "Approvals"],
    ["topics", "Topics & playbooks"],
    ["knowledge", "Knowledge"],
    ["insights", "Insights"],
    ["performance", "Performance"],
    ["chat", "Chat"],
    ["settings", "Settings"],
  ]),
};

/** A tab's label on its page, or the key when the page is not in `TAB_ROUTES`. */
export function tabLabel(page: string, key: string): string {
  return TAB_ROUTES[page]?.tabs.find((tab) => tab.key === key)?.label ?? key;
}

function stripSlash(path: string): string {
  return path.length > 1 ? path.replace(/\/+$/, "") : path;
}

export interface TabInUrl {
  page: string;
  tab: string;
  /** False when the URL is the bare page, which opens on its first tab. */
  explicit: boolean;
}

/** The tab a URL opens, for the pages in `TAB_ROUTES`; null for any other URL (a detail page, a
 * review flow of an unlisted section, another route). */
export function tabInUrl(pathname: string, search: URLSearchParams): TabInUrl | null {
  const page = pageKey(pathname);
  const route = TAB_ROUTES[page];
  if (!route) return null;
  const path = stripSlash(pathname.split("?")[0]);
  const keys = route.tabs.map((tab) => tab.key);
  if (route.form === "query") {
    if (path !== route.root) {
      const segment = path.slice(route.root.length + 1).split("/")[0];
      const owner = path.startsWith(`${route.root}/`) ? route.subRoutes?.[segment] : undefined;
      return owner ? { page, tab: owner, explicit: true } : null;
    }
    const tab = search.get("tab");
    if (tab && keys.includes(tab)) return { page, tab, explicit: true };
    return { page, tab: keys[0], explicit: false };
  }
  if (path === route.root) return { page, tab: keys[0], explicit: false };
  const segment = path.slice(route.root.length + 1).split("/")[0];
  return keys.includes(segment) ? { page, tab: segment, explicit: true } : null;
}

/** The URL of one tab of a page, keeping the other query parameters (the date range). */
export function tabHref(page: string, key: string, search?: URLSearchParams): string {
  const route = TAB_ROUTES[page];
  if (!route) return `/${page}`;
  const params = new URLSearchParams(search);
  if (route.form === "query") {
    params.set("tab", key);
    return `${route.root}?${params.toString()}`;
  }
  params.delete("tab");
  const path = key === route.tabs[0].key ? route.root : `${route.root}/${key}`;
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

/** The first tab of a page that is not locked, or null when the page has no locked tabs (or
 * every tab is locked — the page itself is then hidden). */
export function firstOpenTab(visibility: Visibility | null, page: string): string | null {
  const route = TAB_ROUTES[page];
  const locked = visibility?.tabs[page];
  if (!route || !locked) return null;
  return route.tabs.find((tab) => !(tab.key in locked))?.key ?? null;
}

/** Where a sidebar link to `href` should go: the page itself, unless the tab it opens on is
 * locked — then its first tab with data. */
export function landingHref(href: string, visibility: Visibility | null): string {
  const page = pageKey(href);
  const route = TAB_ROUTES[page];
  if (!route || stripSlash(href) !== route.root) return href;
  const first = route.tabs[0].key;
  if (!visibility?.tabs[page]?.[first]) return href;
  const open = firstOpenTab(visibility, page);
  return open ? tabHref(page, open) : href;
}

export type TabAccess =
  | { kind: "open" }
  | { kind: "redirect"; href: string }
  | { kind: "locked"; page: string; tab: string; lock: TabLock };

/**
 * What to do with the URL's tab: open it; replace a bare page whose opening tab is locked with
 * its first tab with data; or answer a locked tab named in the URL with its reason.
 */
export function tabAccess(
  pathname: string,
  search: URLSearchParams,
  visibility: Visibility | null,
): TabAccess {
  if (!visibility) return { kind: "open" };
  const inUrl = tabInUrl(pathname, search);
  if (!inUrl) return { kind: "open" };
  const lock = visibility.tabs[inUrl.page]?.[inUrl.tab];
  if (!lock) return { kind: "open" };
  if (!inUrl.explicit) {
    const open = firstOpenTab(visibility, inUrl.page);
    if (open) return { kind: "redirect", href: tabHref(inUrl.page, open, search) };
  }
  return { kind: "locked", page: inUrl.page, tab: inUrl.tab, lock };
}
