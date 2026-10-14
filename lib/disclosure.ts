/**
 * Progressive disclosure (SPEC-315 over backend SPEC-319; the guided view, SPEC-357 over backend
 * SPEC-366) — pure. The workspace says, for every sidebar destination, whether the member may see
 * it and, if not, why and what would unlock it. The backend enforces every permission regardless;
 * this only decides what the app shows and what a locked screen says.
 */
import { pageKey } from "@/lib/first-sync";
import type { GuidedReason, Need, TabLock } from "@/lib/guided-view";
import { tabLabel } from "@/lib/guided-view";
import { hubChildren, navItems } from "@/lib/navigation";

export type HiddenReason = "permission" | "feature" | "calendar" | "not_connected" | GuidedReason;

export interface NavVisibility {
  key: string;
  visible: boolean;
  ready: boolean;
  reason: HiddenReason | null;
  /** SPEC-357: what would unlock the page (guided view only). */
  needs?: Need | null;
}

export type WorkspaceNavigation = NavVisibility[] | null;

function byKey(nav: NavVisibility[]): Map<string, NavVisibility> {
  return new Map(nav.map((item) => [item.key, item]));
}

/** Items to draw: those the workspace marks visible, and any it does not name. */
export function visibleItems<T extends { href: string }>(items: T[], nav: WorkspaceNavigation): T[] {
  if (nav === null) return items;
  const map = byKey(nav);
  return items.filter((item) => map.get(pageKey(item.href))?.visible ?? true);
}

/** The one thing a locked screen offers, besides going back. */
export interface AccessAction {
  label: string;
  href: string;
  /** SPEC-361: the app this action connects — Setup remembers the way back while it syncs. */
  integration?: string;
}

export interface Access {
  allowed: boolean;
  reason: HiddenReason | null;
  title: string;
  message: string;
  /** Offer Integrations: the page needs a connection and the member can open Integrations. */
  offerIntegrations: boolean;
  /** SPEC-357: the screen's single primary action, or null. */
  action: AccessAction | null;
  /** SPEC-361: a second app to connect, when the page reads two. */
  secondary?: AccessAction | null;
  /** The page or tab waits on a connection (the screen shows a plug, not a lock). */
  connect: boolean;
}

const ALLOWED: Access = {
  allowed: true,
  reason: null,
  title: "",
  message: "",
  offerIntegrations: false,
  action: null,
  connect: false,
};

/** Every titled destination, including those living under a hub's URL (Accounts Payable). */
const TITLED = [...navItems, ...hubChildren("/employees")];

/** The sidebar's own title for a page key (`returns` → "Returns Analytics"). */
export function pageName(key: string): string {
  const item = TITLED.find((nav) => pageKey(nav.href) === key);
  if (item) return item.title;
  const words = key.replace(/-/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * Each connection the guided view can wait on: the backend's key → the Integrations page's
 * catalogue key and name (`lib/integration-catalog.ts`, too large to load on every page; a test
 * pins these equal). Meta Ads has no catalogue card: it connects on Paid Ads → Audit.
 */
export const CONNECTIONS: Readonly<Record<string, { name: string; href: string }>> = {
  shopify: { name: "Shopify", href: "/integrations/shopify" },
  google: { name: "Google Search Console", href: "/integrations/gsc" },
  meta: { name: "Meta", href: "/integrations/meta" },
  meta_ads: { name: "Meta Ads", href: "/ads?tab=audit" },
  klaviyo: { name: "Klaviyo", href: "/integrations/klaviyo" },
  gorgias: { name: "Gorgias", href: "/integrations/gorgias" },
  loop: { name: "Loop Returns", href: "/integrations/loop" },
  ipacky: { name: "iPacky", href: "/integrations/ipacky" },
  vcount: { name: "V-Count", href: "/integrations/vcount" },
  clarity: { name: "Microsoft Clarity", href: "/integrations/clarity" },
  quickbooks: { name: "QuickBooks Online", href: "/integrations/quickbooks" },
};

/** The Integrations page's name for a backend connection key. */
export function integrationName(key: string): string {
  return CONNECTIONS[key]?.name ?? pageName(key);
}

/** "V-Count or Microsoft Clarity" — any one of these connects it. */
export function connectionsLabel(keys: readonly string[]): string {
  const names = keys.map(integrationName);
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} or ${names[names.length - 1]}`;
}

/** "V-Count and Microsoft Clarity" — every one of these is read (SPEC-369). */
export function appsLabel(keys: readonly string[]): string {
  const names = keys.map(integrationName);
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

function connectAction(key: string): AccessAction {
  return { label: `Connect ${integrationName(key)}`, href: integrationHref(key), integration: key };
}

/** Where a connection is made: its Integrations page (Meta Ads: Paid Ads → Audit). */
export function integrationHref(key: string): string {
  return CONNECTIONS[key]?.href ?? "/integrations";
}

interface Copy {
  title: string;
  message: string;
  action: AccessAction | null;
  /** SPEC-361: a second app to connect, when the page reads two. */
  secondary?: AccessAction | null;
  connect: boolean;
}

/**
 * What a guided page or tab says while it is locked, named `name` ("Fit", "Store Traffic").
 * `canConnect` is whether the member can open Integrations.
 */
export function lockCopy(name: string, reason: HiddenReason, needs: Need | null | undefined, canConnect: boolean): Copy {
  const connection = needs?.connection;
  if (connection && (reason === "not_connected" || reason === "no_data" || reason === "awaiting_connection")) {
    // SPEC-369: a page that reads several apps names each one and offers each one.
    const apps = needs?.apps?.length ? needs.apps : [connection];
    if (apps.length > 1) {
      return {
        title: `${name} is waiting for ${appsLabel(apps)}`,
        message: `Each of its tabs reads one of them. Connect them, and the tabs fill in as each one syncs.`,
        action: canConnect ? connectAction(apps[0]) : null,
        secondary: canConnect ? connectAction(apps[1]) : null,
        connect: true,
      };
    }
    const app = integrationName(apps[0]);
    return {
      title: `${name} opens once ${app} is connected`,
      message:
        reason === "awaiting_connection"
          ? `${name} is turned on for your company. It reads its data from ${app}: connect it and this page fills in.`
          : `It reads its data from ${app}. Connect it and ${name} appears here and in the sidebar.`,
      action: canConnect ? connectAction(apps[0]) : null,
      connect: true,
    };
  }
  if (reason === "needs_action" || (reason === "no_data" && needs?.action)) {
    return {
      title: `${name} appears after your first action`,
      message:
        "Send an action from the Morning Brief, such as a transfer, a win-back or an overdue chase, and its results are measured here.",
      action: { label: "Open the Morning Brief", href: "/brief" },
      connect: false,
    };
  }
  switch (reason) {
    case "needs_locations":
      return {
        title: `${name} appears once your store has a second location`,
        message: "It compares stock and sales between locations, so it needs at least two.",
        action: null,
        connect: false,
      };
    case "needs_pos":
      return {
        title: `${name} appears once you sell in store`,
        message: "It reads in-store sales rung up with Shopify POS, and your store has none yet.",
        action: null,
        connect: false,
      };
    case "needs_history":
      return {
        title: `${name} needs three years of sales history`,
        message: "It compares each season with the same season in earlier years, so it opens once your store has three years of orders.",
        action: null,
        connect: false,
      };
    case "calendar":
      return {
        title: `${name} reads the Hebrew calendar`,
        message: "It lines seasons up by the Hebrew calendar, which isn't switched on for your organization.",
        action: null,
        connect: false,
      };
    case "inactive_employee":
      return {
        title: `${name} isn't active`,
        message: "Switch it on from its card in Digital Employees and it joins your sidebar.",
        action: { label: "Open Digital Employees", href: "/employees" },
        connect: false,
      };
    case "turned_off":
      return {
        title: `${name} is turned off for your company`,
        message: "An owner or admin can turn it back on in Settings → Sidebar.",
        action: { label: "Open sidebar settings", href: "/settings/sidebar" },
        connect: false,
      };
    case "guided_hidden":
      return {
        title: `${name} is tucked away for now`,
        message: "Your workspace starts with what your store's data can fill. This one is for later.",
        action: null,
        connect: false,
      };
    default:
      return {
        title: `${name} has no data yet`,
        message: "It appears as soon as your store has data for it.",
        action: null,
        connect: false,
      };
  }
}

