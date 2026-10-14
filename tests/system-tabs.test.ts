import { describe, expect, it } from "vitest";

import { isAiShellRoute } from "@/lib/ai-tabs";
import { SYSTEM_TABS, activeSystemTab, systemTabHref } from "@/lib/system-tabs";
import { aiTraceHref } from "@/lib/system-trace";

describe("activeSystemTab", () => {
  it("matches each tab's own route exactly", () => {
    expect(activeSystemTab("/system")).toBe("overview");
    expect(activeSystemTab("/system/runs")).toBe("runs");
  });

  it("tolerates a trailing slash", () => {
    expect(activeSystemTab("/system/")).toBe("overview");
    expect(activeSystemTab("/system/runs/")).toBe("runs");
  });

  it("returns null on a job detail route, so the shell stays off it", () => {
    // That page carries its own breadcrumb and job title; a section header above it
    // would be two headers arguing about what the page is called.
    expect(activeSystemTab("/system/sync_tick")).toBeNull();
    expect(activeSystemTab("/system/tax_reports")).toBeNull();
  });

  it("returns null outside the section", () => {
    expect(activeSystemTab("/ai")).toBeNull();
    expect(activeSystemTab("/")).toBeNull();
  });

  it("every declared tab resolves to itself", () => {
    for (const tab of SYSTEM_TABS) {
      expect(activeSystemTab(tab.basePath)).toBe(tab.key);
    }
  });
});

describe("systemTabHref", () => {
  it("carries the active filters across a tab switch", () => {
    const params = new URLSearchParams("status=error&window=7d");
    expect(systemTabHref("/system/runs", params)).toBe(
      "/system/runs?status=error&window=7d",
    );
  });

  it("does NOT carry the page number", () => {
    // Page 4 of one view is meaningless in another, and landing on an empty page
    // with no explanation is worse than starting at the top.
    const params = new URLSearchParams("status=error&page=4");
    expect(systemTabHref("/system", params)).toBe("/system?status=error");
  });

  it("drops anything the API would not accept", () => {
    const params = new URLSearchParams("status=error&sneaky=1");
    expect(systemTabHref("/system", params)).toBe("/system?status=error");
  });

  it("returns a bare path when there is nothing to carry", () => {
    expect(systemTabHref("/system", new URLSearchParams())).toBe("/system");
    expect(systemTabHref("/system", null)).toBe("/system");
  });
});

describe("isAiShellRoute", () => {
  it("is true on the AI overview", () => {
    expect(isAiShellRoute("/ai")).toBe(true);
    expect(isAiShellRoute("/ai/")).toBe(true);
  });

  it("is false on a trace, which has its own title and no use for a period", () => {
    expect(isAiShellRoute("/ai/traces/abc123")).toBe(false);
  });

  it("is false outside the section", () => {
    expect(isAiShellRoute("/system")).toBe(false);
  });
});

describe("aiTraceHref", () => {
  it("points at the route that actually exists", () => {
    // SPEC-228 shipped `/ai/traces?trace=<id>`, which 404s: the only traces route
    // is `/ai/traces/[traceId]`. Never caught because no job had a trace yet.
    expect(aiTraceHref("abc123")).toBe("/ai/traces/abc123");
    expect(aiTraceHref("abc123")).not.toContain("?");
  });

  it("encodes an id that needs it", () => {
    expect(aiTraceHref("a b/c")).toBe("/ai/traces/a%20b%2Fc");
  });
});
