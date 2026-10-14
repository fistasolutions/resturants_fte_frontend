/**
 * SPEC-299 — the QuickBooks payload → the view models.
 *
 * These are somebody's payables, so the tests are about not inventing money: an
 * unmatched company must not report a shortfall, a part-paid bill must keep its original
 * amount, and nothing may quietly become 0 because a field was null.
 */
import { describe, expect, it } from "vitest";

import {
  toBill,
  toBillDetail,
  toCashOutlook,
  toConnections,
  toCoverage,
  toFinanceOverview,
  toFinanceProfile,
  toFlag,
  toRunPlan,
  toVendorsReport,
  type ApiBill,
  type ApiBillRef,
  type ApiFinanceAp,
} from "@/lib/finance-api";

const BILL: ApiBill = {
  id: 41,
  qbo_id: "1035",
  realm_id: "9130123456784471",
  number: "INV-1035",
  vendor: "Hicks Hardware",
  category: "Job Expenses:Job Materials",
  company: "Lawrence",
  billed_on: "2026-09-01",
  due_on: "2026-10-01",
  amount: 1200,
  balance: 400,
  status: "partial",
  terms: "Net 30",
  memo: "Delivery for the Lawrence shop",
  lines: 3,
  currency: "USD",
};

const AP: ApiFinanceAp = {
  bills: [BILL],
  companies: [
    {
      company: "Lawrence",
      realm_id_masked: "9130…4471",
      bills: 4,
      outstanding: 5000,
      past_due: 1200,
      past_due_bills: 2,
    },
  ],
  vendors: ["Hicks Hardware", "Norton Lumber"],
  totals: {
    outstanding: 5000,
    outstanding_bills: 4,
    past_due: 1200,
    past_due_bills: 2,
    due_7: 300,
    due_7_bills: 1,
    due_30: 700,
    due_30_bills: 2,
  },
  aging: [
    { key: "current", label: "Current", amount: 3800, bills: 2 },
    { key: "1-30", label: "1–30 days", amount: 1200, bills: 2 },
    { key: "31-60", label: "31–60 days", amount: 0, bills: 0 },
    { key: "61-90", label: "61–90 days", amount: 0, bills: 0 },
    { key: "90+", label: "90+ days", amount: 0, bills: 0 },
  ],
  coverage: [
    {
      company: "Lawrence",
      due_next_30: 700,
      margin_30: 805382.33,
      matched: true,
      ratio: 1150.5,
      covered: true,
      shortfall: 0,
    },
  ],
  synced_at: "2026-09-23T04:20:00+00:00",
  live: true,
  connected: 1,
};

describe("a bill", () => {
  it("carries what the deep link into QuickBooks needs", () => {
    const bill = toBill(BILL);
    expect(bill.id).toBe("41");
    expect(bill.txnId).toBe("1035");
    expect(bill.realmId).toBe("9130123456784471");
  });

  it("keeps the original amount beside the remaining balance", () => {
    const bill = toBill(BILL);
    expect(bill.amount).toBe(1200);
    expect(bill.balance).toBe(400);
    expect(bill.status).toBe("partial");
  });

  it("never hands the page a null date", () => {
    const bill = toBill(BILL);
    expect(Number.isNaN(new Date(bill.dueOn).getTime())).toBe(false);
    expect(Number.isNaN(new Date(bill.billedOn).getTime())).toBe(false);
  });
});

describe("coverage", () => {
  it("passes a matched company's margin through", () => {
    const row = toCoverage(AP.coverage[0]);
    expect(row).toMatchObject({ matched: true, covered: true, margin30: 805382.33, shortfall: 0 });
  });

  it("keeps an unmatched company's margin null rather than 0", () => {
    const row = toCoverage({
      company: "Sandbox Company_US_1",
      due_next_30: 9000,
      margin_30: null,
      matched: false,
      ratio: null,
      covered: false,
      shortfall: null,
    });
    // 0 would draw a shortfall of the whole 9,000 out of a missing number.
    expect(row.margin30).toBeNull();
    expect(row.shortfall).toBeNull();
    expect(row.matched).toBe(false);
    expect(row.dueNext30).toBe(9000);
  });
});

