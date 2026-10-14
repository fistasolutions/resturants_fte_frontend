/**
 * SPEC-330 — the Value tab's adapter and words.
 *
 * What these protect: measured money and estimated money are never one unlabeled number,
 * nothing unknown becomes $0, and the owner's typed assumptions are checked against the
 * backend's own bounds before they are sent.
 */
import { describe, expect, it } from "vitest";

import { toFinanceValue, type ApiValue } from "@/lib/finance-api";
import {
  assumptionDisplay,
  changedAssumptions,
  dismissReasonError,
  filterLedger,
  ledgerCounts,
  monthLabel,
  normalizeLedgerFilter,
  normalizeMonth,
  parseAssumptionInput,
  rowAmount,
  statementLine,
  statusLabel,
  valueHref,
  verifiedLabel,
} from "@/lib/finance-value";
import type { ValueAssumption } from "@/types/finance";

const RAW: ApiValue = {
  sample: false,
  live: true,
  month: "2026-09",
  months: ["2026-09", "2026-08"],
  connected_since: "2026-08-10",
  headline: { measured: 18670, estimated: 223.71, total: 18893.71, hours: 6.4 },
  measured: { discounts_kept: { count: 1, amount: 250 }, duplicates_stopped: { count: 1, amount: 18420 } },
  lost: { discounts_missed: { count: 0, amount: 0 }, paid_twice: { count: 0, amount: 0 } },
  estimated: {
    time: { hours: 6.4, amount: 223.71, days: 15, companies: 3 },
    timing: null,
    late_fees: { amount: 4.5, before: 10, now: 5.5 },
  },
  at_stake: {
    discounts: { count: 1, amount: 40, soonest: "2026-09-18" },
    duplicates: { count: 0, amount: 0 },
    late_fees: { count: 1, amount: 11.25, owed: 3000 },
  },
  since_connected: { measured: 18769, count: 3, hours: 12.1 },
  ledger: [
    {
      id: 4,
      kind: "discount",
      status: "open",
      company: "North",
      other_company: null,
      vendor: "Keystone",
      number: "INV-1",
      amount: 40,
      outcome: null,
      verified: null,
      deadline: "2026-09-18",
      first_seen: "2026-09-10T00:00:00+00:00",
      resolved_on: null,
      note: null,
      dismiss_reason: null,
      bill_id: 77,
    },
    {
      id: 3,
      kind: "duplicate",
      status: "kept",
      company: "South",
      other_company: "Online",
      vendor: "Hanover",
      number: "KL-1",
      amount: 18420,
      outcome: 18420,
      verified: "removed",
      deadline: null,
      first_seen: null,
      resolved_on: "2026-09-15",
      note: "One copy was removed before it was paid.",
      dismiss_reason: null,
      bill_id: null,
    },
    {
      id: 9,
      kind: "discount",
      status: "closed",
      company: "North",
      other_company: null,
      vendor: "Atlas",
      number: null,
      amount: 12,
      outcome: 0,
      verified: null,
      deadline: null,
      first_seen: null,
      resolved_on: "2026-09-02",
      note: null,
      dismiss_reason: null,
      bill_id: null,
    },
  ],
  baseline: {
    from: "2025-08-10",
    to: "2026-08-09",
    bills: 812,
    spend: 1_200_000,
    frozen: true,
    discounts: { offered: 40, taken: 10, kept: 900, missed: 2700 },
    late: { count: 50, share: 0.06, avg_days: 9.2, amount: 80000, fees: 270 },
    early: { count: 300, avg_days: 7.5, amount: 400000, cost: 3300 },
    paid_twice: {
      count: 1,
      amount: 8640,
      items: [
        {
          vendor: "Crestline",
          number: "CT-55120",
          amount: 8640,
          copies: 2,
          extra: 8640,
          companies: ["North"],
          paid_on: ["2026-03-01", "2026-03-10"],
        },
      ],
    },
  },
  assumptions: [
    {
      key: "hourly_rate",
      label: "Cost of an hour of bookkeeping",
      unit: "usd_per_hour",
      value: 34.8,
      default: 34.8,
      min: 0,
      max: 1000,
      kind: "benchmark",
      source: "BLS",
      url: "https://www.bls.gov/",
    },
    {
      key: "cash_yield_pct",
      label: "What a dollar left in the bank earns a year",
      unit: "percent",
      value: 4,
      default: 4,
      min: 0,
      max: 50,
      kind: "ours",
      source: "Our estimate.",
      url: null,
    },
  ],
  exposure: [{ text: "BEC", source: "FBI IC3", url: "https://www.ic3.gov/" }],
};

