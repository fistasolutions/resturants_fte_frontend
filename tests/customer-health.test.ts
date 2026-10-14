import { describe, expect, it } from "vitest";

import { adaptCustomerHealth, type ApiCustomerHealth } from "@/lib/adapters";
import {
  coverageLine,
  countCell,
  healthBadgeClass,
  healthTiles,
  lastOrderCell,
  refundsCell,
  returnsCell,
  ticketsCell,
} from "@/lib/customer-health";
import { FULL_YEAR, healthSpan } from "@/lib/customer-health";
import type { CustomerHealthData, CustomerHealthRow } from "@/types/customers";

function row(over: Partial<CustomerHealthRow> = {}): CustomerHealthRow {
  return {
    customerId: 1,
    name: "Gitty Farkas",
    email: "g@example.com",
    orders: 68,
    spent: 78268.4,
    refunds: 57,
    refunded: 44520.1,
    refundPct: 56.9,
    net: 33748.3,
    lastOrderAt: "2026-09-15",
    daysSinceLastOrder: 0,
    avgGapDays: 5.4,
    loopReturns: 0,
    loopOpen: 0,
    tickets: 1,
    openTickets: 0,
    lastTicketAt: "2026-07-01",
    openTicketReason: null,
    openTicketSince: null,
    verdict: "draining",
    verdictLabel: "Draining",
    verdictTone: "bad",
    why: "Sent back 57% of $78.3K (57 refunds) — costs more than it brings",
    ...over,
  };
}

const summary: CustomerHealthData["summary"] = {
  customers: 50,
  spendReviewed: 1647921.29,
  openIssue: 0,
  goingQuiet: 6,
  draining: 7,
  healthy: 37,
  atStake: 252885.2,
  refundedByDraining: 136266.1,
  ticketEmailCoveragePct: 57,
};

describe("healthBadgeClass", () => {
  it("uses semantic tokens only", () => {
    expect(healthBadgeClass("bad")).toBe("bg-destructive/10 text-destructive");
    expect(healthBadgeClass("warn")).toBe("bg-warning/10 text-warning");
    expect(healthBadgeClass("neutral")).toBe("bg-muted text-foreground");
    expect(healthBadgeClass("good")).toBe("bg-success/10 text-success");
  });
});

describe("healthTiles", () => {
  it("is reviewed first, then every verdict in the backend's order, with the money that matters", () => {
    const tiles = healthTiles(summary);
    expect(tiles.map((t) => t.key)).toEqual(["reviewed", "open_issue", "going_quiet", "draining", "healthy"]);
    expect(tiles[0]).toMatchObject({ value: "50", sub: "$1.6M in 12 months", tone: "plain" });
    expect(tiles[2]).toMatchObject({ value: "6", sub: "$252.9K a year at stake", tone: "neutral" });
    expect(tiles[3]).toMatchObject({ value: "7", sub: "$136.3K sent back", tone: "bad" });
  });

  it("never prints a money line for an empty verdict", () => {
    const tiles = healthTiles({ ...summary, goingQuiet: 0, openIssue: 0, draining: 0, atStake: 0, refundedByDraining: 0 });
    expect(tiles[2].sub).toBeNull();
    expect(tiles[3].sub).toBeNull();
  });
});

describe("coverageLine", () => {
  it("states the window, the email match and its ceiling", () => {
    expect(coverageLine({ windowDays: 365, coveredDays: 365, coveredSince: null, summary, customers: [] })).toBe(
      "Top spenders of the last 12 months. Refunds are Shopify's ledger; Loop returns and Gorgias tickets are matched on the customer's email (57% of tickets carry one). Going quiet is the same rule as the winback list.",
    );
    expect(
      coverageLine({
        windowDays: 365,
        coveredDays: 365,
        coveredSince: null,
        summary: { ...summary, ticketEmailCoveragePct: null },
        customers: [],
      }),
    ).toContain("(no tickets in the window)");
  });
});