describe("the payable", () => {
  it("maps the money strip and the aging bands in order", () => {
    const overview = toFinanceOverview(AP);
    expect(overview.totals).toEqual({
      outstanding: 5000,
      outstandingBills: 4,
      pastDue: 1200,
      pastDueBills: 2,
      due7: 300,
      due7Bills: 1,
      due30: 700,
      due30Bills: 2,
      // A backend without SPEC-295's bank read: no bank is unknown, not $0.
      bank: null,
      need7: 0,
      left7: null,
    });
    expect(overview.aging.map((row) => row.key)).toEqual([
      "current",
      "1-30",
      "31-60",
      "61-90",
      "90+",
    ]);
  });

  it("keeps the company names and their totals side by side", () => {
    const overview = toFinanceOverview(AP);
    expect(overview.companies).toEqual(["Lawrence"]);
    expect(overview.companyTotals[0]).toEqual({
      company: "Lawrence",
      outstanding: 5000,
      pastDue: 1200,
      bills: 4,
      pastDueBills: 2,
      bank: null,
      bankAccounts: 0,
      need7: 0,
      left7: null,
      cushion: 0,
      verdict: "no_bank",
    });
    expect(overview.note).toBeNull();
    expect(overview.changes.newBills).toEqual({ count: 0, amount: 0 });
  });

  it("an empty payable is zeroes, not an empty page", () => {
    const overview = toFinanceOverview({
      ...AP,
      bills: [],
      companies: [],
      vendors: [],
      coverage: [],
      totals: { ...AP.totals, outstanding: 0, outstanding_bills: 0 },
      synced_at: null,
      live: false,
      connected: 0,
    });
    expect(overview.bills).toEqual([]);
    expect(overview.totals.outstanding).toBe(0);
    expect(overview.live).toBe(false);
    expect(overview.syncedAt).toBeNull();
    expect(overview.aging).toHaveLength(5);
  });
});

describe("the connections", () => {
  it("carries the masked realm and no token material", () => {
    const overview = toConnections({
      connections: [
        {
          id: 3,
          company_name: "Pomona",
          realm_id_masked: "9130…8852",
          status: "needs_reconnect",
          last_synced_at: null,
          last_error: "QuickBooks asked us to reconnect Pomona.",
          connected_at: "2026-09-20T10:00:00+00:00",
        },
      ],
      connected: 0,
      ready: false,
      configured: true,
    });
    expect(overview.connections[0]).toEqual({
      id: 3,
      companyName: "Pomona",
      realmIdMasked: "9130…8852",
      status: "needs_reconnect",
      lastSyncedAt: null,
      lastError: "QuickBooks asked us to reconnect Pomona.",
      connectedAt: "2026-09-20T10:00:00+00:00",
      // A backend without SPEC-298 has no bar and nothing to poll for.
      sync: null,
      // ...and one without SPEC-339 reports no home currency and nothing waiting on a rate.
      homeCurrency: null,
      fxMissing: [],
    });
    expect(overview.syncing).toBe(false);
    expect(JSON.stringify(overview)).not.toMatch(/token/i);
    expect(overview.ready).toBe(false);
    expect(overview.configured).toBe(true);
  });
});

const REF: ApiBillRef = {
  id: 7,
  company: "Pomona",
  vendor: "Vogue Textiles",
  number: "VT-2217",
  billed_on: "2026-08-22",
  due_on: "2026-09-21",
  days: -3,
  amount: 18420,
  balance: 18420,
  status: "open",
  flags: [{ kind: "duplicate", other_id: 8, second: false }],
};

describe("flags (SPEC-301)", () => {
  it("keep their kind and every figure the page quotes", () => {
    expect(toFlag({ kind: "duplicate", other_id: 8, second: true })).toEqual({
      kind: "duplicate",
      otherId: "8",
      second: true,
      across: false,
    });
    expect(toFlag({ kind: "duplicate", other_id: 8, second: true, across: true })).toMatchObject({ across: true });
    expect(toFlag({ kind: "discount", deadline: "2026-09-28", days_left: 4, save: 250, percent: 2 })).toEqual({
      kind: "discount",
      deadline: "2026-09-28",
      daysLeft: 4,
      save: 250,
      percent: 2,
    });
    expect(toFlag({ kind: "new_vendor" })).toEqual({ kind: "new_vendor" });
  });

  it("a bill from an older backend has no flags rather than failing", () => {
    expect(toBill(BILL).flags).toEqual([]);
    expect(toBill(BILL).createdAt).toBeNull();
  });
});

describe("the bill page", () => {
  it("defaults missing lines, payments and other bills to empty lists", () => {
    const detail = toBillDetail({ bill: BILL });
    expect(detail).toMatchObject({ lines: [], payments: [], otherOpen: [] });
  });

  it("maps the vendor's other open bills with string ids", () => {
    const detail = toBillDetail({ bill: BILL, other_open: [REF], payments: [{ date: null, amount: 800, method: null }] });
    expect(detail.otherOpen[0]).toMatchObject({ id: "7", dueOn: "2026-09-21", days: -3 });
    expect(detail.otherOpen[0].flags[0]).toEqual({ kind: "duplicate", otherId: "8", second: false, across: false });
    expect(detail.payments[0].date).toBeNull();
  });
});