const GUIDED: ReadonlySet<string> = new Set<GuidedReason>([
  "needs_locations",
  "needs_pos",
  "needs_history",
  "needs_action",
  "guided_hidden",
  "inactive_employee",
  "no_data",
  "turned_off",
  "awaiting_connection",
]);

/** Whether the member may open the page at `pathname`, and what to say when not. */
export function accessFor(pathname: string, nav: WorkspaceNavigation): Access {
  if (nav === null) return ALLOWED;
  const map = byKey(nav);
  const key = pageKey(pathname);
  const item = map.get(key);
  // SPEC-368: a page turned on that waits for its connection is in the sidebar and opens on the
  // connect screen.
  if (item?.visible && item.reason === "awaiting_connection") {
    const canConnect = map.get("integrations")?.visible ?? false;
    const copy = lockCopy(pageName(key), item.reason, item.needs, canConnect);
    return { allowed: false, reason: item.reason, offerIntegrations: false, ...copy };
  }
  if (!item || item.visible) return ALLOWED;
  const name = pageName(key);
  const canConnect = map.get("integrations")?.visible ?? false;
  if (item.reason && (GUIDED.has(item.reason) || (item.reason === "not_connected" && item.needs?.connection))) {
    const copy = lockCopy(name, item.reason, item.needs, canConnect);
    return { allowed: false, reason: item.reason, offerIntegrations: false, ...copy };
  }
  switch (item.reason) {
    case "permission":
      return {
        allowed: false,
        reason: "permission",
        title: `${name} isn't in your role`,
        message: "An owner or admin of your organization can give you access.",
        offerIntegrations: false,
        action: null,
        connect: false,
      };
    case "not_connected":
      return {
        allowed: false,
        reason: "not_connected",
        title: `${name} opens once its data is connected`,
        message: "Connect the system this page reads from, and it appears here and in the sidebar.",
        offerIntegrations: canConnect,
        action: canConnect ? { label: "Open Integrations", href: "/integrations" } : null,
        connect: true,
      };
    default:
      return {
        allowed: false,
        reason: item.reason,
        title: "This page isn't part of your workspace",
        message: "It isn't switched on for your organization.",
        offerIntegrations: false,
        action: null,
        connect: false,
      };
  }
}

/** What a locked tab named in the URL says (SPEC-357), with the way back to its page. */
export function tabLockAccess(
  page: string,
  tab: string,
  lock: TabLock,
  nav: WorkspaceNavigation,
): Access & { back: AccessAction } {
  const canConnect = nav === null ? true : (byKey(nav).get("integrations")?.visible ?? true);
  const copy = lockCopy(tabLabel(page, tab), lock.reason, lock.needs, canConnect);
  return {
    allowed: false,
    reason: lock.reason,
    offerIntegrations: false,
    ...copy,
    back: { label: `Back to ${pageName(page)}`, href: `/${page}` },
  };
}
