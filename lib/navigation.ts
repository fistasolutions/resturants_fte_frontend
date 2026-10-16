import {
  BookOpenCheck,
  Activity,
  FileSpreadsheet,
  BadgePercent,
  BookOpen,
  Boxes,
  BriefcaseBusiness,
  CheckCircle2,
  ChefHat,
  ClipboardCheck,
  Star,
  Scale,
  ConciergeBell,
  ShieldCheck,
  ClipboardList,
  Database,
  FileText,
  Gift,
  HandCoins,
  Footprints,
  Gauge,
  Headset,
  House,
  Landmark,
  LifeBuoy,
  MailCheck,
  MessageSquare,
  NotebookPen,
  Package,
  Plug,
  ServerCog,
  RotateCcw,
  Settings,
  Share2,
  ShoppingCart,
  Store,
  Sun,
  Timer,
  Target,
  Telescope,
  UserRound,
  Users,
  UtensilsCrossed,
  Wallet,
  Warehouse,
  Building2,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  /** Kept for the sidebar's disabled-item pattern; all current items ship enabled. */
  enabled: boolean;
  badge?: string;
  /**
   * The hub this destination is entered through (SPEC-290). An item with `within`
   * keeps its URL, its doc and its chat page context, but is not drawn as a sidebar
   * row — its hub's row is lit instead while the owner is inside it.
   */
  within?: string;
}

/** Scope revision 2026-07-16 (SPEC-022/023/024): analyst pages deliver what
 * Shopify admin can't — verdicts and recommendations, not raw data. */
