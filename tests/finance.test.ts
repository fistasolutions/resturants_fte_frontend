import { describe, expect, it } from "vitest";

import {
  compactMoney,
  AGING,
  EMPTY_FILTERS,
  agingOf,
  bucketTotals,
  companyTotals,
  daysUntil,
  dueLabel,
  filterBills,
  filtersFromParams,
  hasFilters,
  inWindow,
  paramsFromFilters,
  FINANCE_TAB_IDS,
  financeHref,
  flagLabel,
  normalizeFinanceTab,
  normalizeThrough,
  pageOf,
  qboBillUrl,
  sortBills,
  sumBalance,
  toggledFilters,
  vendorKey,
} from "@/lib/finance";
import type { Bill } from "@/types/finance";

const TODAY = new Date("2026-09-23T09:30:00");

function bill(over: Partial<Bill> = {}): Bill {
  return {
    id: "b1",
    txnId: "4101",
    realmId: "9130123456784471",
    number: "LAW-4201",
    vendor: "Hanover Textiles",
    category: "Fabric",
    company: "Lawrence",
    billedOn: "2026-08-24",
    dueOn: "2026-09-23",
    amount: 1000,
    balance: 1000,
    status: "open",
    terms: "Net 30",
    memo: "Autumn restock",
    lines: 2,
    currency: "USD",
    originalAmount: null,
    originalBalance: null,
    fxRate: null,
    flags: [],
    createdAt: null,
    ...over,
  };
}

describe("daysUntil", () => {
  it("counts whole days, ignoring the time of day", () => {
    expect(daysUntil("2026-09-23", TODAY)).toBe(0);
    expect(daysUntil("2026-09-30", TODAY)).toBe(7);
    expect(daysUntil("2026-09-16", TODAY)).toBe(-7);
  });
});

describe("aging", () => {
  it("puts a bill in exactly one bucket", () => {
    const cases: [string, string][] = [
      ["2026-10-05", "current"],
      ["2026-09-23", "current"],
      ["2026-09-22", "1-30"],
      ["2026-08-24", "1-30"],
      ["2026-08-23", "31-60"],
      ["2026-07-25", "31-60"],
      ["2026-07-24", "61-90"],
      ["2026-06-25", "61-90"],
      ["2026-06-24", "90+"],
    ];
    for (const [due, expected] of cases) {
      expect(agingOf(bill({ dueOn: due }), TODAY), due).toBe(expected);
    }
  });

  it("every bill lands in one and only one bucket", () => {
    // One bill per band plus two that share one — the partition has to hold whatever
    // the payable looks like, so it is asserted against the sums, not a fixture.
    const spread = [
      bill({ id: "x1", dueOn: "2026-12-01", balance: 100 }),
      bill({ id: "x2", dueOn: "2026-09-10", balance: 200 }),
      bill({ id: "x3", dueOn: "2026-08-10", balance: 300 }),
      bill({ id: "x4", dueOn: "2026-07-10", balance: 400 }),
      bill({ id: "x5", dueOn: "2026-05-01", balance: 500 }),
      bill({ id: "x6", dueOn: "2026-05-02", balance: 600 }),
    ];
    const totals = bucketTotals(spread, TODAY);
    expect(totals.map((b) => b.key)).toEqual(AGING.map((a) => a.key));
    expect(totals.reduce((t, b) => t + b.bills, 0)).toBe(spread.length);
    expect(totals.reduce((t, b) => t + b.amount, 0)).toBeCloseTo(sumBalance(spread), 2);
  });
});

describe("windows", () => {
  it("past due, 7 and 30 days do not overlap where they should not", () => {
    const late = bill({ dueOn: "2026-09-20" });
    const soon = bill({ dueOn: "2026-09-27" });
    const later = bill({ dueOn: "2026-10-20" });
    expect(inWindow(late, "past", TODAY)).toBe(true);
    expect(inWindow(late, "7", TODAY)).toBe(false);
    expect(inWindow(soon, "7", TODAY)).toBe(true);
    expect(inWindow(soon, "30", TODAY)).toBe(true);
    expect(inWindow(later, "7", TODAY)).toBe(false);
    expect(inWindow(later, "30", TODAY)).toBe(true);
    for (const b of [late, soon, later]) expect(inWindow(b, "all", TODAY)).toBe(true);
  });
});

describe("totals", () => {
  it("sums the REMAINING balance, never the original amount", () => {
    const bills = [bill({ amount: 1000, balance: 250 }), bill({ id: "b2", amount: 500, balance: 500 })];
    expect(sumBalance(bills)).toBe(750);
  });

  it("company totals split the outstanding and the past due", () => {
    const bills = [
      bill({ company: "Lawrence", balance: 100, dueOn: "2026-09-01" }),
      bill({ id: "b2", company: "Lawrence", balance: 200, dueOn: "2026-10-01" }),
      bill({ id: "b3", company: "Pomona", balance: 50, dueOn: "2026-09-01" }),
    ];
    const totals = companyTotals(bills, ["Lawrence", "Pomona", "Jackson"], TODAY);
    expect(totals[0]).toEqual({
      company: "Lawrence",
      outstanding: 300,
      pastDue: 100,
      bills: 2,
      pastDueBills: 1,
    });
    expect(totals[2]).toEqual({
      company: "Jackson",
      outstanding: 0,
      pastDue: 0,
      bills: 0,
      pastDueBills: 0,
    });
  });
});