describe("cells", () => {
  it("read the last order against the usual gap", () => {
    expect(lastOrderCell(row())).toBe("today · ~5 d");
    expect(lastOrderCell(row({ daysSinceLastOrder: 1 }))).toBe("yesterday · ~5 d");
    expect(lastOrderCell(row({ daysSinceLastOrder: 153, avgGapDays: 9.9 }))).toBe("153 d ago · ~10 d");
    expect(lastOrderCell(row({ daysSinceLastOrder: 181, avgGapDays: null }))).toBe("181 d ago");
  });

  it("read refunds as a count and the share taken back", () => {
    expect(refundsCell(row())).toBe("57 · 56.9%");
    expect(refundsCell(row({ refunds: 0, refunded: 0, refundPct: 0 }))).toBe("—");
    expect(refundsCell(row({ refunds: 2, refundPct: null }))).toBe("2");
  });

  it("flag open returns and tickets, dash out none", () => {
    expect(countCell(0, 0)).toEqual({ text: "—", open: false });
    expect(countCell(3, 0)).toEqual({ text: "3", open: false });
    expect(countCell(3, 1)).toEqual({ text: "3 (1 open)", open: true });
    expect(returnsCell(row({ loopReturns: 2, loopOpen: 1 }))).toEqual({ text: "2 (1 open)", open: true });
    expect(ticketsCell(row())).toEqual({ text: "1", open: false });
  });
});

describe("adaptCustomerHealth", () => {
  it("maps snake_case and keeps nulls", () => {
    const raw: ApiCustomerHealth = {
      window_days: 365,
      summary: {
        customers: 1, spend_reviewed: 700, open_issue: 0, going_quiet: 1, draining: 0, healthy: 0,
        at_stake: 700, refunded_by_draining: 0, ticket_email_coverage_pct: null,
      },
      customers: [{
        customer_id: 9005, name: "Eve V", email: null, orders: 2, spent: 700, refunds: 0, refunded: 0,
        refund_pct: 0, net: 700, last_order_at: "2026-02-27", days_since_last_order: 200, avg_gap_days: null,
        loop_returns: 0, loop_open: 0, tickets: 0, open_tickets: 0, last_ticket_at: null,
        open_ticket_reason: null, open_ticket_since: null, verdict: "going_quiet",
        verdict_label: "Going quiet", verdict_tone: "neutral", why: "Last order 200 days ago; $700 a year going quiet",
      }],
    };
    const data = adaptCustomerHealth(raw);
    expect(data.summary.ticketEmailCoveragePct).toBeNull();
    expect(data.customers[0]).toMatchObject({
      customerId: 9005, email: null, avgGapDays: null, lastTicketAt: null, verdict: "going_quiet",
      daysSinceLastOrder: 200,
    });
  });
});


describe("short history and connected sources (SPEC-365)", () => {
  const year: CustomerHealthData = { windowDays: 365, coveredDays: 365, coveredSince: "2025-10-09", summary, customers: [] };
  const month: CustomerHealthData = { ...year, coveredDays: 30, coveredSince: "2026-09-09" };

  it("speaks of a full year only when the store has one", () => {
    expect(healthSpan(year)).toBe(FULL_YEAR);
    expect(healthSpan(month)).toEqual({
      within: "since 9 Sep",
      atStake: "at stake since 9 Sep",
      basis: "since 9 Sep",
    });
    expect(healthSpan({ ...month, coveredSince: null })).toBe(FULL_YEAR); // an older backend
    expect(healthTiles(summary, healthSpan(month))[0].sub).toBe("$1.6M since 9 Sep");
    expect(healthTiles(summary, healthSpan(month))[2].sub).toBe("$252.9K at stake since 9 Sep");
  });

  it("names only the connected sources, and keeps today's line for a full store", () => {
    expect(coverageLine(year)).toBe(
      "Top spenders of the last 12 months. Refunds are Shopify's ledger; Loop returns and Gorgias tickets are matched on the customer's email (57% of tickets carry one). Going quiet is the same rule as the winback list.",
    );
    expect(coverageLine(month, { loop: false, gorgias: false })).toBe(
      "Top spenders since 9 Sep. Refunds are Shopify's ledger; Returns and tickets join the table once Loop or Gorgias is connected. Going quiet is the same rule as the winback list.",
    );
    expect(coverageLine(year, { loop: true, gorgias: false })).toBe(
      "Top spenders of the last 12 months. Refunds are Shopify's ledger; Loop returns is matched on the customer's email. Going quiet is the same rule as the winback list.",
    );
  });

  it("reads the covered window from the backend, falling back to the full year", () => {
    const base = { window_days: 365, summary: { customers: 0, spend_reviewed: 0, open_issue: 0, going_quiet: 0, draining: 0, healthy: 0, at_stake: 0, refunded_by_draining: 0, ticket_email_coverage_pct: null }, customers: [] } as ApiCustomerHealth;
    expect(adaptCustomerHealth({ ...base, covered_days: 30, covered_since: "2026-09-09" })).toMatchObject({ coveredDays: 30, coveredSince: "2026-09-09" });
    expect(adaptCustomerHealth(base)).toMatchObject({ coveredDays: 365, coveredSince: null });
  });
});