export const navItems: NavItem[] = [
  { title: "Morning Brief", href: "/brief", icon: Sun, enabled: true },
  { title: "Dashboard", href: "/dashboard", icon: House, enabled: true },
  { title: "Chat with AI", href: "/chat", icon: MessageSquare, enabled: true },
  // The four digital employees as one team (SPEC-290; backend SPEC-285): a card per
  // FTE with its status, what needs the owner and three figures. Takes the sidebar
  // row Spotlight had; the four employees below are entered through it.
  { title: "Digital Employees", href: "/employees", icon: BriefcaseBusiness, enabled: true },
  // AI brand-visibility engine: cited Brand Brain, inbound SEO content pipeline,
  // approvals, and organic reach (SPEC-109; frontend-only MVP on mock data).
  { title: "Search Visibility", href: "/spotlight", icon: Telescope, enabled: true, within: "/employees" },
  // AI organic social manager: turns the product catalog into native social
  // content — plan, creative + captions per channel, approvals, and measured
  // reach (SPEC-110; frontend-only MVP on mock data).
  { title: "Social Media Manager", href: "/social", icon: Share2, enabled: true, within: "/employees" },
  // AI media buyer for Meta + Google: profit-aware campaigns grounded in Shopify
  // data, human-gated spend, hard caps + kill-switch + an audit ledger (SPEC-111;
  // frontend-only MVP on mock data).
  { title: "Paid Ads Manager", href: "/ads", icon: Target, enabled: true, within: "/employees" },
  // The sixth employee (SPEC-345): email and SMS through the store's own email platform,
  // Klaviyo first, judged by profit and incremental lift. Frontend preview on sample data.
  { title: "Email Marketing Manager", href: "/email-marketing", icon: MailCheck, enabled: true, within: "/employees" },
  // SPEC-346: answers and resolves customer conversations through the store's own helpdesk,
  // Gorgias first, with the real order, return, fit and stock behind every reply. Frontend
  // preview on sample tickets; the Gorgias connection is the real one from Integrations.
  { title: "Customer Support Agent", href: "/customer-support", icon: LifeBuoy, enabled: true, within: "/employees" },
  // SPEC-374: sheets, Airtable and invoices copied exactly, turned into real cost and profit. Shown
  // only to organizations with the `data_manager` feature (backend SPEC-383).
  { title: "Data Manager", href: "/data-manager", icon: Database, enabled: true, within: "/employees" },
  // Restaurant brands (SPEC-377; backend SPEC-387/389): shown only to an organization with the
  // `restaurant` feature — the backend's navigation hides them for everyone else, and hides the
  // Shopify-only pages for a restaurant brand.
  { title: "Network", href: "/network", icon: Store, enabled: true },
  { title: "Menu", href: "/menu", icon: UtensilsCrossed, enabled: true },
  // Restaurant OS (SPEC-379; backend SPEC-393): taking orders and running the kitchen.
  { title: "Order Taking", href: "/pos", icon: ClipboardList, enabled: true },
  { title: "Kitchen & Dispatch", href: "/kitchen", icon: ChefHat, enabled: true },
  // SPEC-380 (backend SPEC-395): the branch's drawer and its day close.
  { title: "Cash & Day Close", href: "/cash", icon: Wallet, enabled: true },
  // SPEC-383 (backend SPEC-398): the points program and gift cards.
  { title: "Loyalty & Gift Cards", href: "/loyalty", icon: Gift, enabled: true },
  // SPEC-394: the crew, the clock, the schedule, inventory and food cost.
  { title: "Back Office", href: "/back-office", icon: Warehouse, enabled: true },
  // SPEC-395 (backend SPEC-416): prospects to franchisees, openings to branches.
  { title: "Franchise Development", href: "/development", icon: Building2, enabled: true },
  { title: "Operations", href: "/operations", icon: Timer, enabled: true },
  { title: "Guests", href: "/guests", icon: UserRound, enabled: true },
  { title: "Royalties", href: "/royalties", icon: HandCoins, enabled: true },
  { title: "Daily Reports", href: "/reports", icon: FileText, enabled: true },
  // The Report FTE (SPEC-256): one digital employee that builds any report from the
  // engine's figures on the owner's schedule. Entered through Digital Employees since
  // SPEC-290; its URL, doc and page context are unchanged.
  { title: "Report Builder", href: "/report-fte", icon: NotebookPen, enabled: true, within: "/employees" },
  // SPEC-385 (backend SPEC-402): a restaurant brand's own employee.
  { title: "Ops Coach", href: "/ops-coach", icon: ClipboardCheck, enabled: true, within: "/employees" },
  // SPEC-390 (backend SPEC-408): guests' ratings and the replies to them.
  { title: "Reputation Manager", href: "/reputation", icon: Star, enabled: true, within: "/employees" },
  // SPEC-391 (backend SPEC-409/410): the menu's tuner and the catering desk.
  { title: "Menu Engineer", href: "/menu-engineer", icon: Scale, enabled: true, within: "/employees" },
  { title: "Catering Desk", href: "/catering", icon: ConciergeBell, enabled: true, within: "/employees" },
  // SPEC-392 (backend SPEC-411): QSC audits.
  { title: "Brand Standards", href: "/standards", icon: ShieldCheck, enabled: true, within: "/employees" },
  { title: "Product Analyst", href: "/products", icon: Package, enabled: true },
  { title: "Inventory Analyst", href: "/inventory", icon: Boxes, enabled: true },
  // Raw order browsing + the report drill-down target (SPEC-039; owner
  // placement 2026-07-21: directly above Integrations).
  { title: "Orders", href: "/orders", icon: ShoppingCart, enabled: true },
  // Dormant-customer money finder (SPEC-056; backend SPEC-049).
  { title: "Customers", href: "/customers", icon: Users, enabled: true },
  // Team-level Loop Returns processing metrics (SPEC-082; backend SPEC-076)
  // — placement per the client-approved design mockup: groups with the
  // other analyst/operational pages, not under Integrations or Results.
  { title: "Returns Analytics", href: "/returns", icon: RotateCcw, enabled: true },
  // Every send action's before/after verdict (SPEC-067; backend SPEC-063) —
  // its own top-level page, not nested under Morning Brief: 3 of its 5 tabs
  // (Transfers, Dead Inventory, Orders) aren't Brief pages at all.
  { title: "Results", href: "/results", icon: CheckCircle2, enabled: true },
  // What the agents did, how reliably and at what cost (SPEC-226; backend SPEC-237).
  // Its own page rather than a Results tab: Results answers "did the messages we sent
  // work", this answers "how are the agents performing" — a different question, and it
  // carries deep-linkable traces of its own.
  { title: "AI Performance", href: "/ai", icon: Activity, enabled: true },
  // Per-agent Gorgias support metrics (SPEC-081; backend SPEC-074) — its own
  // tier, not nested under Integrations (credential config) or Results
  // (decision outcomes).
  { title: "Team Performance", href: "/team-performance", icon: Headset, enabled: true },
  // Warehouse packing performance from iPacky (per-packer productivity/quality)
  // + live Shopify unfulfilled-backlog / oldest-stuck-order (SPEC-097).
  { title: "Warehouse", href: "/warehouse", icon: Warehouse, enabled: true },
  // In-store footfall + conversion from V-Count (SPEC-103).
  { title: "Store Traffic", href: "/traffic", icon: Footprints, enabled: true },
  { title: "Foresight", href: "/foresight", icon: Gauge, enabled: true },
  // Discount monitoring / loss prevention (SPEC-098; backend SPEC-099) — who is
  // discounting, where, how much, flagged by policy. Company → Location →
  // Employee → Transaction → Item.
  { title: "Discounts", href: "/discounts", icon: BadgePercent, enabled: true },
  // sales/tax reports for accounting (SPEC-166; backend SPEC-171).
  { title: "Sales & Tax", href: "/tax-reports", icon: FileSpreadsheet, enabled: true },
  // Did the scheduled work actually happen (SPEC-228; backend SPEC-238). Sits beside
  // Integrations rather than under it: Integrations is credential configuration, this
  // is whether the platform's own 23 jobs ran.
  { title: "System", href: "/system", icon: ServerCog, enabled: true },
  // SPEC-253: every build report since day one, newest first.
  { title: "Continuous Innovation", href: "/ci", icon: BookOpenCheck, enabled: true },
  { title: "Integrations", href: "/integrations", icon: Plug, enabled: true },
  { title: "Settings", href: "/settings", icon: Settings, enabled: true },
  // The in-app product documentation (SPEC-229) — one doc per destination above,
  // enforced by `tests/docs.test.ts`. Reference material sits last.
  { title: "Docs", href: "/docs", icon: BookOpen, enabled: true },
];

