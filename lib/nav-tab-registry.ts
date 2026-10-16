/**
 * Every page's tabs, for the sidebar preferences (SPEC-338). Each entry reads the same list its
 * tab bar draws, so a new tab appears here without another edit. Left out on purpose: Settings
 * (already role-gated), Integrations (its tabs filter one list), Docs (reference areas) and Brand
 * Brain's sub-tabs (a third level).
 */
import type { LucideIcon } from "lucide-react";

import { ADS_TAB_IDS, ADS_TAB_LABELS } from "@/lib/ads";
import { CI_TABS } from "@/lib/ci";
import { SUPPORT_TAB_IDS, SUPPORT_TAB_LABELS } from "@/lib/customer-support";
import { DATA_TAB_IDS, DATA_TAB_LABELS } from "@/lib/data-manager";
import { CUSTOMER_TABS } from "@/lib/customer-tabs";
import { DISCOUNT_TABS } from "@/lib/discount-tabs";
import { EMAIL_TAB_IDS, EMAIL_TAB_LABELS } from "@/lib/email-marketing";
import { FINANCE_TAB_IDS, financeTabLabel } from "@/lib/finance";
import { FORESIGHT_TABS } from "@/lib/foresight-tabs";
import { GORGIAS_TABS } from "@/lib/gorgias-tabs";
import { INVENTORY_TABS } from "@/lib/inventory-tabs";
import { LOCKED_PAGES, isPageShown, pageId, tabId } from "@/lib/nav-prefs";
import { LOYALTY_TAB_LABELS, LOYALTY_TABS } from "@/lib/loyalty";
import { POS_TAB_LABELS, POS_TABS } from "@/lib/restaurant-os";
import { ORDERS_TABS } from "@/lib/order-tabs";
import { PRODUCT_TABS } from "@/lib/product-tabs";
import { REPORT_FTE_TABS } from "@/lib/report-fte-tabs";
import {
  KITCHEN_TAB_LABELS,
  KITCHEN_TABS,
  MENU_TAB_LABELS,
  MENU_TABS,
  NETWORK_TAB_LABELS,
  NETWORK_TABS,
  OPERATIONS_TAB_LABELS,
  OPERATIONS_TABS,
} from "@/lib/restaurant";
import { RESULTS_TABS } from "@/lib/results-tabs";
import { RETURNS_TAB_IDS, RETURNS_TAB_LABELS } from "@/lib/returns-tabs";
import { SOCIAL_TAB_IDS, SOCIAL_TAB_LABELS } from "@/lib/social";
import { SPOTLIGHT_TAB_IDS, spotlightTabLabel } from "@/lib/spotlight";
import { SYSTEM_TABS } from "@/lib/system-tabs";
import { TRAFFIC_TABS } from "@/lib/traffic-tabs";

export interface NavTab {
  key: string;
  label: string;
}

const pick = (tabs: readonly NavTab[]): NavTab[] => tabs.map(({ key, label }) => ({ key, label }));

