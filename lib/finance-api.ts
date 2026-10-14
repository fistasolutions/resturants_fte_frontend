/**
 * Finance Oversight: the backend's shapes → the view models (SPEC-299, widened by
 * SPEC-301 for backend SPEC-295).
 *
 * Pure, so the mapping of somebody's payables is provable in Vitest. Rules it keeps, all
 * about not inventing money:
 *
 * * **Unknown stays unknown.** A company with no bank account has `bank: null`, an
 *   unmatched store has no takings, a vendor never paid through Bill Pay has no days to
 *   pay — none of them becomes 0, which would read as a real figure.
 * * **Dates are never null on a bill.** The backend guarantees it (a bill with no due date
 *   is due on its bill date), so nothing downstream handles a dateless bill.
 * * **Flags keep their kind.** The UI decides how a flag looks, never whether it exists.
 */
import type {
  AgingKey,
  AgingReport,
  AgingRow,
  Bill,
  BillDetail,
  BillFlag,
  BillRef,
  BillStatus,
  BucketTotal,
  CashOutlook,
  CompanyWeek,
  ConnectionsOverview,
  FinanceValue,
  Finding,
  Coverage,
  FinanceOverview,
  FinanceProfile,
  QboConnection,
  RunPlan,
  RunThrough,
  VendorDetail,
  VendorRow,
  ValueAssumption,
  ValueBaseline,
  ValueGain,
  VendorsReport,
  WeekVerdict,
} from "@/types/finance";

// ── raw shapes ──────────────────────────────────────────────────────────────

export type ApiFlag =
  | { kind: "duplicate"; other_id: number; second: boolean; across?: boolean }
  | { kind: "unusual"; typical: number }
  | { kind: "new_vendor" }
  | { kind: "discount"; deadline: string; days_left: number; save: number; percent: number };

export interface ApiBill {
  id: number;
  qbo_id: string;
  realm_id: string;
  number: string;
  vendor: string;
  category: string;
  company: string;
  billed_on: string;
  due_on: string;
  amount: number;
  balance: number;
  status: BillStatus;
  terms: string;
  memo: string;
  lines: number;
  currency: string;
  flags?: ApiFlag[];
  created_at?: string | null;
  original_amount?: number | null;
  original_balance?: number | null;
  fx_rate?: number | null;
}

export interface ApiBillRef {
  id: number;
  company: string;
  vendor: string;
  number: string;
  billed_on: string;
  due_on: string;
  days: number;
  amount: number;
  balance: number;
  status: BillStatus;
  flags: ApiFlag[];
}

export interface ApiCoverage {
  company: string;
  due_next_30: number;
  margin_30: number | null;
  matched: boolean;
  ratio: number | null;
  covered: boolean;
  shortfall: number | null;
}

export interface ApiCompanyTotal {
  company: string;
  realm_id_masked: string;
  bills: number;
  outstanding: number;
  past_due: number;
  past_due_bills: number;
  bank?: number | null;
  bank_accounts?: number;
  need_7?: number;
  left_7?: number | null;
  cushion?: number;
  verdict?: WeekVerdict;
}

export interface ApiNote {
  tone: "bad" | "warn" | "good";
  headline: string;
  body: string;
  actions: { label: string; href?: string; bill_id?: number }[];
}

export interface ApiFinanceAp {
  bills: ApiBill[];
  companies: ApiCompanyTotal[];
  vendors: string[];
  totals: {
    outstanding: number;
    outstanding_bills: number;
    past_due: number;
    past_due_bills: number;
    due_7: number;
    due_7_bills: number;
    due_30: number;
    due_30_bills: number;
    bank?: number | null;
    need_7?: number;
    left_7?: number | null;
  };
  aging: { key: string; label: string; amount: number; bills: number }[];
  coverage: ApiCoverage[];
  note?: ApiNote | null;
  changes?: {
    new_bills: { count: number; amount: number };
    went_late: { count: number; amount: number };
    paid: { count: number; amount: number };
    top_vendor: { vendor: string; key: string; share: number } | null;
  };
  synced_at: string | null;
  live: boolean;
  connected: number;
}