/** A nav item is active on its own route AND any of its sub-routes (e.g.
 * `/inventory/transfers/review`, `/inventory/store-transfers` under "Inventory
 * Analyst" → `/inventory`) — an exact-match check leaves the sidebar
 * unhighlighted while on a sub-tab. */
export function isNavItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** The rows the sidebar draws: every destination that is not entered through a hub. */
export const sidebarItems: NavItem[] = navItems.filter((item) => !item.within);

/** The destinations entered through `hubHref` (SPEC-290). */
export function itemsWithin(hubHref: string): NavItem[] {
  return navItems.filter((item) => item.within === hubHref);
}

/**
 * Employees whose URL lives UNDER their hub (SPEC-296: Finance Oversight at
 * `/employees/finance`). They are not `navItems` entries — the docs coverage test maps one
 * doc per entry, and the hub's doc already covers them — but the sidebar lists them.
 */
const NESTED_UNDER_HUB: Record<string, NavItem[]> = {
  "/employees": [{ title: "Accounts Payable", href: "/employees/finance", icon: Landmark, enabled: true }],
};

/** The hub's roster order (backend `services/employees/roster.py` `EMPLOYEES`). */
const HUB_ORDER: Record<string, string[]> = {
  "/employees": ["/spotlight", "/social", "/ads", "/email-marketing", "/customer-support", "/data-manager", "/employees/finance", "/report-fte"],
};

/**
 * Everything the sidebar lists under a hub row when it is opened (SPEC-329): the
 * destinations entered through it plus those living under its URL, in roster order.
 */
export function hubChildren(hubHref: string): NavItem[] {
  const children = [...itemsWithin(hubHref), ...(NESTED_UNDER_HUB[hubHref] ?? [])];
  const order = HUB_ORDER[hubHref] ?? [];
  const rank = (href: string) => {
    const index = order.indexOf(href);
    return index === -1 ? order.length : index;
  };
  return children.sort((a, b) => rank(a.href) - rank(b.href));
}

/**
 * A sidebar row is lit on its own route, its sub-routes, and — for a hub — on every
 * destination entered through it, so "Digital Employees" stays lit while the owner is
 * inside Spotlight (SPEC-290).
 */
export function isSidebarItemActive(pathname: string, item: NavItem): boolean {
  if (isNavItemActive(pathname, item.href)) return true;
  return itemsWithin(item.href).some((child) => isNavItemActive(pathname, child.href));
}
