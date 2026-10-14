/** Finance Oversight — accounts payable across the QuickBooks companies (SPEC-296,
 * live on backend SPEC-294 since SPEC-299, eight tabs since SPEC-301 / backend SPEC-295).
 * Adapters in `lib/finance-api.ts`. */

export type BillStatus = "open" | "partial";

export type AgingKey = "current" | "1-30" | "31-60" | "61-90" | "90+";

export type WindowKey = "all" | "past" | "7" | "30";

/** The page's own tabs (SPEC-301), in bar order. */
export type FinanceTab =
  | "overview"
  | "value"
  | "bills"
  | "run"
  | "aging"
  | "vendors"
  | "cash"
  | "chat"
  | "profile";

/** What the backend's rules found on a bill (SPEC-295) — fixed rules, not a model. */
export type BillFlag =
  | { kind: "duplicate"; otherId: string; second: boolean; across: boolean }
  | { kind: "unusual"; typical: number }
  | { kind: "new_vendor" }
  | { kind: "discount"; deadline: string; daysLeft: number; save: number; percent: number };

/** Can a company pay its week from its own account (SPEC-295)? */
export type WeekVerdict = "short" | "tight" | "covered" | "no_bank";

export interface Bill {
  id: string;
  /** QuickBooks' own transaction id — what the deep link needs. */
  txnId: string;
  /** The company's realm id, so a link opens the right set of books. */
  realmId: string;
  /** Bill / invoice number as the vendor wrote it. */
  number: string;
  vendor: string;
  /** Expense category, for the sub-line under the vendor. */
  category: string;
  company: string;
  /** ISO dates. */
  billedOn: string;
  dueOn: string;
  amount: number;
  balance: number;
  status: BillStatus;
  terms: string;
  memo: string;
  lines: number;
  flags: BillFlag[];
  /** When it was entered in QuickBooks; null for rows read before SPEC-295. */
  createdAt: string | null;
  /** The bill's own currency; `amount`/`balance` are in the reporting currency
   * (backend SPEC-339) and these are the figures as QuickBooks wrote them. */
  currency: string;
  originalAmount: number | null;
  originalBalance: number | null;
  fxRate: number | null;
}

export interface CompanyTotal {
  company: string;
  outstanding: number;
  pastDue: number;
  bills: number;
  pastDueBills: number;
}

/** A company's week (SPEC-295): its QuickBooks bank balance against what is late or
 * due in the next 7 days, and the cushion that separates "tight" from "covered". */
export interface CompanyWeek extends CompanyTotal {
  bank: number | null;
  bankAccounts: number;
  need7: number;
  left7: number | null;
  cushion: number;
  verdict: WeekVerdict;
}

export interface BucketTotal {
  key: AgingKey;
  label: string;
  amount: number;
  bills: number;
}

/** What a location owes soon against the margin it actually earned — the one figure
 * that needs QuickBooks and Shopify together. Computed by the backend, which is where
 * the analytics engine lives (root Rule 8). */
export interface Coverage {
  company: string;
  dueNext30: number;
  /** null when the company could not be matched to a store location, or that location
   * has no known costs — never 0, which would read as "earned nothing". */
  margin30: number | null;
  /** margin ÷ owed; null when nothing is owed or nothing is matched. */
  ratio: number | null;
  /** False when unmatched as well as when short — read it with `matched`. */
  covered: boolean;
  shortfall: number | null;
  /** Whether a store location was found for this company at all. */
  matched: boolean;
}

/** Where a company's QuickBooks read is (backend SPEC-298) — null on the connection
 * when nothing is running. */
export interface QboSync {
  state: "queued" | "running";
  /** How many of the `steps` reads have finished. */
  step: number;
  steps: number;
  /** What it is doing, in the backend's words ("Reading open bills"). */
  label: string;
  startedAt: string | null;
  /** No successful read yet — this is the company's first. */
  first: boolean;
}

export interface QboConnection {
  id: number;
  companyName: string;
  realmIdMasked: string;
  status: "connected" | "needs_reconnect" | "revoked";
  lastSyncedAt: string | null;
  lastError: string | null;
  connectedAt: string | null;
  sync: QboSync | null;
  /** The currency the company's books are kept in (backend SPEC-339); null until read. */
  homeCurrency: string | null;
  /** Currencies it uses that have no exchange rate — the company sits out until set. */
  fxMissing: string[];
}

/** How one currency was converted into the reporting currency (backend SPEC-339). */
export interface FxRate {
  currency: string;
  rate: number;
  source: "quickbooks" | "owner";
  asOf: string;
}