export interface ApiConnection {
  id: number;
  company_name: string;
  realm_id_masked: string;
  status: QboConnection["status"];
  last_synced_at: string | null;
  last_error: string | null;
  connected_at: string | null;
  sync?: {
    state: "queued" | "running";
    step: number;
    steps: number;
    label: string;
    started_at: string | null;
    first: boolean;
  } | null;
  home_currency?: string | null;
  fx_missing?: string[];
}

export interface ApiConnections {
  connections: ApiConnection[];
  connected: number;
  ready: boolean;
  configured: boolean;
  syncing?: boolean;
  reporting_currency?: string;
  rates?: { currency: string; rate: number; source: "quickbooks" | "owner"; as_of: string }[];
}

export interface ApiBillDetail {
  bill: ApiBill;
  lines?: { description: string; account: string | null; amount: number }[];
  payments?: { date: string | null; amount: number; method: string | null }[];
  other_open?: ApiBillRef[];
}

export interface ApiRun {
  through: RunThrough;
  through_date: string;
  days: number;
  rows: {
    bill: ApiBillRef;
    reason: "late" | "discount" | "due";
    days_late?: number;
    deadline?: string;
    save?: number;
    due_in?: number;
    selected: boolean;
    held_reason: string | null;
  }[];
  companies: { company: string; bank: number | null; cushion: number }[];
  live: boolean;
}

export interface ApiCash {
  company: string;
  companies: string[];
  bank: number;
  bank_accounts: { company: string; name: string; balance: number }[];
  takings_per_week: number;
  takings_by_company: Record<string, number | null>;
  cushion: number;
  weeks: {
    week: number;
    start: string;
    end: string;
    takings: number;
    bills_due: number;
    bills: number;
    late_included: boolean;
    balance: number;
    below_cushion: boolean;
    overdrawn: boolean;
  }[];
  lowest: { start: string; balance: number };
  excludes: string[];
  live: boolean;
}

type ApiBuckets = Record<AgingKey, number>;

export interface ApiAgingRow {
  company: string;
  buckets: ApiBuckets;
  bills: number;
  total: number;
  past_due: number;
  past_due_share: number;
}

export interface ApiAging {
  bands: { key: AgingKey; label: string }[];
  companies: ApiAgingRow[];
  total: ApiAgingRow;
  concentration: { vendor: string; key: string; owed: number; share: number }[];
  other: { count: number; owed: number; share: number };
  vendors: { vendor: string; key: string; buckets: ApiBuckets; total: number }[];
  trend: { date: string; outstanding: number; past_due: number }[];
  live: boolean;
}

export interface ApiVendorRow {
  key: string;
  vendor: string;
  companies: string[];
  open_bills: number;
  owed: number;
  past_due: number;
  next_due: { date: string; balance: number } | null;
  terms: string | null;
  typical: number | null;
  avg_days_to_pay: number | null;
  on_time_rate: number | null;
  paid_bills: number;
  measured_bills: number;
  first_seen: string | null;
  new: boolean;
}

export interface ApiVendors {
  vendors: ApiVendorRow[];
  summary: {
    count: number;
    shared: number;
    top: { vendor: string; share: number } | null;
    avg_days_to_pay: number | null;
  };
  live: boolean;
}

export interface ApiVendorDetail {
  vendor: ApiVendorRow;
  bills: ApiBillRef[];
  by_company: { company: string; owed: number }[];
  payments: { date: string | null; company: string; amount: number; method: string | null }[];
}

export interface ApiProfile {
  scorecard: {
    paid: { count: number; amount: number };
    on_time_rate: number | null;
    avg_days_to_pay: number | null;
    measured_bills: number;
    discounts: { offered: number; taken: number; saved: number; missed: number };
    open_flags: { duplicate: number; unusual: number; new_vendor: number; discount: number };
  };
  books: (ApiConnection & { open_bills: number })[];
  last_read: string | null;
  next_read: string | null;
  live: boolean;
}

