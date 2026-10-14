import { describe, expect, it } from "vitest";

import {
  DEFAULT_INBOX_VIEW,
  filterQueue,
  inboxHref,
  inboxViewFrom,
  neighbour,
  pageOf,
  selectedTicket,
  sortTickets,
} from "@/lib/support-inbox";
import type { SupportTicket } from "@/types/customer-support";

const NOW = new Date("2026-10-07T12:00:00Z");
const SLAS = [
  { channel: "email" as const, firstResponseMinutes: 240 },
  { channel: "chat" as const, firstResponseMinutes: 5 },
];

function t(id: string, patch: Partial<SupportTicket> = {}): SupportTicket {
  return {
    id,
    provider: "gorgias",
    subject: id,
    channel: "email",
    customer: {
      id: `c-${id}`,
      provider: "gorgias",
      name: id,
      email: `${id}@example.com`,
      lifetimeValue: { amountMinor: 0, currency: "USD" },
      orders: 0,
      vip: false,
      health: { verdict: "Steady", tone: "neutral" },
      priorTickets: 0,
      language: "en",
      shopifyCustomerId: null,
    },
    topic: "where_is_my_order",
    status: "open",
    queue: "needs_approval",
    priority: "normal",
    tags: [],
    assignee: null,
    sentiment: "calm",
    flags: [],
    anger: 0,
    createdAt: "2026-10-07T10:00:00Z",
    updatedAt: "2026-10-07T10:00:00Z",
    firstResponseAt: null,
    snoozedUntil: null,
    agentReplies: 0,
    atRisk: null,
    preview: "",
    unread: false,
    language: "en",
    ...patch,
  };
}

const risk = (dollars: number) => ({ amount: { amountMinor: dollars * 100, currency: "USD" }, kind: "unanswered" as const });

describe("the Inbox view in the URL", () => {
  it("reads defaults and rejects junk", () => {
    expect(inboxViewFrom(new URLSearchParams(""))).toEqual(DEFAULT_INBOX_VIEW);
    expect(inboxViewFrom(new URLSearchParams("queue=bogus&sort=x&page=-2"))).toEqual(DEFAULT_INBOX_VIEW);
    expect(inboxViewFrom(new URLSearchParams("queue=closed&sort=sla&page=3&ticket=t9"))).toEqual({ queue: "closed", sort: "sla", page: 3, ticket: "t9" });
  });

  it("writes only what differs from the defaults, and round-trips", () => {
    expect(inboxHref({})).toBe("/customer-support?tab=inbox");
    const href = inboxHref({ queue: "handed_off", sort: "newest", page: 2, ticket: "t3" });
    expect(href).toBe("/customer-support?tab=inbox&queue=handed_off&sort=newest&page=2&ticket=t3");
    expect(inboxViewFrom(new URLSearchParams(href.split("?")[1]))).toEqual({ queue: "handed_off", sort: "newest", page: 2, ticket: "t3" });
  });
});

describe("sortTickets", () => {
  it("puts the most revenue at risk first, then priority, then age", () => {
    const rows = [
      t("a"),
      t("b", { atRisk: risk(300) }),
      t("c", { atRisk: risk(2840) }),
      t("d", { priority: "critical" }),
      t("e", { priority: "critical", createdAt: "2026-10-07T09:00:00Z" }),
    ];
    expect(sortTickets(rows, "risk", SLAS, NOW).map((r) => r.id)).toEqual(["c", "b", "e", "d", "a"]);
  });

  it("puts the least SLA time left first, answered tickets last", () => {
    const rows = [
      t("email", { createdAt: "2026-10-07T11:50:00Z" }),
      t("chat", { channel: "chat", createdAt: "2026-10-07T11:58:00Z" }),
      t("answered", { firstResponseAt: "2026-10-07T11:00:00Z" }),
    ];
    expect(sortTickets(rows, "sla", SLAS, NOW).map((r) => r.id)).toEqual(["chat", "email", "answered"]);
  });

  it("sorts newest by last update", () => {
    const rows = [t("old", { updatedAt: "2026-10-01T00:00:00Z" }), t("new", { updatedAt: "2026-10-07T00:00:00Z" })];
    expect(sortTickets(rows, "newest", SLAS, NOW).map((r) => r.id)).toEqual(["new", "old"]);
  });

  it("never mutates its input", () => {
    const rows = [t("a"), t("b", { atRisk: risk(10) })];
    sortTickets(rows, "risk", SLAS, NOW);
    expect(rows.map((r) => r.id)).toEqual(["a", "b"]);
  });
});

describe("queues, pages and selection", () => {
  it("filters a queue", () => {
    expect(filterQueue([t("a"), t("b", { queue: "closed" })], "closed").map((r) => r.id)).toEqual(["b"]);
  });

  it("pages at 25 and clamps an out-of-range page", () => {
    const rows = Array.from({ length: 30 }, (_, i) => i);
    expect(pageOf(rows, 1)).toMatchObject({ page: 1, pages: 2, total: 30 });
    expect(pageOf(rows, 2).rows).toHaveLength(5);
    expect(pageOf(rows, 9).page).toBe(2);
    expect(pageOf([], 1)).toMatchObject({ page: 1, pages: 1, rows: [] });
  });

  it("selects the URL's ticket when it is on the page, else the first", () => {
    const rows = [t("a"), t("b")];
    expect(selectedTicket(rows, "b")?.id).toBe("b");
    expect(selectedTicket(rows, "zzz")?.id).toBe("a");
    expect(selectedTicket([], "a")).toBeNull();
  });

  it("moves with j and k, clamped at the ends", () => {
    const rows = [{ id: "a" }, { id: "b" }, { id: "c" }];
    expect(neighbour(rows, "a", 1)).toBe("b");
    expect(neighbour(rows, "c", 1)).toBe("c");
    expect(neighbour(rows, "a", -1)).toBe("a");
    expect(neighbour(rows, "missing", 1)).toBe("a");
    expect(neighbour([], "a", 1)).toBeNull();
  });
});
