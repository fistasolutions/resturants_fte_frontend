/**
 * The restaurant pages' headers and tabs (frontend SPEC-377) — constants a server layout passes to
 * its client shell, so they live here and not in a `"use client"` file.
 */
import { NETWORK_TAB_LABELS, NETWORK_TABS, OPERATIONS_TAB_LABELS, OPERATIONS_TABS, HQ_TABS } from "@/lib/restaurant";

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
  title: "Menu Engineering",
  description:
    "Which items earn their place on the menu: popularity against contribution margin, from what your branches actually sold and what each recipe costs.",
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
  description: "What each franchisee owes in royalty and ad fund for the period, from their branches' net sales.",
} as const;