// ── adapters ────────────────────────────────────────────────────────────────

export function toFlag(raw: ApiFlag): BillFlag {
  switch (raw.kind) {
    case "duplicate":
      return {
        kind: "duplicate",
        otherId: String(raw.other_id),
        second: raw.second,
        // Absent on a backend older than SPEC-338: a same-company pair, the only kind then.
        across: raw.across ?? false,
      };
    case "unusual":
      return { kind: "unusual", typical: raw.typical };
    case "new_vendor":
      return { kind: "new_vendor" };
    case "discount":
      return {
        kind: "discount",
        deadline: raw.deadline,
        daysLeft: raw.days_left,
        save: raw.save,
        percent: raw.percent,
      };
  }
}

export function toBill(raw: ApiBill): Bill {
  return {
    id: String(raw.id),
    txnId: raw.qbo_id,
    realmId: raw.realm_id,
    number: raw.number,
    vendor: raw.vendor,
    category: raw.category,
    company: raw.company,
    billedOn: raw.billed_on,
    dueOn: raw.due_on,
    amount: raw.amount,
    balance: raw.balance,
    status: raw.status,
    terms: raw.terms,
    memo: raw.memo,
    lines: raw.lines,
    flags: (raw.flags ?? []).map(toFlag),
    createdAt: raw.created_at ?? null,
    currency: raw.currency ?? "",
    originalAmount: raw.original_amount ?? null,
    originalBalance: raw.original_balance ?? null,
    fxRate: raw.fx_rate ?? null,
  };
}

export function toBillRef(raw: ApiBillRef): BillRef {
  return {
    id: String(raw.id),
    company: raw.company,
    vendor: raw.vendor,
    number: raw.number,
    billedOn: raw.billed_on,
    dueOn: raw.due_on,
    days: raw.days,
    amount: raw.amount,
    balance: raw.balance,
    status: raw.status,
    flags: (raw.flags ?? []).map(toFlag),
  };
}

export function toCoverage(raw: ApiCoverage): Coverage {
  return {
    company: raw.company,
    dueNext30: raw.due_next_30,
    margin30: raw.margin_30,
    matched: raw.matched,
    ratio: raw.ratio,
    covered: raw.covered,
    shortfall: raw.shortfall,
  };
}

export function toCompanyTotal(raw: ApiCompanyTotal): CompanyWeek {
  return {
    company: raw.company,
    outstanding: raw.outstanding,
    pastDue: raw.past_due,
    bills: raw.bills,
    pastDueBills: raw.past_due_bills,
    bank: raw.bank ?? null,
    bankAccounts: raw.bank_accounts ?? 0,
    need7: raw.need_7 ?? 0,
    left7: raw.left_7 ?? null,
    cushion: raw.cushion ?? 0,
    verdict: raw.verdict ?? "no_bank",
  };
}

const EMPTY_CHANGES = {
  newBills: { count: 0, amount: 0 },
  wentLate: { count: 0, amount: 0 },
  paid: { count: 0, amount: 0 },
  topVendor: null,
};

