/**
 * Ask Glisp panel logic (SPEC-235): which grounded prompts to offer on which
 * route, where the drawer must not appear, and the keyboard shortcut.
 *
 * Every label below names something the analyst has a backend tool for
 * (`app/services/ai/tools.py`, `integration_tools.py`) — a prompt the agent
 * cannot answer from a tool would train the reader to distrust the panel.
 * Routes with no analyst tool of their own fall back to the `/chat` starters.
 */

import type { SubjectKind } from "@/lib/chat-context";

/** Icon keys the drawer maps to Lucide glyphs — kept as strings so this
 * module stays pure and Vitest-testable in node. */
export type DrawerPromptIcon =
  | "revenue"
  | "compare"
  | "products"
  | "customers"
  | "inventory"
  | "orders"
  | "discounts"
  | "returns"
  | "support"
  | "warehouse"
  | "traffic"
  | "search"
  | "tax"
  | "report"
  | "margin"
  | "location";

export interface DrawerPrompt {
  id: string;
  label: string;
  icon: DrawerPromptIcon;
}

/** The `/chat` starters — the fallback for routes the analyst has no tool for. */
export const DEFAULT_DRAWER_PROMPTS: readonly DrawerPrompt[] = [
  { id: "revenue", label: "How is revenue this week?", icon: "revenue" },
  { id: "products", label: "What are my best-selling products?", icon: "products" },
  { id: "customers", label: "New vs returning customers this month?", icon: "customers" },
  { id: "inventory", label: "Anything low on stock?", icon: "inventory" },
];

