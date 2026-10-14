import { describe, expect, it } from "vitest";

import { conversationsApiQuery, parseConversationFilters } from "@/lib/gorgias-filters";

describe("parseConversationFilters", () => {
  it("parses valid filters", () => {
    const f = parseConversationFilters({
      status: "open",
      agent_id: "42",
      reason: "shipping",
      q: "  where is my order  ",
      page: "3",
    });
    expect(f).toEqual({
      status: "open",
      agentId: 42,
      reason: "shipping",
      q: "where is my order",
      page: 3,
    });
  });

  it("rejects malformed values", () => {
    const f = parseConversationFilters({
      status: "OPEN; DROP",
      agent_id: "-1",
      page: "0",
    });
    expect(f.status).toBeNull();
    expect(f.agentId).toBeNull();
    expect(f.q).toBe("");
    expect(f.page).toBe(1);
  });

  it("defaults an empty param bag", () => {
    const f = parseConversationFilters({});
    expect(f).toEqual({ status: null, agentId: null, reason: null, q: "", page: 1 });
  });
});

describe("conversationsApiQuery", () => {
  it("always includes start/end and only active filters", () => {
    const f = parseConversationFilters({ status: "open", agent_id: "7", q: "refund" });
    const query = conversationsApiQuery(f, "2026-08-01", "2026-08-05");
    const params = new URLSearchParams(query);
    expect(params.get("start")).toBe("2026-08-01");
    expect(params.get("end")).toBe("2026-08-05");
    expect(params.get("status")).toBe("open");
    expect(params.get("agent_id")).toBe("7");
    expect(params.get("search")).toBe("refund");
    expect(params.get("page")).toBeNull(); // no pagination unless limit is given
  });

  it("converts the offset model to the backend's page/page_size", () => {
    const f = parseConversationFilters({});
    const params = new URLSearchParams(
      conversationsApiQuery(f, "2026-08-01", "2026-08-05", 25, 50),
    );
    expect(params.get("page")).toBe("3"); // offset 50 / limit 25 -> page 3
    expect(params.get("page_size")).toBe("25");
  });

  it("omits empty filters entirely", () => {
    const params = new URLSearchParams(
      conversationsApiQuery(parseConversationFilters({}), "2026-08-01", "2026-08-05"),
    );
    expect(params.has("status")).toBe(false);
    expect(params.has("agent_id")).toBe(false);
    expect(params.has("search")).toBe(false);
  });
});
