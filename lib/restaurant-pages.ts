/**
 * The restaurant pages' headers and tabs (frontend SPEC-377) — constants a server layout passes to
 * its client shell, so they live here and not in a `"use client"` file.
 */
import {
  HQ_TABS,
  KITCHEN_TAB_LABELS,
  KITCHEN_TABS,
  MENU_TAB_LABELS,
  MENU_TABS,
  NETWORK_TAB_LABELS,
  NETWORK_TABS,
  OPERATIONS_TAB_LABELS,
  OPERATIONS_TABS,
  ROYALTY_TAB_LABELS,
  ROYALTY_TABS,
} from "@/lib/restaurant";
import { POS_TAB_LABELS, POS_TABS } from "@/lib/restaurant-os";

export interface PageTab {
  key: string;
  label: string;
  hqOnly?: boolean;
}

export const NETWORK_PAGE = {
  base: "/network",
  title: "Network",
  description:
    "Every branch and every franchise in one place: how the network is trading, the branch league, the franchisees, who sees what, and the data your POS sends.",
  tabs: NETWORK_TABS.map((key): PageTab => ({ key, label: NETWORK_TAB_LABELS[key], hqOnly: HQ_TABS.has(key) })),
  periodTabs: ["overview", "branches"],
} as const;

export const MENU_PAGE = {
  base: "/menu",
  title: "Menu",
  description:
    "The brand's menu: which items earn their place, the catalog every branch sells from, the offers, and each branch's prices and what it has run out of.",
  tabs: MENU_TABS.map((key): PageTab => ({ key, label: MENU_TAB_LABELS[key] })),
  periodTabs: ["engineering"],
} as const;

export const POS_PAGE = {
  base: "/pos",
  title: "Order Taking",
  description: "Take counter and phone orders: caller ID, the menu with the pizza builder, coupons, cash or card — and the day's orders to settle and refund.",
  tabs: POS_TABS.map((key): PageTab => ({ key, label: POS_TAB_LABELS[key] })),
  periodTabs: [] as string[],
} as const;

export const CASH_PAGE = {
  base: "/cash",
  title: "Cash & Day Close",
  description: "The branch's drawer: open with a float, record paid-ins, paid-outs and drops, count and close the day — and the day's report.",
  periodTabs: [] as string[],
} as const;

export const KITCHEN_PAGE = {
  base: "/kitchen",
  title: "Kitchen & Dispatch",
  description: "Every open order of the branch as a ticket: make it, bake it, send it out, and know who is on the road.",
  tabs: KITCHEN_TABS.map((key): PageTab => ({ key, label: KITCHEN_TAB_LABELS[key] })),
  periodTabs: [] as string[],
} as const;

export const OPERATIONS_PAGE = {
  base: "/operations",
  title: "Operations",
  description: "How fast orders reach guests, when they order, and through which channels.",
  tabs: OPERATIONS_TABS.map((key): PageTab => ({ key, label: OPERATIONS_TAB_LABELS[key] })),
} as const;

export const GUESTS_PAGE = {
  base: "/guests",
  title: "Guests",
  description: "Who orders, who comes back, who has gone quiet — and your most valuable guests.",
} as const;

export const ROYALTIES_PAGE = {
  base: "/royalties",
  title: "Royalties",
  description: "What each franchisee owes in royalty and ad fund, on the brand's gross-sales basis — and the weekly statements that bill it.",
  tabs: ROYALTY_TABS.map((key): PageTab => ({ key, label: ROYALTY_TAB_LABELS[key] })),
  periodTabs: ["period"],
} as const;