export function toFinanceOverview(raw: ApiFinanceAp): FinanceOverview {
  return {
    bills: raw.bills.map(toBill),
    /** Every connected company, in the backend's order — including one owed nothing,
     * which still deserves a tile saying so. */
    companies: raw.companies.map((row) => row.company),
    companyTotals: raw.companies.map(toCompanyTotal),
    vendors: raw.vendors,
    totals: {
      outstanding: raw.totals.outstanding,
      outstandingBills: raw.totals.outstanding_bills,
      pastDue: raw.totals.past_due,
      pastDueBills: raw.totals.past_due_bills,
      due7: raw.totals.due_7,
      due7Bills: raw.totals.due_7_bills,
      due30: raw.totals.due_30,
      due30Bills: raw.totals.due_30_bills,
      bank: raw.totals.bank ?? null,
      need7: raw.totals.need_7 ?? 0,
      left7: raw.totals.left_7 ?? null,
    },
    aging: raw.aging.map((row) => ({
      key: row.key as BucketTotal["key"],
      label: row.label,
      amount: row.amount,
      bills: row.bills,
    })),
    coverage: raw.coverage.map(toCoverage),
    syncedAt: raw.synced_at,
    live: raw.live,
    connected: raw.connected,
    note: raw.note
      ? {
          tone: raw.note.tone,
          headline: raw.note.headline,
          body: raw.note.body,
          actions: raw.note.actions.map((a) => ({
            label: a.label,
            href: a.href ?? null,
            billId: a.bill_id != null ? String(a.bill_id) : null,
          })),
        }
      : null,
    changes: raw.changes
      ? {
          newBills: raw.changes.new_bills,
          wentLate: raw.changes.went_late,
          paid: raw.changes.paid,
          topVendor: raw.changes.top_vendor,
        }
      : EMPTY_CHANGES,
  };
}

function toConnection(row: ApiConnection): QboConnection {
  return {
    id: row.id,
    companyName: row.company_name,
    realmIdMasked: row.realm_id_masked,
    status: row.status,
    lastSyncedAt: row.last_synced_at,
    lastError: row.last_error,
    connectedAt: row.connected_at,
    sync: row.sync
      ? {
          state: row.sync.state,
          step: row.sync.step,
          steps: row.sync.steps,
          label: row.sync.label,
          startedAt: row.sync.started_at,
          first: row.sync.first,
        }
      : null,
    // Absent on a backend older than SPEC-339: a single-currency company.
    homeCurrency: row.home_currency ?? null,
    fxMissing: row.fx_missing ?? [],
  };
}

export function toConnections(raw: ApiConnections): ConnectionsOverview {
  return {
    connections: raw.connections.map(toConnection),
    connected: raw.connected,
    ready: raw.ready,
    configured: raw.configured,
    syncing: raw.syncing ?? false,
    reportingCurrency: raw.reporting_currency ?? "",
    rates: (raw.rates ?? []).map((r) => ({ currency: r.currency, rate: r.rate, source: r.source, asOf: r.as_of })),
  };
}

export function toBillDetail(raw: ApiBillDetail): BillDetail {
  return {
    bill: toBill(raw.bill),
    lines: raw.lines ?? [],
    payments: raw.payments ?? [],
    otherOpen: (raw.other_open ?? []).map(toBillRef),
  };
}

export function toRunPlan(raw: ApiRun): RunPlan {
  return {
    through: raw.through,
    throughDate: raw.through_date,
    days: raw.days,
    rows: raw.rows.map((row) => ({
      bill: toBillRef(row.bill),
      reason: row.reason,
      daysLate: row.days_late ?? null,
      deadline: row.deadline ?? null,
      save: row.save ?? null,
      dueIn: row.due_in ?? null,
      selected: row.selected,
      heldReason: row.held_reason,
    })),
    companies: raw.companies,
    live: raw.live,
  };
}

export function toCashOutlook(raw: ApiCash): CashOutlook {
  return {
    company: raw.company,
    companies: raw.companies,
    bank: raw.bank,
    bankAccounts: raw.bank_accounts,
    takingsPerWeek: raw.takings_per_week,
    takingsByCompany: raw.takings_by_company,
    cushion: raw.cushion,
    weeks: raw.weeks.map((w) => ({
      week: w.week,
      start: w.start,
      end: w.end,
      takings: w.takings,
      billsDue: w.bills_due,
      bills: w.bills,
      lateIncluded: w.late_included,
      balance: w.balance,
      belowCushion: w.below_cushion,
      overdrawn: w.overdrawn,
    })),
    lowest: raw.lowest,
    excludes: raw.excludes,
    live: raw.live,
  };
}

function toAgingRow(raw: ApiAgingRow): AgingRow {
  return {
    company: raw.company,
    buckets: raw.buckets,
    bills: raw.bills,
    total: raw.total,
    pastDue: raw.past_due,
    pastDueShare: raw.past_due_share,
  };
}

