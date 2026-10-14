/**
 * Finance Oversight logic (SPEC-296, live since SPEC-299).
 *
 * The scoped views are computed here — aging buckets, company totals, the filter, the
 * sort, the links — so the components stay presentational and the arithmetic is provable
 * in Vitest (the repo has no component runner). The authoritative payable totals and
 * **cash coverage** come from the backend, which is where the analytics engine lives
 * (root Rule 8); what remains here is narrowing and ordering a list already in hand.
 */

import type {
  AgingKey,
  Bill,
  BillFilters,
  BillFlag,
  BucketTotal,
  CompanyTotal,
  FinanceTab,
  GroupBy,
  RunThrough,
  WindowKey,
} from "@/types/finance";
import { formatCompactCurrency, formatWholeMoney } from "@/utils/format";

/** Whole days from `today` to an ISO date: negative is late, 0 is due today. */
export function daysUntil(iso: string, today: Date): number {
  const due = new Date(`${iso}T00:00:00`).getTime();
  const start = new Date(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
      today.getDate(),
    ).padStart(2, "0")}T00:00:00`,
  ).getTime();
  return Math.round((due - start) / 86_400_000);
}

export const AGING: { key: AgingKey; label: string; from: number; to: number }[] = [
  { key: "current", label: "Current", from: 0, to: Infinity },
  { key: "1-30", label: "1–30 days", from: -30, to: -1 },
  { key: "31-60", label: "31–60 days", from: -60, to: -31 },
  { key: "61-90", label: "61–90 days", from: -90, to: -61 },
  { key: "90+", label: "90+ days", from: -Infinity, to: -91 },
];

/** Which aging bucket a bill sits in, by how overdue it is. */
export function agingOf(bill: Bill, today: Date): AgingKey {
  const d = daysUntil(bill.dueOn, today);
  return (AGING.find((b) => d >= b.from && d <= b.to) ?? AGING[0]).key;
}

export const sumBalance = (bills: Bill[]): number =>
  bills.reduce((total, bill) => total + bill.balance, 0);

export const isPastDue = (bill: Bill, today: Date): boolean => daysUntil(bill.dueOn, today) < 0;

/** Bills falling inside a due-date window. `all` is everything still owed. */
export function inWindow(bill: Bill, window: WindowKey, today: Date): boolean {
  const d = daysUntil(bill.dueOn, today);
  if (window === "past") return d < 0;
  if (window === "7") return d >= 0 && d <= 7;
  if (window === "30") return d >= 0 && d <= 30;
  return true;
}

export function bucketTotals(bills: Bill[], today: Date): BucketTotal[] {
  return AGING.map((bucket) => {
    const mine = bills.filter((bill) => agingOf(bill, today) === bucket.key);
    return { key: bucket.key, label: bucket.label, amount: sumBalance(mine), bills: mine.length };
  });
}

export function companyTotals(bills: Bill[], companies: string[], today: Date): CompanyTotal[] {
  return companies.map((company) => {
    const mine = bills.filter((bill) => bill.company === company);
    const late = mine.filter((bill) => isPastDue(bill, today));
    return {
      company,
      outstanding: sumBalance(mine),
      pastDue: sumBalance(late),
      bills: mine.length,
      pastDueBills: late.length,
    };
  });
}

export function filterBills(bills: Bill[], filters: BillFilters, today: Date): Bill[] {
  const needle = filters.q.trim().toLowerCase();
  return bills.filter(
    (bill) =>
      (filters.company === "all" || bill.company === filters.company) &&
      (filters.vendor === "all" || bill.vendor === filters.vendor) &&
      (filters.status === "all" || bill.status === filters.status) &&
      (filters.age === null || agingOf(bill, today) === filters.age) &&
      (!filters.watch || bill.flags.length > 0) &&
      inWindow(bill, filters.window, today) &&
      (!needle ||
        `${bill.vendor} ${bill.number} ${bill.memo} ${bill.category}`
          .toLowerCase()
          .includes(needle)),
  );
}

export type SortKey = "vendor" | "company" | "number" | "billedOn" | "dueOn" | "amount" | "balance" | "status";

/** A stable sort — equal rows keep their order, so paging never reshuffles. */
export function sortBills(bills: Bill[], key: SortKey, dir: 1 | -1): Bill[] {
  return [...bills]
    .map((bill, index) => ({ bill, index }))
    .sort((a, b) => {
      const x = a.bill[key];
      const y = b.bill[key];
      if (x === y) return a.index - b.index;
      return (x < y ? -1 : 1) * dir;
    })
    .map((row) => row.bill);
}

/** "42d late" · "due today" · "in 5 days" — the phrase beside every due date. */
export function dueLabel(bill: Bill, today: Date): string {
  const d = daysUntil(bill.dueOn, today);
  if (d < 0) return `${Math.abs(d)}d late`;
  if (d === 0) return "due today";
  return `in ${d}d`;
}

export const WINDOWS: { key: WindowKey; label: string }[] = [
  { key: "all", label: "Any date" },
  { key: "past", label: "Past due" },
  { key: "7", label: "Next 7 days" },
  { key: "30", label: "Next 30 days" },
];

/** The deep link into the bill inside its own QuickBooks company. */
export function qboBillUrl(bill: Bill): string {
  return `https://app.qbo.intuit.com/app/bill?txnId=${encodeURIComponent(bill.txnId)}`;
}