export interface ConnectionsOverview {
  connections: QboConnection[];
  connected: number;
  /** True once at least one company is connected — the employee has a job. */
  ready: boolean;
  /** Whether the server has QuickBooks app credentials at all; the Connect button
   * appears on this rather than failing at Intuit (backend SPEC-294). */
  configured: boolean;
  /** Some company is being read right now — keep polling (backend SPEC-298). */
  syncing: boolean;
  /** Every Finance figure is in this currency (backend SPEC-339). */
  reportingCurrency: string;
  rates: FxRate[];
}

/** The money strip, computed in SQL over the WHOLE payable — never the filtered list,
 * so a headline figure never moves when a column is clicked (backend SPEC-294). */
export interface ApTotals {
  outstanding: number;
  outstandingBills: number;
  pastDue: number;
  pastDueBills: number;
  due7: number;
  due7Bills: number;
  due30: number;
  due30Bills: number;
  /** Across every company with a bank account; null when none has one. */
  bank: number | null;
  need7: number;
  left7: number | null;
}

/** The morning note (backend SPEC-295) — deterministic wording, never a model. */
export interface MorningNote {
  tone: "bad" | "warn" | "good";
  headline: string;
  body: string;
  actions: { label: string; href: string | null; billId: string | null }[];
}

export interface OverviewChanges {
  newBills: { count: number; amount: number };
  wentLate: { count: number; amount: number };
  paid: { count: number; amount: number };
  topVendor: { vendor: string; key: string; share: number } | null;
}

export interface FinanceOverview {
  bills: Bill[];
  /** Connected company names, in the backend's order. */
  companies: string[];
  companyTotals: CompanyWeek[];
  /** Every vendor that is owed something — the filter's options. */
  vendors: string[];
  totals: ApTotals;
  /** The five aging bands over the whole payable, in display order. */
  aging: BucketTotal[];
  coverage: Coverage[];
  /** When the bills were last read from QuickBooks; null before the first sync. */
  syncedAt: string | null;
  /** False while no company is connected — the page labels itself honestly. */
  live: boolean;
  connected: number;
  note: MorningNote | null;
  changes: OverviewChanges;
}

export type GroupBy = "none" | "company" | "vendor";

export interface BillFilters {
  company: string;
  window: WindowKey;
  age: AgingKey | null;
  vendor: string;
  status: BillStatus | "all";
  q: string;
  /** Only bills the rules flagged (SPEC-301's "Flagged" view). */
  watch: boolean;
  group: GroupBy;
}

// ── SPEC-301: the other tabs ─────────────────────────────────────────────────

export interface BillLine {
  description: string;
  account: string | null;
  amount: number;
}

export interface BillPaymentRow {
  date: string | null;
  amount: number;
  method: string | null;
}

/** A bill as the v2 endpoints list it — the run, the vendor page, "other bills". */
export interface BillRef {
  id: string;
  company: string;
  vendor: string;
  number: string;
  billedOn: string;
  dueOn: string;
  days: number;
  amount: number;
  balance: number;
  status: BillStatus;
  flags: BillFlag[];
}

export interface BillDetail {
  bill: Bill;
  lines: BillLine[];
  payments: BillPaymentRow[];
  otherOpen: BillRef[];
}

export type RunThrough = "week" | "next" | "month";

export interface RunRow {
  bill: BillRef;
  reason: "late" | "discount" | "due";
  daysLate: number | null;
  deadline: string | null;
  save: number | null;
  dueIn: number | null;
  selected: boolean;
  heldReason: string | null;
}

export interface RunPlan {
  through: RunThrough;
  throughDate: string;
  days: number;
  rows: RunRow[];
  companies: { company: string; bank: number | null; cushion: number }[];
  live: boolean;
}

export interface CashWeek {
  week: number;
  start: string;
  end: string;
  takings: number;
  billsDue: number;
  bills: number;
  lateIncluded: boolean;
  balance: number;
  belowCushion: boolean;
  overdrawn: boolean;
}

export interface CashOutlook {
  company: string;
  companies: string[];
  bank: number;
  bankAccounts: { company: string; name: string; balance: number }[];
  takingsPerWeek: number;
  /** null for a company with no matching store location — unknown, not zero. */
  takingsByCompany: Record<string, number | null>;
  cushion: number;
  weeks: CashWeek[];
  lowest: { start: string; balance: number };
  excludes: string[];
  live: boolean;
}

export interface AgingRow {
  company: string;
  buckets: Record<AgingKey, number>;
  bills: number;
  total: number;
  pastDue: number;
  pastDueShare: number;
}