describe("filtering", () => {
  const bills = [
    bill({ company: "Lawrence", vendor: "Hanover Textiles", status: "open", dueOn: "2026-09-01" }),
    bill({ id: "b2", company: "Pomona", vendor: "Redline Couriers", status: "partial", dueOn: "2026-09-27" }),
    bill({ id: "b3", company: "Jackson", vendor: "Hanover Textiles", status: "open", dueOn: "2026-11-01", memo: "Wool crepe" }),
  ];

  it("no filters means every bill", () => {
    expect(filterBills(bills, EMPTY_FILTERS, TODAY)).toHaveLength(3);
  });

  it("filters combine", () => {
    const rows = filterBills(bills, { ...EMPTY_FILTERS, vendor: "Hanover Textiles", window: "past" }, TODAY);
    expect(rows.map((b) => b.id)).toEqual(["b1"]);
  });

  it("search reaches the vendor, number, memo and category", () => {
    expect(filterBills(bills, { ...EMPTY_FILTERS, q: "wool" }, TODAY).map((b) => b.id)).toEqual(["b3"]);
    expect(filterBills(bills, { ...EMPTY_FILTERS, q: "COURIERS" }, TODAY).map((b) => b.id)).toEqual(["b2"]);
    expect(filterBills(bills, { ...EMPTY_FILTERS, q: "   " }, TODAY)).toHaveLength(3);
  });

  it("status and age narrow further", () => {
    expect(filterBills(bills, { ...EMPTY_FILTERS, status: "partial" }, TODAY).map((b) => b.id)).toEqual(["b2"]);
    expect(filterBills(bills, { ...EMPTY_FILTERS, age: "1-30" }, TODAY).map((b) => b.id)).toEqual(["b1"]);
  });
});

describe("sorting", () => {
  const bills = [
    bill({ id: "a", vendor: "Zenith", balance: 10 }),
    bill({ id: "b", vendor: "Acme", balance: 30 }),
    bill({ id: "c", vendor: "Meridian", balance: 20 }),
  ];

  it("sorts ascending and descending without mutating the input", () => {
    expect(sortBills(bills, "vendor", 1).map((b) => b.id)).toEqual(["b", "c", "a"]);
    expect(sortBills(bills, "balance", -1).map((b) => b.id)).toEqual(["b", "c", "a"]);
    expect(bills.map((b) => b.id)).toEqual(["a", "b", "c"]);
  });

  it("is stable, so paging never reshuffles equal rows", () => {
    const tied = [bill({ id: "x", balance: 5 }), bill({ id: "y", balance: 5 }), bill({ id: "z", balance: 5 })];
    expect(sortBills(tied, "balance", 1).map((b) => b.id)).toEqual(["x", "y", "z"]);
    expect(sortBills(tied, "balance", -1).map((b) => b.id)).toEqual(["x", "y", "z"]);
  });
});

describe("labels and links", () => {
  it("says how late or how soon in plain words", () => {
    expect(dueLabel(bill({ dueOn: "2026-09-23" }), TODAY)).toBe("due today");
    expect(dueLabel(bill({ dueOn: "2026-09-28" }), TODAY)).toBe("in 5d");
    expect(dueLabel(bill({ dueOn: "2026-08-23" }), TODAY)).toBe("31d late");
  });

  it("links to the transaction in QuickBooks", () => {
    expect(qboBillUrl(bill({ txnId: "4101" }))).toBe(
      "https://app.qbo.intuit.com/app/bill?txnId=4101",
    );
  });
});

describe("filters in the URL", () => {
  it("round-trips, and carries only what differs from the default", () => {
    expect(paramsFromFilters(EMPTY_FILTERS)).toBe("");
    expect(hasFilters(EMPTY_FILTERS)).toBe(false);
    const filters = { ...EMPTY_FILTERS, company: "Pomona", window: "past" as const, age: "31-60" as const, q: " rent " };
    const query = paramsFromFilters(filters);
    expect(query).toContain("company=Pomona");
    expect(filtersFromParams(new URLSearchParams(query))).toEqual({
      ...filters,
      q: "rent",
    });
  });

  it("ignores junk rather than throwing", () => {
    const parsed = filtersFromParams(new URLSearchParams("window=someday&age=ancient&status=weird"));
    expect(parsed).toEqual(EMPTY_FILTERS);
  });
});

