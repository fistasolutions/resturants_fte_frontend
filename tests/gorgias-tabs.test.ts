import { describe, expect, it } from "vitest";

import { activeGorgiasTab, gorgiasTabHref, isSafeGorgiasReturnPath } from "@/lib/gorgias-tabs";

describe("activeGorgiasTab", () => {
  it("resolves each tab route by exact match", () => {
    expect(activeGorgiasTab("/team-performance")).toBe("overview");
    expect(activeGorgiasTab("/team-performance/conversations")).toBe("conversations");
    expect(activeGorgiasTab("/team-performance/agents")).toBe("agents");
    expect(activeGorgiasTab("/team-performance/alerts")).toBe("alerts");
  });

  it("tolerates a trailing slash", () => {
    expect(activeGorgiasTab("/team-performance/conversations/")).toBe("conversations");
  });

  it("returns null on detail routes so the shell renders them bare", () => {
    expect(activeGorgiasTab("/team-performance/conversations/123")).toBeNull();
    expect(activeGorgiasTab("/team-performance/agents/5")).toBeNull();
    expect(activeGorgiasTab("/other")).toBeNull();
  });
});

describe("gorgiasTabHref", () => {
  it("carries only the date-range params forward", () => {
    const params = new URLSearchParams({ range: "30d", status: "open", agent_id: "7", page: "3" });
    expect(gorgiasTabHref("/team-performance/agents", params)).toBe(
      "/team-performance/agents?range=30d",
    );
  });

  it("carries an explicit from/to range", () => {
    const params = new URLSearchParams({ from: "2026-08-01", to: "2026-08-05", q: "refund" });
    const href = gorgiasTabHref("/team-performance", params);
    expect(href).toContain("from=2026-08-01");
    expect(href).toContain("to=2026-08-05");
    expect(href).not.toContain("q=");
  });

  it("returns the bare path when no range params are present", () => {
    expect(gorgiasTabHref("/team-performance/alerts", new URLSearchParams({ q: "x" }))).toBe(
      "/team-performance/alerts",
    );
  });
});

describe("isSafeGorgiasReturnPath", () => {
  it("accepts workspace tab + detail routes, with or without query", () => {
    expect(isSafeGorgiasReturnPath("/team-performance")).toBe(true);
    expect(isSafeGorgiasReturnPath("/team-performance/conversations?range=30d")).toBe(true);
    expect(isSafeGorgiasReturnPath("/team-performance/agents/12")).toBe(true);
    expect(isSafeGorgiasReturnPath("/team-performance/conversations/99")).toBe(true);
  });

  it("rejects spoofed or foreign targets", () => {
    expect(isSafeGorgiasReturnPath("/team-performance.evil.example")).toBe(false);
    expect(isSafeGorgiasReturnPath("https://evil.example")).toBe(false);
    expect(isSafeGorgiasReturnPath("/orders")).toBe(false);
    expect(isSafeGorgiasReturnPath("/team-performance/agents/abc")).toBe(false);
  });
});