export function toAgingReport(raw: ApiAging): AgingReport {
  return {
    bands: raw.bands,
    companies: raw.companies.map(toAgingRow),
    total: toAgingRow(raw.total),
    concentration: raw.concentration,
    other: raw.other,
    vendors: raw.vendors,
    trend: raw.trend.map((p) => ({ date: p.date, outstanding: p.outstanding, pastDue: p.past_due })),
    live: raw.live,
  };
}

export function toVendorRow(raw: ApiVendorRow): VendorRow {
  return {
    key: raw.key,
    vendor: raw.vendor,
    companies: raw.companies,
    openBills: raw.open_bills,
    owed: raw.owed,
    pastDue: raw.past_due,
    nextDue: raw.next_due,
    terms: raw.terms,
    typical: raw.typical,
    avgDaysToPay: raw.avg_days_to_pay,
    onTimeRate: raw.on_time_rate,
    paidBills: raw.paid_bills,
    measuredBills: raw.measured_bills,
    firstSeen: raw.first_seen,
    isNew: raw.new,
  };
}

export function toVendorsReport(raw: ApiVendors): VendorsReport {
  return {
    vendors: raw.vendors.map(toVendorRow),
    summary: {
      count: raw.summary.count,
      shared: raw.summary.shared,
      top: raw.summary.top,
      avgDaysToPay: raw.summary.avg_days_to_pay,
    },
    live: raw.live,
  };
}

export function toVendorDetail(raw: ApiVendorDetail): VendorDetail {
  return {
    vendor: toVendorRow(raw.vendor),
    bills: raw.bills.map(toBillRef),
    byCompany: raw.by_company,
    payments: raw.payments,
  };
}

export function toFinanceProfile(raw: ApiProfile): FinanceProfile {
  const card = raw.scorecard;
  return {
    scorecard: {
      paid: card.paid,
      onTimeRate: card.on_time_rate,
      avgDaysToPay: card.avg_days_to_pay,
      measuredBills: card.measured_bills,
      discounts: card.discounts,
      openFlags: {
        duplicate: card.open_flags.duplicate,
        unusual: card.open_flags.unusual,
        newVendor: card.open_flags.new_vendor,
        discount: card.open_flags.discount,
      },
    },
    books: raw.books.map((b) => ({ ...toConnection(b), openBills: b.open_bills })),
    lastRead: raw.last_read,
    nextRead: raw.next_read,
    live: raw.live,
  };
}

// ── the value ledger (SPEC-330 / backend SPEC-338) ──────────────────────────

interface ApiValueSum {
  count: number;
  amount: number;
}

interface ApiGain {
  amount: number;
  before: number;
  now: number;
}

export interface ApiFinding {
  id: number | null;
  kind: Finding["kind"];
  status: Finding["status"];
  company: string;
  other_company: string | null;
  vendor: string;
  number: string | null;
  amount: number;
  outcome: number | null;
  verified: Finding["verified"];
  deadline: string | null;
  first_seen: string | null;
  resolved_on: string | null;
  note: string | null;
  dismiss_reason: string | null;
  bill_id: number | null;
}

export interface ApiBaseline {
  from: string;
  to: string;
  bills: number;
  spend: number;
  frozen: boolean;
  discounts: { offered: number; taken: number; kept: number; missed: number };
  late: { count: number; share: number | null; avg_days: number | null; amount: number; fees: number };
  early: { count: number; avg_days: number | null; amount: number; cost: number };
  paid_twice: {
    count: number;
    amount: number;
    items: {
      vendor: string;
      number: string | null;
      amount: number;
      copies: number;
      extra: number;
      companies: string[];
      paid_on: string[];
    }[];
  };
}