/** Page href → its tabs, in bar order. */
export const PAGE_TABS: Readonly<Record<string, readonly NavTab[]>> = {
  "/products": pick(PRODUCT_TABS),
  "/inventory": pick(INVENTORY_TABS),
  "/orders": pick(ORDERS_TABS),
  "/customers": pick(CUSTOMER_TABS),
  "/returns": RETURNS_TAB_IDS.map((key) => ({ key, label: RETURNS_TAB_LABELS[key] })),
  "/results": pick(RESULTS_TABS),
  "/team-performance": pick(GORGIAS_TABS),
  "/traffic": pick(TRAFFIC_TABS),
  "/foresight": pick(FORESIGHT_TABS),
  "/discounts": pick(DISCOUNT_TABS),
  "/system": pick(SYSTEM_TABS),
  "/ci": pick(CI_TABS),
  "/spotlight": SPOTLIGHT_TAB_IDS.map((key) => ({ key, label: spotlightTabLabel(key) })),
  "/social": SOCIAL_TAB_IDS.map((key) => ({ key, label: SOCIAL_TAB_LABELS[key] })),
  "/ads": ADS_TAB_IDS.map((key) => ({ key, label: ADS_TAB_LABELS[key] })),
  "/email-marketing": EMAIL_TAB_IDS.map((key) => ({ key, label: EMAIL_TAB_LABELS[key] })),
  "/customer-support": SUPPORT_TAB_IDS.map((key) => ({ key, label: SUPPORT_TAB_LABELS[key] })),
  "/data-manager": DATA_TAB_IDS.map((key) => ({ key, label: DATA_TAB_LABELS[key] })),
  "/report-fte": pick(REPORT_FTE_TABS),
  "/network": NETWORK_TABS.map((key) => ({ key, label: NETWORK_TAB_LABELS[key] })),
  "/menu": MENU_TABS.map((key) => ({ key, label: MENU_TAB_LABELS[key] })),
  "/kitchen": KITCHEN_TABS.map((key) => ({ key, label: KITCHEN_TAB_LABELS[key] })),
  "/pos": POS_TABS.map((key) => ({ key, label: POS_TAB_LABELS[key] })),
  "/loyalty": LOYALTY_TABS.map((key) => ({ key, label: LOYALTY_TAB_LABELS[key] })),
  // SPEC-385: the Ops Coach is one screen; listed so the hub's preferences cover every employee.
  "/ops-coach": [],
  // SPEC-390: the Reputation Manager is one screen.
  "/reputation": [],
  // SPEC-391: one screen each.
  "/menu-engineer": [],
  "/catering": [],
  // SPEC-392: one screen.
  "/standards": [],
  // SPEC-394: the back office's tabs are not hidden one by one (the preferences cookie's size).
  "/back-office": [],
  "/development": [],
  "/operations": OPERATIONS_TABS.map((key) => ({ key, label: OPERATIONS_TAB_LABELS[key] })),
  "/employees/finance": FINANCE_TAB_IDS.map((key) => ({ key, label: financeTabLabel(key) })),
};

export interface PrefsTab {
  id: string;
  label: string;
  /** The first tab: the page opens on it, so it is always shown. */
  locked: boolean;
  shown: boolean;
}

export interface PrefsNode {
  id: string;
  href: string;
  title: string;
  icon: LucideIcon;
  locked: boolean;
  shown: boolean;
  tabs: PrefsTab[];
  /** A hub's sub-pages (Digital Employees → the employees). */
  children: PrefsNode[];
}

interface Item {
  title: string;
  href: string;
  icon: LucideIcon;
}

/** SPEC-357: whether the guided view locks a page's tab (no data yet) — such a tab is not listed. */
export type TabLocked = (href: string, key: string) => boolean;

const NONE_LOCKED: TabLocked = () => false;

function node(item: Item, hidden: ReadonlySet<string>, children: PrefsNode[], tabLocked: TabLocked): PrefsNode {
  const withData = (PAGE_TABS[item.href] ?? []).filter((tab) => !tabLocked(item.href, tab.key));
  const tabs = withData.map((tab, index) => ({
    id: tabId(item.href, tab.key),
    label: tab.label,
    locked: index === 0,
    shown: index === 0 || !hidden.has(tabId(item.href, tab.key)),
  }));
  return {
    id: pageId(item.href),
    href: item.href,
    title: item.title,
    icon: item.icon,
    locked: LOCKED_PAGES.has(item.href),
    shown: isPageShown(item.href, hidden),
    tabs,
    children,
  };
}

/** What Settings → Sidebar lists: each sidebar row, its sub-pages, and every page's tabs that
 * has data (the first of those is the one locked on). */
export function navPrefsTree(
  items: readonly Item[],
  childrenOf: (href: string) => readonly Item[],
  hidden: ReadonlySet<string>,
  tabLocked: TabLocked = NONE_LOCKED,
): PrefsNode[] {
  return items.map((item) =>
    node(
      item,
      hidden,
      childrenOf(item.href).map((child) => node(child, hidden, [], tabLocked)),
      tabLocked,
    ),
  );
}

/** How many of a page's own switches (sub-pages and tabs, at any depth) are off. */
export function hiddenCount(node: PrefsNode): number {
  const tabs = node.tabs.filter((tab) => !tab.shown).length;
  return node.children.reduce((sum, child) => sum + (child.shown ? 0 : 1) + hiddenCount(child), tabs);
}
