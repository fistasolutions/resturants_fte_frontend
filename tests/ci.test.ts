import { describe, expect, it } from "vitest";

import { feedStats, monthOf, orderReports, reportById, reportsByMonth, richText, tocFor } from "@/lib/ci";
import { CI_REPORTS } from "@/lib/ci/content";
import type { CiReport } from "@/lib/ci/types";

function report(over: Partial<CiReport>): CiReport {
  return {
    id: "x", kind: "daily", period: "", sortDate: "2026-09-01", hook: "", memo: "", effort: null, views: "",
    areas: 0, days: [], sections: [], tiers: [], next: [], cautions: [], pages: [], ...over,
  };
}

describe("orderReports / reportsByMonth", () => {
  it("pins the engagement report first, then newest first, grouped by month", () => {
    const list = [
      report({ id: "a", sortDate: "2026-08-22", kind: "weekly" }),
      report({ id: "e", sortDate: "2026-09-04", kind: "engagement" }),
      report({ id: "b", sortDate: "2026-09-15" }),
      report({ id: "c", sortDate: "2026-09-08" }),
    ];
    expect(orderReports(list).map((r) => r.id)).toEqual(["e", "b", "c", "a"]);
    expect(reportsByMonth(list).map((g) => [g.month, g.reports.map((r) => r.id)])).toEqual([
      ["The whole engagement", ["e"]],
      ["September 2026", ["b", "c"]],
      ["August 2026", ["a"]],
    ]);
    expect(monthOf(report({ sortDate: "2026-08-13" }))).toBe("August 2026");
  });
});

describe("richText", () => {
  it("splits inline marks into tokens and keeps everything else as text", () => {
    expect(richText("A <b>bold</b> and <code>GET /x</code> line")).toEqual([
      { kind: "text", text: "A " }, { kind: "b", text: "bold" }, { kind: "text", text: " and " },
      { kind: "code", text: "GET /x" }, { kind: "text", text: " line" },
    ]);
    expect(richText("plain")).toEqual([{ kind: "text", text: "plain" }]);
    // an unknown tag is text, never markup
    expect(richText("/products/<id>")).toEqual([{ kind: "text", text: "/products/<id>" }]);
  });
});

describe("tocFor", () => {
  it("lists sections then the closing pages the report has", () => {
    const r = report({
      sections: [{ n: "01", title: "One", sub: "", subTechnical: false, ask: "", status: "", effort: null, inside: [], built: "", why: "", value: "", shots: [] }],
      tiers: [{ name: "x", change: "y", why: "z" }],
      next: [{ title: "n", body: "b", technical: false }],
    });
    expect(tocFor(r).map((t) => t.id)).toEqual(["s-01", "before-after", "next"]);
  });
});

describe("the generated bundle", () => {
  it("has every report the Reports folder holds, newest first after the engagement report", () => {
    const ordered = orderReports(CI_REPORTS);
    expect(ordered[0].kind).toBe("engagement");
    expect(ordered.length).toBe(21);
    expect(ordered[1].id).toBe("d0924");
    expect(reportById(CI_REPORTS, "d0924")?.sections.length).toBe(6);
    expect(reportById(CI_REPORTS, "d0915")?.sections.length).toBe(9);
    expect(reportById(CI_REPORTS, "d0917")?.sections.length).toBe(12);
    expect(reportById(CI_REPORTS, "d0921")?.sections.length).toBe(10);
    expect(reportById(CI_REPORTS, "d0918")?.sections.length).toBe(11);
    expect(reportById(CI_REPORTS, "w0918")?.sections.length).toBe(5);
    expect(reportById(CI_REPORTS, "nope")).toBeNull();
    const stats = feedStats(CI_REPORTS);
    expect(stats.reports).toBe(21);
    expect(stats.since).toBe("2026-08-13");
    expect(stats.screens).toBeGreaterThan(200);
  });
  it("carries no markup other than the three inline marks", () => {
    const text = JSON.stringify(CI_REPORTS);
    const tags = new Set([...text.matchAll(/<\/?([a-z0-9]+)[ >]/g)].map((m) => m[1]));
    expect([...tags].filter((t) => !["b", "i", "code", "id"].includes(t))).toEqual([]);
    expect(text).not.toMatch(/&[a-z]+;/);
  });
});

