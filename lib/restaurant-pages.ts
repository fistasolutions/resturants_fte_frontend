/**
 * The restaurant pages' headers and tabs (frontend SPEC-377) — constants a server layout passes to
 * its client shell, so they live here and not in a `"use client"` file.
 */
import { BACK_OFFICE_TABS, BACK_OFFICE_TAB_LABELS } from "@/lib/back-office";
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
import { LOYALTY_HQ_TABS, LOYALTY_TAB_LABELS, LOYALTY_TABS } from "@/lib/loyalty";
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

export const LOYALTY_PAGE = {
  base: "/loyalty",
  title: "Loyalty & Gift Cards",
  description: "The brand's points program and its rewards, every member's points, the gift cards sold, and what each franchise holds for the others.",
  tabs: LOYALTY_TABS.map((key): PageTab => ({ key, label: LOYALTY_TAB_LABELS[key], hqOnly: LOYALTY_HQ_TABS.has(key) })),
  periodTabs: [] as string[],
} as const;

export const OPS_COACH_PAGE = {
  base: "/ops-coach",
  title: "Ops Coach",
  description: "Every morning, each branch's one thing to fix today — and the branches head office should call first.",
  periodTabs: [] as string[],
} as const;

export const REPUTATION_PAGE = {
  base: "/reputation",
  title: "Reputation Manager",
  description: "Every guest's rating of their order, what the ratings say branch by branch, and a reply to every unhappy guest.",
  periodTabs: [] as string[],
} as const;

export const MENU_ENGINEER_PAGE = {
  base: "/menu-engineer",
  title: "Menu Engineer",
  description: "The menu changes worth making — re-price, push, re-cost or retire — with what each is worth, one click to apply.",
  periodTabs: [] as string[],
} as const;

export const CATERING_PAGE = {
  base: "/catering",
  title: "Catering Desk",
  description: "Catering inquiries from your site, quotes priced from the branch's menu, followed to won or lost.",
  periodTabs: [] as string[],
} as const;

export const STANDARDS_PAGE = {
  base: "/standards",
  title: "Brand Standards",
  description: "QSC visits scored against the brand's checklist, the actions each failure creates, and the branches overdue a visit.",
  periodTabs: [] as string[],
} as const;

export const BACK_OFFICE_PAGE = {
  base: "/back-office",
  title: "Back Office",
  description: "Each branch's crew and time clock, the week's schedule against expected sales, and inventory counts with food cost against the recipes.",
  tabs: BACK_OFFICE_TABS.map((key): PageTab => ({ key, label: BACK_OFFICE_TAB_LABELS[key] })),
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