export interface ApiValue {
  sample: boolean;
  live: boolean;
  month: string;
  months: string[];
  connected_since: string | null;
  headline: { measured: number; estimated: number; total: number; hours: number };
  measured: { discounts_kept: ApiValueSum; duplicates_stopped: ApiValueSum };
  lost: { discounts_missed: ApiValueSum; paid_twice: ApiValueSum };
  estimated: {
    time: { hours: number; amount: number; days: number; companies: number };
    timing: ApiGain | null;
    late_fees: ApiGain | null;
  };
  at_stake: {
    discounts: ApiValueSum & { soonest: string | null };
    duplicates: ApiValueSum;
    late_fees: ApiValueSum & { owed: number };
  };
  since_connected: { measured: number; count: number; hours: number };
  ledger: ApiFinding[];
  baseline: ApiBaseline | null;
  assumptions: ValueAssumption[];
  exposure: { text: string; source: string; url: string }[];
}

const sum = (raw: ApiValueSum): { count: number; amount: number } => ({ count: raw.count, amount: raw.amount });

const gain = (raw: ApiGain | null): ValueGain | null =>
  raw ? { amount: raw.amount, before: raw.before, now: raw.now } : null;

export function toFinding(raw: ApiFinding): Finding {
  return {
    id: raw.id,
    kind: raw.kind,
    status: raw.status,
    company: raw.company,
    otherCompany: raw.other_company,
    vendor: raw.vendor,
    number: raw.number,
    amount: raw.amount,
    outcome: raw.outcome,
    verified: raw.verified,
    deadline: raw.deadline,
    firstSeen: raw.first_seen,
    resolvedOn: raw.resolved_on,
    note: raw.note,
    dismissReason: raw.dismiss_reason,
    billId: raw.bill_id == null ? null : String(raw.bill_id),
  };
}

export function toBaseline(raw: ApiBaseline): ValueBaseline {
  return {
    from: raw.from,
    to: raw.to,
    bills: raw.bills,
    spend: raw.spend,
    frozen: raw.frozen,
    discounts: { ...raw.discounts },
    late: {
      count: raw.late.count,
      share: raw.late.share,
      avgDays: raw.late.avg_days,
      amount: raw.late.amount,
      fees: raw.late.fees,
    },
    early: {
      count: raw.early.count,
      avgDays: raw.early.avg_days,
      amount: raw.early.amount,
      cost: raw.early.cost,
    },
    paidTwice: {
      count: raw.paid_twice.count,
      amount: raw.paid_twice.amount,
      items: raw.paid_twice.items.map((item) => ({
        vendor: item.vendor,
        number: item.number,
        amount: item.amount,
        copies: item.copies,
        extra: item.extra,
        companies: item.companies,
        paidOn: item.paid_on,
      })),
    },
  };
}

export function toFinanceValue(raw: ApiValue): FinanceValue {
  return {
    sample: raw.sample,
    live: raw.live,
    month: raw.month,
    months: raw.months,
    connectedSince: raw.connected_since,
    headline: { ...raw.headline },
    measured: {
      discountsKept: sum(raw.measured.discounts_kept),
      duplicatesStopped: sum(raw.measured.duplicates_stopped),
    },
    lost: {
      discountsMissed: sum(raw.lost.discounts_missed),
      paidTwice: sum(raw.lost.paid_twice),
    },
    estimated: {
      time: { ...raw.estimated.time },
      timing: gain(raw.estimated.timing),
      lateFees: gain(raw.estimated.late_fees),
    },
    atStake: {
      discounts: { ...sum(raw.at_stake.discounts), soonest: raw.at_stake.discounts.soonest },
      duplicates: sum(raw.at_stake.duplicates),
      lateFees: { ...sum(raw.at_stake.late_fees), owed: raw.at_stake.late_fees.owed },
    },
    sinceConnected: { ...raw.since_connected },
    ledger: raw.ledger.map(toFinding),
    baseline: raw.baseline ? toBaseline(raw.baseline) : null,
    assumptions: raw.assumptions.map((a) => ({ ...a })),
    exposure: raw.exposure.map((e) => ({ ...e })),
  };
}