describe("filters and pages (SPEC-253 Patches)", () => {
  const list = [
    report({ id: "e", kind: "engagement", sortDate: "2026-09-04", hook: "What we built" }),
    report({ id: "b", sortDate: "2026-09-15", hook: "Managers", sections: [{ n: "01", title: "Customer health", sub: "", subTechnical: false, ask: "", status: "", effort: null, inside: [], built: "", why: "", value: "", shots: [] }] }),
    report({ id: "c", kind: "weekly", sortDate: "2026-09-12", hook: "Seven integrations" }),
    report({ id: "a", kind: "weekly", sortDate: "2026-08-22", hook: "Foresight" }),
  ];
  it("filters by kind, month and a search over hook, memo and area titles", async () => {
    const { filterReports, monthOptions, DEFAULT_FILTERS } = await import("@/lib/ci");
    expect(filterReports(list, DEFAULT_FILTERS).map((r) => r.id)).toEqual(["e", "b", "c", "a"]);
    expect(filterReports(list, { ...DEFAULT_FILTERS, kind: "weekly" }).map((r) => r.id)).toEqual(["c", "a"]);
    expect(filterReports(list, { ...DEFAULT_FILTERS, month: "August 2026" }).map((r) => r.id)).toEqual(["a"]);
    expect(filterReports(list, { ...DEFAULT_FILTERS, q: "customer HEALTH" }).map((r) => r.id)).toEqual(["b"]);
    expect(monthOptions(list)).toEqual(["September 2026", "August 2026"]);
  });
  it("paginates six a page and clamps an out-of-range page", async () => {
    const { paginate } = await import("@/lib/ci");
    const many = Array.from({ length: 13 }, (_, i) => report({ id: `r${i}`, sortDate: `2026-08-${String(i + 1).padStart(2, "0")}` }));
    expect(paginate(many, 1).items.length).toBe(6);
    expect(paginate(many, 3)).toMatchObject({ page: 3, pages: 3, total: 13 });
    expect(paginate(many, 3).items.length).toBe(1);
    expect(paginate(many, 9).page).toBe(3);
    expect(paginate(many, 0).page).toBe(1);
    expect(paginate([], 1)).toMatchObject({ page: 1, pages: 1, total: 0 });
  });
  it("round-trips the URL and lists the first areas", async () => {
    const { filtersFromParams, paramsFromFilters, isDefaultFilters, areasOf } = await import("@/lib/ci");
    const f = filtersFromParams(new URLSearchParams("kind=daily&month=September+2026&q=+health+"));
    expect(f).toEqual({ kind: "daily", month: "September 2026", q: "health" });
    expect(paramsFromFilters(f, 2).toString()).toBe("kind=daily&month=September+2026&q=health&page=2");
    expect(filtersFromParams(new URLSearchParams("kind=bogus")).kind).toBe("all");
    expect(isDefaultFilters(filtersFromParams(new URLSearchParams("")))).toBe(true);
    expect(areasOf(list[1])).toEqual({ titles: ["Customer health"], more: 0 });
  });
});

describe("the business view", () => {
  it("hides technical lines and shows scrubbed text; the toggle shows everything in full", async () => {
    const { visibleLines, visiblePairs, hiddenCount } = await import("@/lib/ci");
    const lines = [
      { text: "Regroups those rows by person", full: "<code>GET /x</code> regroups those rows by person", technical: false },
      { text: "Measured 2.6 s", full: "Measured 2.6 s", technical: true },
    ];
    expect(visibleLines(lines, false)).toEqual(["Regroups those rows by person"]);
    expect(visibleLines(lines, true)).toEqual(["<code>GET /x</code> regroups those rows by person", "Measured 2.6 s"]);
    const pairs = [{ title: "a", body: "b", technical: false }, { title: "t", body: "SPEC-1", technical: true }];
    expect(visiblePairs(pairs, false).length).toBe(1);
    expect(visiblePairs(pairs, true).length).toBe(2);
    const r = report({
      sections: [{ n: "01", title: "One", sub: "Backend SPEC-1", subTechnical: true, ask: "", status: "", effort: null, inside: lines, built: "", why: "", value: "", shots: [] }],
      next: pairs, cautions: [],
    });
    expect(hiddenCount(r)).toBe(3);
  });
  it("the bundle keeps the business story: every report still has business lines and a business memo", () => {
    for (const r of CI_REPORTS) {
      // A report either explains itself in "what is inside" lines or in the three boxes.
      const business = r.sections.reduce((n, s) => n + s.inside.filter((l) => !l.technical).length + (s.built ? 1 : 0), 0);
      if (r.pages.length === 0) expect(business, r.id).toBeGreaterThan(0);
      expect(r.memo).not.toMatch(/SPEC-\d+|migration|endpoint/i);
    }
  });
});

describe("mergeReports (SPEC-369)", () => {
  const report = (id: string, sortDate: string, hook = id): CiReport => ({
    id,
    kind: "daily",
    period: id,
    sortDate,
    hook,
    memo: "",
    effort: null,
    views: "",
    areas: 0,
    days: [],
    sections: [],
    tiers: [],
    next: [],
    cautions: [],
    pages: [],
  });

  it("adds the recent reports and lets a generated one win on an id clash", async () => {
    const { mergeReports } = await import("@/lib/ci");
    const merged = mergeReports(
      [report("d0924", "2026-09-24"), report("d0926", "2026-09-26", "generated")],
      [report("d0926", "2026-09-26", "recent"), report("d0928", "2026-09-28")],
    );
    expect(merged.map((r) => r.id)).toEqual(["d0924", "d0926", "d0928"]);
    expect(merged.find((r) => r.id === "d0926")?.hook).toBe("generated");
  });
});