export interface AgingReport {
  bands: { key: AgingKey; label: string }[];
  companies: AgingRow[];
  total: AgingRow;
  concentration: { vendor: string; key: string; owed: number; share: number }[];
  other: { count: number; owed: number; share: number };
  vendors: { vendor: string; key: string; buckets: Record<AgingKey, number>; total: number }[];
  trend: { date: string; outstanding: number; pastDue: number }[];
  live: boolean;
}

export interface VendorRow {
  key: string;
  vendor: string;
  companies: string[];
  openBills: number;
  owed: number;
  pastDue: number;
  nextDue: { date: string; balance: number } | null;
  terms: string | null;
  typical: number | null;
  avgDaysToPay: number | null;
  onTimeRate: number | null;
  paidBills: number;
  measuredBills: number;
  firstSeen: string | null;
  isNew: boolean;
}

export interface VendorsReport {
  vendors: VendorRow[];
  summary: {
    count: number;
    shared: number;
    top: { vendor: string; share: number } | null;
    avgDaysToPay: number | null;
  };
  live: boolean;
}

export interface VendorDetail {
  vendor: VendorRow;
  bills: BillRef[];
  byCompany: { company: string; owed: number }[];
  payments: { date: string | null; company: string; amount: number; method: string | null }[];
}

export interface Scorecard {
  paid: { count: number; amount: number };
  onTimeRate: number | null;
  avgDaysToPay: number | null;
  measuredBills: number;
  discounts: { offered: number; taken: number; saved: number; missed: number };
  openFlags: { duplicate: number; unusual: number; newVendor: number; discount: number };
}

export interface FinanceProfile {
  scorecard: Scorecard;
  books: (QboConnection & { openBills: number })[];
  lastRead: string | null;
  nextRead: string | null;
  live: boolean;
}

// ── The value ledger (SPEC-330 / backend SPEC-338) ──────────────────────────

/** Where a figure comes from: the books themselves, or the store's stated assumptions. */
export type ValueBasis = "measured" | "assumed";

export type FindingKind = "discount" | "duplicate";

export type FindingStatus = "open" | "kept" | "lost" | "closed" | "dismissed";

export interface ValueSum {
  count: number;
  amount: number;
}

/** A month compared with the year before the employee: positive `amount` is a gain. */
export interface ValueGain {
  amount: number;
  before: number;
  now: number;
}

export interface Finding {
  id: number | null;
  kind: FindingKind;
  status: FindingStatus;
  company: string;
  /** The other company when a duplicate crosses two sets of books. */
  otherCompany: string | null;
  vendor: string;
  number: string | null;
  amount: number;
  outcome: number | null;
  verified: "amount" | "timing" | "removed" | null;
  deadline: string | null;
  firstSeen: string | null;
  resolvedOn: string | null;
  note: string | null;
  dismissReason: string | null;
  /** The open bill's id while it is still open — its page can be opened. */
  billId: string | null;
}

export interface PaidTwiceGroup {
  vendor: string;
  number: string | null;
  amount: number;
  copies: number;
  extra: number;
  companies: string[];
  paidOn: string[];
}

export interface ValueBaseline {
  from: string;
  to: string;
  bills: number;
  spend: number;
  frozen: boolean;
  discounts: { offered: number; taken: number; kept: number; missed: number };
  late: { count: number; share: number | null; avgDays: number | null; amount: number; fees: number };
  early: { count: number; avgDays: number | null; amount: number; cost: number };
  paidTwice: { count: number; amount: number; items: PaidTwiceGroup[] };
}

export interface ValueAssumption {
  key: string;
  label: string;
  unit: "usd_per_hour" | "hours_per_week" | "percent";
  value: number;
  default: number;
  min: number;
  max: number;
  /** A cited benchmark, or our own estimate — the page says which. */
  kind: "benchmark" | "ours";
  source: string;
  url: string | null;
}

export interface ValueExposure {
  text: string;
  source: string;
  url: string;
}

export interface FinanceValue {
  sample: boolean;
  live: boolean;
  month: string;
  months: string[];
  connectedSince: string | null;
  headline: { measured: number; estimated: number; total: number; hours: number };
  measured: { discountsKept: ValueSum; duplicatesStopped: ValueSum };
  lost: { discountsMissed: ValueSum; paidTwice: ValueSum };
  estimated: {
    time: { hours: number; amount: number; days: number; companies: number };
    timing: ValueGain | null;
    lateFees: ValueGain | null;
  };
  atStake: {
    discounts: ValueSum & { soonest: string | null };
    duplicates: ValueSum;
    lateFees: ValueSum & { owed: number };
  };
  sinceConnected: { measured: number; count: number; hours: number };
  ledger: Finding[];
  baseline: ValueBaseline | null;
  assumptions: ValueAssumption[];
  exposure: ValueExposure[];
}