export const EMPTY_FILTERS: BillFilters = {
  company: "all",
  window: "all",
  age: null,
  vendor: "all",
  status: "all",
  q: "",
  watch: false,
  group: "none",
};

export const GROUP_OPTIONS: { key: GroupBy; label: string }[] = [
  { key: "none", label: "No grouping" },
  { key: "company", label: "Group by company" },
  { key: "vendor", label: "Group by vendor" },
];

/** URL → filters. Anything unrecognised falls back rather than throwing (SPEC-296). */
export function filtersFromParams(params: URLSearchParams): BillFilters {
  const window = params.get("window");
  const age = params.get("age");
  const status = params.get("status");
  return {
    company: params.get("company") || "all",
    window: WINDOWS.some((w) => w.key === window) ? (window as WindowKey) : "all",
    age: AGING.some((a) => a.key === age) ? (age as AgingKey) : null,
    vendor: params.get("vendor") || "all",
    status: status === "open" || status === "partial" ? status : "all",
    q: params.get("q") || "",
    watch: params.get("flagged") === "1",
    group: GROUP_OPTIONS.some((g) => g.key === params.get("group"))
      ? (params.get("group") as GroupBy)
      : "none",
  };
}

/** Filters → a query string carrying only what differs from the default. */
export function paramsFromFilters(filters: BillFilters): string {
  const params = new URLSearchParams();
  if (filters.company !== "all") params.set("company", filters.company);
  if (filters.window !== "all") params.set("window", filters.window);
  if (filters.age) params.set("age", filters.age);
  if (filters.vendor !== "all") params.set("vendor", filters.vendor);
  if (filters.status !== "all") params.set("status", filters.status);
  if (filters.q.trim()) params.set("q", filters.q.trim());
  if (filters.watch) params.set("flagged", "1");
  if (filters.group !== "none") params.set("group", filters.group);
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function hasFilters(filters: BillFilters): boolean {
  return paramsFromFilters(filters) !== "";
}

// ── The page's own tabs (SPEC-301) ───────────────────────────────────────────

export const FINANCE_TAB_IDS: readonly FinanceTab[] = [
  "overview",
  "value",
  "bills",
  "run",
  "aging",
  "vendors",
  "cash",
  "chat",
  "profile",
];

export type { FinanceTab } from "@/types/finance";

const FINANCE_TAB_LABELS: Record<FinanceTab, string> = {
  overview: "Overview",
  value: "Value",
  bills: "Bills",
  run: "Payment run",
  aging: "Aging",
  vendors: "Vendors",
  cash: "Cash",
  chat: "Chat",
  profile: "Profile",
};

/** Shown at the end of the bar as muted labels — the approved roadmap, not links. */
export const FINANCE_SOON_TABS = ["A/R", "P&L"] as const;

export const financeTabLabel = (tab: FinanceTab): string => FINANCE_TAB_LABELS[tab];

/** Coerce an untrusted `?tab=` to a real tab; anything else is the overview. */
export function normalizeFinanceTab(value: string | null | undefined): FinanceTab {
  return FINANCE_TAB_IDS.includes(value as FinanceTab) ? (value as FinanceTab) : "overview";
}

export const RUN_THROUGH: { key: RunThrough; label: string }[] = [
  { key: "week", label: "This week" },
  { key: "next", label: "Next Friday" },
  { key: "month", label: "30 days" },
];

export function normalizeThrough(value: string | null | undefined): RunThrough {
  return RUN_THROUGH.some((t) => t.key === value) ? (value as RunThrough) : "week";
}

export const FINANCE_ROOT = "/employees/finance";

/** The page a bill opens on — its own route with the site's breadcrumb, like every
 * other drill-down in the platform (never a drawer). */
export const financeBillHref = (bill: { id: string }): string =>
  `${FINANCE_ROOT}/bills/${bill.id}`;

/** A vendor's URL key — the same slug as backend SPEC-295's `vendor_slug`, so a link
 * built here lands on the page the backend serves: case-folded, spaces collapsed, "&"
 * read as "and", anything else not a letter or digit becomes one hyphen. */
export function vendorKey(name: string): string {
  const folded = name.trim().replace(/\s+/g, " ").toLowerCase().replace(/&/g, " and ");
  return folded.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "vendor";
}

export const financeVendorHref = (key: string): string =>
  `${FINANCE_ROOT}/vendors/${encodeURIComponent(key)}`;

/** The page at one tab with one set of filters, plus the tab's own parameter (the run's
 * cut-off, the cash company) — every tile, view and tab is a link to this, so a view is
 * shareable and back/forward work. */
export function financeHref(
  tab: FinanceTab,
  filters: BillFilters = EMPTY_FILTERS,
  extra: Record<string, string | null | undefined> = {},
): string {
  const params = new URLSearchParams(paramsFromFilters(filters).replace(/^\?/, ""));
  if (tab !== "overview") params.set("tab", tab);
  for (const [key, value] of Object.entries(extra)) {
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return `${FINANCE_ROOT}${query ? `?${query}` : ""}`;
}

/** Rows `page` of `size`, clamped — a page past the end shows the last one. */
export function pageOf<T>(rows: T[], page: number, size: number): { rows: T[]; page: number; pages: number } {
  const pages = Math.max(1, Math.ceil(rows.length / size));
  const current = Math.min(Math.max(1, page), pages);
  return { rows: rows.slice((current - 1) * size, current * size), page: current, pages };
}

export const PAGE_SIZE = 25;

/** A flag as the owner reads it. The backend decides a flag exists; this names it. */
export function flagLabel(flag: BillFlag, amount: number): { text: string; tone: "bad" | "warn" | "ai" | "good" } {
  switch (flag.kind) {
    case "duplicate":
      if (flag.across) return { text: "Same bill in another company", tone: "bad" };
      return { text: flag.second ? "Possible second copy" : "Possible duplicate", tone: "bad" };
    case "unusual":
      return {
        text: flag.typical > 0 ? `${Math.round(amount / flag.typical)}× usual amount` : "Unusual amount",
        tone: "warn",
      };
    case "new_vendor":
      return { text: "New vendor", tone: "ai" };
    case "discount":
      return { text: `Save ${formatCompactCurrency(flag.save)} by ${shortDate(flag.deadline)}`, tone: "good" };
  }
}

/** "Sep 28" from an ISO date, without a timezone shift. */
export function shortDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Pressing the tile that is already on clears it — the toggle, as a pure value. */
export function toggledFilters<K extends keyof BillFilters>(
  filters: BillFilters,
  key: K,
  value: BillFilters[K],
  off: BillFilters[K],
): BillFilters {
  return { ...filters, [key]: filters[key] === value ? off : value };
}

/** Money in a tile or a grid cell: whole dollars under $1,000 ("$792", never "$791.5"),
 * the app's compact form above it ("$41.2K"). */
export function compactMoney(value: number): string {
  // SPEC-331: small amounts are whole units in the store's currency too — this used to
  // hard-code "$", so a pound store read "$450" beside "£12.3K".
  if (Math.abs(value) < 1000) return formatWholeMoney(value);
  return formatCompactCurrency(value);
}