/** Keyed by the route's first segment. */
export const DRAWER_PROMPTS_BY_ROUTE: Readonly<Record<string, readonly DrawerPrompt[]>> = {
  dashboard: [
    { id: "dash-compare", label: "How is revenue tracking this week vs last week?", icon: "compare" },
    { id: "dash-channel", label: "Which channel is driving sales right now?", icon: "location" },
    { id: "dash-products", label: "What are my best-selling products this week?", icon: "products" },
    { id: "dash-stock", label: "Anything low on stock?", icon: "inventory" },
  ],
  brief: [
    { id: "brief-risk", label: "Which VIP customers are at risk of going dormant?", icon: "customers" },
    { id: "brief-restock", label: "What should I reorder first?", icon: "inventory" },
    { id: "brief-unfulfilled", label: "Which orders are still unfulfilled?", icon: "orders" },
    { id: "brief-yesterday", label: "How did we do yesterday?", icon: "report" },
  ],
  reports: [
    { id: "reports-yesterday", label: "Summarise yesterday's report for me", icon: "report" },
    { id: "reports-compare", label: "How did revenue compare to the previous period?", icon: "compare" },
    { id: "reports-products", label: "What were the top products yesterday?", icon: "products" },
    { id: "reports-alerts", label: "Any inventory alerts I should act on?", icon: "inventory" },
  ],
  products: [
    { id: "products-top", label: "What are my best-selling products this month?", icon: "products" },
    { id: "products-margin", label: "Which products have the highest margin?", icon: "margin" },
    { id: "products-worst", label: "What is selling worst right now?", icon: "compare" },
    { id: "products-together", label: "Which products get bought together?", icon: "orders" },
  ],
  inventory: [
    { id: "inventory-low", label: "Anything low on stock?", icon: "inventory" },
    { id: "inventory-dead", label: "Which products are dead stock?", icon: "inventory" },
    { id: "inventory-cover", label: "How many days of cover do my top sellers have?", icon: "compare" },
    { id: "inventory-reorder", label: "What should I reorder first?", icon: "orders" },
  ],
  orders: [
    { id: "orders-unfulfilled", label: "Which orders are still unfulfilled?", icon: "orders" },
    { id: "orders-aov", label: "What is my average order value this month?", icon: "revenue" },
    { id: "orders-today", label: "How many orders came in today?", icon: "orders" },
    { id: "orders-location", label: "Which location took the most orders this week?", icon: "location" },
  ],
  customers: [
    { id: "customers-split", label: "New vs returning customers this month?", icon: "customers" },
    { id: "customers-top", label: "Who are my top customers this year?", icon: "customers" },
    { id: "customers-dormant", label: "Which VIPs haven't bought in 60 days?", icon: "compare" },
    { id: "customers-cohorts", label: "How are my customer cohorts retaining?", icon: "report" },
  ],
  discounts: [
    { id: "discounts-revenue", label: "How much revenue went to discounts this month?", icon: "discounts" },
    { id: "discounts-codes", label: "Which discount codes drive the most sales?", icon: "discounts" },
    { id: "discounts-products", label: "Which products are being discounted most?", icon: "products" },
    { id: "discounts-markdown", label: "What is in the markdown overview?", icon: "margin" },
  ],
  returns: [
    { id: "returns-reasons", label: "Why are customers returning items this month?", icon: "returns" },
    { id: "returns-products", label: "Which products get returned most?", icon: "products" },
    { id: "returns-backlog", label: "How big is the returns backlog right now?", icon: "returns" },
    { id: "returns-refunds", label: "How much was refunded this month?", icon: "revenue" },
  ],
  warehouse: [
    { id: "warehouse-backlog", label: "Which orders are still unfulfilled?", icon: "orders" },
    { id: "warehouse-old", label: "Which orders are over 48 hours old and unshipped?", icon: "warehouse" },
    { id: "warehouse-packers", label: "How is packing performance this week?", icon: "warehouse" },
    { id: "warehouse-today", label: "How many orders came in today?", icon: "orders" },
  ],
  traffic: [
    { id: "traffic-footfall", label: "How is store footfall this week?", icon: "traffic" },
    { id: "traffic-conversion", label: "Which store converts footfall best?", icon: "location" },
    { id: "traffic-peak", label: "When are my peak hours?", icon: "compare" },
    { id: "traffic-friction", label: "Where are visitors hitting friction on the website?", icon: "search" },
  ],
  foresight: [
    { id: "foresight-runout", label: "Which products will run out soonest?", icon: "inventory" },
    { id: "foresight-reorder", label: "What should I reorder first?", icon: "orders" },
    { id: "foresight-profit", label: "Which location is most profitable?", icon: "location" },
    { id: "foresight-sellthrough", label: "Which products are selling through fastest?", icon: "compare" },
  ],
  // SPEC-346: Glisp's own Gorgias tools answer these on the Customer Support Agent's page.
  "customer-support": [
    { id: "cs-volume", label: "How is support ticket volume this week?", icon: "support" },
    { id: "cs-themes", label: "What are customers contacting us about?", icon: "support" },
    { id: "cs-response", label: "How fast is our first response time?", icon: "compare" },
    { id: "cs-returns", label: "Which products are returned most, and why?", icon: "returns" },
  ],
  "team-performance": [
    { id: "support-volume", label: "How is support ticket volume this week?", icon: "support" },
    { id: "support-agents", label: "Which support agent is resolving fastest?", icon: "customers" },
    { id: "support-themes", label: "What are customers contacting us about?", icon: "support" },
    { id: "support-response", label: "How fast is our first response time?", icon: "compare" },
  ],
  spotlight: [
    { id: "spotlight-visibility", label: "How is our search visibility trending?", icon: "search" },
    { id: "spotlight-queries", label: "Which search queries bring the most clicks?", icon: "search" },
    { id: "spotlight-behaviour", label: "Which pages are visitors engaging with most?", icon: "traffic" },
    { id: "spotlight-products", label: "What are my best-selling products this month?", icon: "products" },
  ],
  "tax-reports": [
    { id: "tax-summary", label: "What is my tax summary for the last 30 days?", icon: "tax" },
    { id: "tax-filing", label: "What is the filing status this period?", icon: "tax" },
    { id: "tax-revenue", label: "How is revenue this month?", icon: "revenue" },
    { id: "tax-refunds", label: "How much was refunded this month?", icon: "returns" },
  ],
};

/** Prompts for the current route; nested routes resolve by first segment. */
export function promptsForPath(pathname: string): readonly DrawerPrompt[] {
  const segment = pathname.split("/").filter(Boolean)[0] ?? "dashboard";
  return DRAWER_PROMPTS_BY_ROUTE[segment] ?? DEFAULT_DRAWER_PROMPTS;
}