describe("the tiles are links (SPEC-299, SPEC-301)", () => {
  it("builds the page's own URL for a tab and a set of filters", () => {
    expect(financeHref("overview", EMPTY_FILTERS)).toBe("/employees/finance");
    expect(financeHref("bills", EMPTY_FILTERS)).toBe("/employees/finance?tab=bills");
    expect(financeHref("bills", { ...EMPTY_FILTERS, window: "past" })).toBe(
      "/employees/finance?window=past&tab=bills",
    );
    expect(financeHref("vendors", { ...EMPTY_FILTERS, company: "Lawrence", age: "1-30" })).toBe(
      "/employees/finance?company=Lawrence&age=1-30&tab=vendors",
    );
  });

  it("carries a tab's own parameter and drops an empty one", () => {
    expect(financeHref("run", EMPTY_FILTERS, { through: "month" })).toBe("/employees/finance?tab=run&through=month");
    expect(financeHref("run", EMPTY_FILTERS, { through: null })).toBe("/employees/finance?tab=run");
    expect(financeHref("cash", EMPTY_FILTERS, { company: "Pomona" })).toBe("/employees/finance?tab=cash&company=Pomona");
  });

  it("pressing the tile that is already on clears it", () => {
    const on = toggledFilters(EMPTY_FILTERS, "window", "past", "all");
    expect(on.window).toBe("past");
    expect(toggledFilters(on, "window", "past", "all").window).toBe("all");
    const both = toggledFilters(on, "company", "Pomona", "all");
    expect(both).toMatchObject({ window: "past", company: "Pomona" });
    expect(toggledFilters(both, "age", "90+", null).age).toBe("90+");
    expect(toggledFilters({ ...both, age: "90+" }, "age", "90+", null).age).toBe(null);
  });

  it("a filtered view survives a round trip through the URL", () => {
    const filters = { ...EMPTY_FILTERS, company: "Jackson", window: "7" as const, q: "hanover", watch: true, group: "vendor" as const };
    const href = financeHref("bills", filters);
    const params = new URLSearchParams(href.slice(href.indexOf("?")));
    expect(filtersFromParams(params)).toMatchObject(filters);
  });
});

describe("v2 filters, tabs and paging (SPEC-301)", () => {
  it("the Flagged view keeps only bills the rules flagged", () => {
    const flagged = bill({ id: "f", flags: [{ kind: "new_vendor" }] });
    const plain = bill({ id: "p" });
    expect(filterBills([flagged, plain], { ...EMPTY_FILTERS, watch: true }, TODAY).map((b) => b.id)).toEqual(["f"]);
  });

  it("an unknown group falls back to no grouping", () => {
    expect(filtersFromParams(new URLSearchParams("group=colour")).group).toBe("none");
    expect(filtersFromParams(new URLSearchParams("group=company")).group).toBe("company");
  });

  it("knows the eight tabs and nothing else", () => {
    expect(FINANCE_TAB_IDS).toEqual(["overview", "value", "bills", "run", "aging", "vendors", "cash", "chat", "profile"]);
    expect(normalizeFinanceTab("run")).toBe("run");
    expect(normalizeFinanceTab("ar")).toBe("overview");
    expect(normalizeThrough("next")).toBe("next");
    expect(normalizeThrough("forever")).toBe("week");
  });

  it("pages clamp at both ends", () => {
    const rows = Array.from({ length: 60 }, (_, i) => i);
    expect(pageOf(rows, 1, 25)).toMatchObject({ page: 1, pages: 3 });
    expect(pageOf(rows, 3, 25).rows).toEqual(rows.slice(50));
    expect(pageOf(rows, 99, 25).page).toBe(3);
    expect(pageOf([], 1, 25)).toEqual({ rows: [], page: 1, pages: 1 });
  });

  it("vendor keys match the backend's slug exactly", () => {
    // backend SPEC-295 `vendor_slug` — the same three cases its own test pins.
    expect(vendorKey("Birch & Pine Cleaning")).toBe("birch-and-pine-cleaning");
    expect(vendorKey("  Marlow Denim Co. ")).toBe("marlow-denim-co");
    expect(vendorKey("")).toBe("vendor");
  });

  it("names every flag in the owner's words", () => {
    expect(flagLabel({ kind: "duplicate", otherId: "2", second: true, across: false }, 100).text).toBe("Possible second copy");
    expect(flagLabel({ kind: "duplicate", otherId: "2", second: true, across: true }, 100).text).toBe(
      "Same bill in another company",
    );
    expect(flagLabel({ kind: "unusual", typical: 1000 }, 9860)).toEqual({ text: "10× usual amount", tone: "warn" });
    expect(flagLabel({ kind: "new_vendor" }, 1).tone).toBe("ai");
    expect(flagLabel({ kind: "discount", deadline: "2026-09-28", daysLeft: 4, save: 250, percent: 2 }, 1).text).toBe(
      "Save $250 by Sep 28",
    );
  });
});

describe("compact money (SPEC-301)", () => {
  it("rounds to whole dollars under $1,000 and goes compact above", () => {
    expect(compactMoney(791.5)).toBe("$792");
    expect(compactMoney(0)).toBe("$0");
    expect(compactMoney(-450.2)).toBe("-$450");
    expect(compactMoney(41200)).toBe("$41.2K");
  });
});