describe("the payment run", () => {
  it("absent reason figures become null, not 0", () => {
    const plan = toRunPlan({
      through: "week",
      through_date: "2026-09-27",
      days: 3,
      rows: [
        { bill: REF, reason: "late", days_late: 3, selected: true, held_reason: null },
        { bill: { ...REF, id: 8 }, reason: "late", days_late: 1, selected: false, held_reason: "Looks like a second copy" },
      ],
      companies: [{ company: "Pomona", bank: null, cushion: 5000 }],
      live: true,
    });
    expect(plan.rows[0]).toMatchObject({ daysLate: 3, deadline: null, save: null, dueIn: null, selected: true });
    expect(plan.rows[1]).toMatchObject({ selected: false, heldReason: "Looks like a second copy" });
    expect(plan.companies[0].bank).toBeNull();
  });
});

describe("the cash outlook", () => {
  it("keeps an unmatched company's takings null", () => {
    const cash = toCashOutlook({
      company: "all",
      companies: ["Lawrence", "Sandbox"],
      bank: 1000,
      bank_accounts: [],
      takings_per_week: 500,
      takings_by_company: { Lawrence: 500, Sandbox: null },
      cushion: 5000,
      weeks: [
        { week: 0, start: "2026-09-24", end: "2026-09-30", takings: 500, bills_due: 2000, bills: 2, late_included: true, balance: -500, below_cushion: true, overdrawn: true },
      ],
      lowest: { start: "2026-09-24", balance: -500 },
      excludes: ["Payroll"],
      live: true,
    });
    expect(cash.takingsByCompany.Sandbox).toBeNull();
    expect(cash.weeks[0]).toMatchObject({ billsDue: 2000, lateIncluded: true, belowCushion: true, overdrawn: true });
  });
});

describe("vendors and the profile", () => {
  it("a vendor never paid through QuickBooks has no days to pay", () => {
    const report = toVendorsReport({
      vendors: [
        {
          key: "vogue-textiles",
          vendor: "Vogue Textiles",
          companies: ["Pomona"],
          open_bills: 2,
          owed: 36840,
          past_due: 36840,
          next_due: null,
          terms: "Net 30",
          typical: null,
          avg_days_to_pay: null,
          on_time_rate: null,
          paid_bills: 0,
          measured_bills: 0,
          first_seen: null,
          new: false,
        },
      ],
      summary: { count: 1, shared: 0, top: null, avg_days_to_pay: null },
      live: true,
    });
    expect(report.vendors[0]).toMatchObject({ avgDaysToPay: null, onTimeRate: null, isNew: false, openBills: 2 });
    expect(report.summary.avgDaysToPay).toBeNull();
  });

  it("the profile's books carry no token material", () => {
    const profile = toFinanceProfile({
      scorecard: {
        paid: { count: 3, amount: 900 },
        on_time_rate: 0.5,
        avg_days_to_pay: 31,
        measured_bills: 2,
        discounts: { offered: 2, taken: 1, saved: 20, missed: 1 },
        open_flags: { duplicate: 2, unusual: 0, new_vendor: 1, discount: 0 },
      },
      books: [
        {
          id: 1,
          company_name: "Lawrence",
          realm_id_masked: "9130…4471",
          status: "connected",
          last_synced_at: null,
          last_error: null,
          connected_at: null,
          open_bills: 4,
        },
      ],
      last_read: null,
      next_read: "2026-09-24T13:20:00+00:00",
      live: true,
    });
    expect(profile.scorecard.openFlags.newVendor).toBe(1);
    expect(profile.books[0]).toMatchObject({ companyName: "Lawrence", openBills: 4 });
    expect(JSON.stringify(profile)).not.toMatch(/token/i);
  });
});

describe("sync progress (SPEC-303)", () => {
  it("maps a company's bar and the list's polling flag", () => {
    const overview = toConnections({
      connections: [
        {
          id: 1,
          company_name: "Lawrence",
          realm_id_masked: "9130…4471",
          status: "connected",
          last_synced_at: null,
          last_error: null,
          connected_at: null,
          sync: { state: "running", step: 3, steps: 7, label: "Reading paid bills", started_at: "2026-09-24T09:00:00+00:00", first: true },
        },
      ],
      connected: 1,
      ready: true,
      configured: true,
      syncing: true,
    });
    expect(overview.connections[0].sync).toEqual({
      state: "running",
      step: 3,
      steps: 7,
      label: "Reading paid bills",
      startedAt: "2026-09-24T09:00:00+00:00",
      first: true,
    });
    expect(overview.syncing).toBe(true);
  });
});