/**
 * Prompts for a page that is about one thing (SPEC-236). "This product" is
 * resolved by the page context the drawer sends with the question, so the
 * labels never need the name.
 */
export const DRAWER_PROMPTS_BY_SUBJECT: Readonly<Record<SubjectKind, readonly DrawerPrompt[]>> = {
  product: [
    { id: "subject-product-sales", label: "How is this product selling this month?", icon: "products" },
    { id: "subject-product-margin", label: "What is this product's margin and markdown?", icon: "margin" },
    { id: "subject-product-sizes", label: "Which sizes and colours of this product sell best?", icon: "compare" },
    { id: "subject-product-returns", label: "How often is this product returned, and why?", icon: "returns" },
  ],
  order: [
    { id: "subject-order-status", label: "Has this order shipped yet?", icon: "orders" },
    { id: "subject-order-customer", label: "Who placed this order and how often do they buy?", icon: "customers" },
    { id: "subject-order-discount", label: "Was this order discounted, and by how much?", icon: "discounts" },
    { id: "subject-order-similar", label: "How many orders came in on the day of this order?", icon: "compare" },
  ],
  location: [
    { id: "subject-location-revenue", label: "How is this store doing this week?", icon: "location" },
    { id: "subject-location-conversion", label: "How is this store converting footfall?", icon: "traffic" },
    { id: "subject-location-unfulfilled", label: "Which orders are still unfulfilled at this store?", icon: "orders" },
    { id: "subject-location-stock", label: "What is low on stock at this store?", icon: "inventory" },
  ],
};

/** Subject set when the page is about one thing, else the route set, else the starters. */
export function promptsFor(
  pathname: string,
  subject: SubjectKind | null,
): readonly DrawerPrompt[] {
  if (subject) return DRAWER_PROMPTS_BY_SUBJECT[subject];
  return promptsForPath(pathname);
}

/** A chat workspace — a page whose whole job is a conversation, so the floating
 * launcher must not sit on top of it: Glisp's own `/chat`, and (SPEC-293) an
 * employee's chat tab, where the pill otherwise covers the send button. */
export function isChatWorkspace(pathname: string, tab?: string | null): boolean {
  if (pathname === "/chat" || pathname.startsWith("/chat/")) return true;
  if (tab !== "chat") return false;
  // SPEC-293 / SPEC-301 / SPEC-345 / SPEC-346: an employee's own chat tab is a chat workspace too.
  return (
    pathname === "/spotlight" ||
    pathname === "/employees/finance" ||
    pathname === "/email-marketing" ||
    pathname === "/customer-support"
  );
}

/** Hand-off target: the workspace with this thread selected, or bare `/chat`. */
export function chatWorkspaceHref(conversationId: string | null): string {
  return conversationId ? `/chat?c=${encodeURIComponent(conversationId)}` : "/chat";
}

/** `⌘J` / `Ctrl+J` — Notion's AI shortcut; `⌘B` is taken by the sidebar. */
export const CHAT_DRAWER_SHORTCUT_KEY = "j";

interface ShortcutEventLike {
  key: string;
  metaKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
}

export function isChatDrawerShortcut(event: ShortcutEventLike): boolean {
  return (
    event.key.toLowerCase() === CHAT_DRAWER_SHORTCUT_KEY &&
    (event.metaKey || event.ctrlKey) &&
    !event.altKey &&
    !event.shiftKey
  );
}

/** A shortcut must never fire while the reader is typing somewhere else. */
export function isEditableTarget(tagName: string, isContentEditable: boolean): boolean {
  const tag = tagName.toUpperCase();
  return isContentEditable || tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

/** "⌘J" on Apple platforms, "Ctrl+J" elsewhere — read from the user agent at
 * render time on the client only (the tooltip that shows it never renders on
 * the server). */
export function shortcutLabel(userAgent: string): string {
  return /Mac|iPhone|iPad|iPod/i.test(userAgent) ? "⌘J" : "Ctrl+J";
}