describe("toFinanceValue", () => {
  const v = toFinanceValue(RAW);

  it("keeps measured and estimated apart", () => {
    expect(v.headline).toEqual({ measured: 18670, estimated: 223.71, total: 18893.71, hours: 6.4 });
    expect(v.measured.duplicatesStopped).toEqual({ count: 1, amount: 18420 });
    expect(v.estimated.timing).toBeNull(); // nothing to compare is not $0
    expect(v.estimated.lateFees).toEqual({ amount: 4.5, before: 10, now: 5.5 });
  });

  it("maps the ledger without inventing a bill page", () => {
    expect(v.ledger[0].billId).toBe("77");
    expect(v.ledger[1].billId).toBeNull();
    expect(v.ledger[1].otherCompany).toBe("Online");
    expect(v.ledger[0].firstSeen).toBe("2026-09-10T00:00:00+00:00");
  });

  it("maps the baseline's paid-twice list", () => {
    expect(v.baseline?.paidTwice.items[0].paidOn).toEqual(["2026-03-01", "2026-03-10"]);
    expect(v.baseline?.late.avgDays).toBe(9.2);
    expect(v.atStake.lateFees.owed).toBe(3000);
  });

  it("keeps a missing baseline missing", () => {
    expect(toFinanceValue({ ...RAW, baseline: null }).baseline).toBeNull();
  });
});

describe("the statement line", () => {
  it("names the measured money first and the estimate as an estimate", () => {
    const line = statementLine(toFinanceValue(RAW), true);
    expect(line).toBe("This month Finance kept $18,670 from your books, and about $224 more, estimated — about 6.4 hours of review.");
  });

  it("says what is at stake rather than a $0 that reads like failure", () => {
    const nothing = toFinanceValue({
      ...RAW,
      headline: { measured: 0, estimated: 0, total: 0, hours: 0 },
    });
    expect(statementLine(nothing, true)).toBe("Nothing kept yet this month — $40 is at stake right now.");
  });

  it("names a past month", () => {
    expect(statementLine(toFinanceValue(RAW), false)).toMatch(/^In September 2026 Finance kept/);
  });
});

describe("the ledger", () => {
  const rows = toFinanceValue(RAW).ledger;

  it("filters by status and counts, closed only under All", () => {
    expect(filterLedger(rows, "open").map((r) => r.id)).toEqual([4]);
    expect(filterLedger(rows, "all")).toHaveLength(3);
    expect(ledgerCounts(rows)).toEqual({ all: 3, open: 1, kept: 1, lost: 0, dismissed: 0 });
  });

  it("names outcomes in the owner's words", () => {
    expect(statusLabel("duplicate", "kept").text).toBe("Stopped");
    expect(statusLabel("duplicate", "lost").text).toBe("Paid twice");
    expect(statusLabel("discount", "lost")).toEqual({ text: "Missed", tone: "destructive" });
    expect(verifiedLabel("amount")).toBe("Paid less than the bill");
    expect(verifiedLabel(null)).toBeNull();
    expect(rowAmount(rows[0])).toBe(40);
    expect(rowAmount(rows[2])).toBe(0);
  });

  it("only accepts filters and months it knows", () => {
    expect(normalizeLedgerFilter("kept")).toBe("kept");
    expect(normalizeLedgerFilter("everything")).toBe("all");
    expect(normalizeMonth("2026-08", ["2026-09", "2026-08"])).toBe("2026-08");
    expect(normalizeMonth("2026-01", ["2026-09"])).toBeNull();
    expect(normalizeMonth("2026-9")).toBeNull();
    expect(monthLabel("2026-09")).toBe("September 2026");
  });

  it("builds the tab's URLs", () => {
    expect(valueHref(null)).toBe("/employees/finance?tab=value");
    expect(valueHref("2026-08", "lost")).toBe("/employees/finance?tab=value&month=2026-08&view=lost");
  });

  it("needs a real reason to clear a finding", () => {
    expect(dismissReasonError("no")).toBe("Say why in a few words.");
    expect(dismissReasonError("Two real deliveries")).toBeNull();
    expect(dismissReasonError("x".repeat(201))).toBe("Keep it under 200 characters.");
  });
});

describe("assumptions", () => {
  const rate = RAW.assumptions[0] as ValueAssumption;
  const yieldPct = RAW.assumptions[1] as ValueAssumption;

  it("parses what an owner types, inside the backend's bounds", () => {
    expect(parseAssumptionInput("$45.50", rate)).toEqual({ ok: true, value: 45.5 });
    expect(parseAssumptionInput("4.5%", yieldPct)).toEqual({ ok: true, value: 4.5 });
    expect(parseAssumptionInput("", rate)).toEqual({ ok: false, error: "Enter a number." });
    expect(parseAssumptionInput("abc", rate)).toEqual({ ok: false, error: "Enter a number." });
    expect(parseAssumptionInput("60", yieldPct)).toEqual({ ok: false, error: "Between 0 and 50." });
  });

  it("sends only what changed", () => {
    const assumptions = [rate, yieldPct];
    expect(changedAssumptions(assumptions, { hourly_rate: "34.8", cash_yield_pct: "5" })).toEqual({
      values: { cash_yield_pct: 5 },
      errors: {},
    });
    expect(changedAssumptions(assumptions, { hourly_rate: "-1" }).errors).toEqual({
      hourly_rate: "Between 0 and 1000.",
    });
  });

  it("displays each unit", () => {
    expect(assumptionDisplay(rate)).toBe("$35 per hour");
    expect(assumptionDisplay(yieldPct)).toBe("4%");
  });
});
