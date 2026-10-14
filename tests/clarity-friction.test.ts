/** SPEC-282: the Website tab's words and controls — proper plurals, one line per
 * recorded issue with its Clarity link, the severity chips, the page href. */
import { describe, expect, it } from "vitest";

import { sourceVerdictLine } from "@/lib/clarity";
import { FRICTION_TABLE, brokeChip, brokeLine, frictionPageHref, frictionRate, issueLines, issueSummary, pluralise } from "@/lib/clarity-friction";
import { applyControls, facetOptions } from "@/lib/table-controls";
import type { ClarityFrictionPage } from "@/types/clarity";

const LINKS = {
  dashboard: "https://clarity.microsoft.com/projects/view/p/dashboard?date=Last%2030%20days",
  recordings: "https://clarity.microsoft.com/projects/view/p/impressions?date=Last%2030%20days&URL=2%3B2%3B%2Fproducts%2Fa",
  rageClicks: "https://clarity.microsoft.com/projects/view/p/impressions?date=Last%2030%20days&URL=2%3B2%3B%2Fproducts%2Fa&rageClickCount=1",
  deadClicks: "https://clarity.microsoft.com/projects/view/p/impressions?date=Last%2030%20days&URL=2%3B2%3B%2Fproducts%2Fa&deadClickCount=1",
  quickBacks: "https://clarity.microsoft.com/projects/view/p/impressions?date=Last%2030%20days&URL=2%3B2%3B%2Fproducts%2Fa&QuickbackClickPresent=1",
  scriptErrors: "https://clarity.microsoft.com/projects/view/p/impressions?date=Last%2030%20days&URL=2%3B2%3B%2Fproducts%2Fa",
  errorClicks: "https://clarity.microsoft.com/projects/view/p/impressions?date=Last%2030%20days&URL=2%3B2%3B%2Fproducts%2Fa",
};

function page(over: Partial<ClarityFrictionPage> = {}): ClarityFrictionPage {
  return {
    handle: "a",
    title: "Satin Tie Yoke Dress",
    path: "/products/a",
    sessions: 194,
    rageClicks: 0,
    deadClicks: 3,
    scriptErrors: 1,
    errorClicks: 0,
    quickBacks: 702,
    excessiveScroll: 0,
    avgScrollDepth: 0.41,
    avgActiveSeconds: 12,
    frictionEvents: 4,
    revenue90d: 62075.89,
    units90d: 194,
    marginKnown: true,
    clarity: LINKS,
    ...over,
  };
}

describe("pluralise", () => {
  it("reads in proper English", () => {
    expect(pluralise(1, "script error")).toBe("1 script error");
    expect(pluralise(2, "script error")).toBe("2 script errors");
    expect(pluralise(0, "rage click")).toBe("0 rage clicks");
    expect(pluralise(1234, "quick-back")).toBe("1,234 quick-backs");
  });
});

describe("issueLines", () => {
  it("lists only what Clarity recorded, counted issues first, with the matching link", () => {
    const lines = issueLines(page());
    expect(lines.map((l) => l.key)).toEqual(["deadClicks", "scriptErrors", "quickBacks"]);
    expect(lines[0].href).toBe(LINKS.deadClicks);
    expect(lines[1].href).toBe(LINKS.scriptErrors);
    expect(lines[2].counted).toBe(false);
    expect(lines[2].href).toBe(LINKS.quickBacks);
  });
  it("has no link without a project id", () => {
    expect(issueLines(page({ clarity: null })).every((l) => l.href === null)).toBe(true);
  });
  it("summarises the counted issues on the closed row", () => {
    expect(issueSummary(page())).toBe("3 dead clicks · 1 script error");
    expect(issueSummary(page({ deadClicks: 0, scriptErrors: 0, frictionEvents: 0 }))).toBe("No friction recorded");
  });
});

describe("frictionRate and the table spec", () => {
  it("is friction per 100 sessions, one decimal, 0 without sessions", () => {
    expect(frictionRate({ frictionEvents: 4, sessions: 194 })).toBe(2.1);
    expect(frictionRate({ frictionEvents: 4, sessions: 0 })).toBe(0);
  });
  it("searches title and path, chips by severity, pages by ten", () => {
    const rows = [
      page({ handle: "a", frictionEvents: 40, sessions: 100 }),
      page({ handle: "b", title: "Olivia Skirt", path: "/products/b", frictionEvents: 1, sessions: 100 }),
    ];
    expect(facetOptions(rows, FRICTION_TABLE.facet)).toEqual([
      { label: "Minor", count: 1 },
      { label: "Severe", count: 1 },
    ]);
    const slice = applyControls(rows, { query: "olivia", facet: null, page: 1 }, FRICTION_TABLE);
    expect(slice.rows.map((r) => r.handle)).toEqual(["b"]);
    expect(applyControls(rows, { query: "", facet: "Severe", page: 1 }, FRICTION_TABLE).rows.map((r) => r.handle)).toEqual(["a"]);
    expect(FRICTION_TABLE.pageSize).toBe(10);
  });
  it("links a page by its handle", () => {
    expect(frictionPageHref("satin-tie-yoke-dress")).toBe("/traffic/website/satin-tie-yoke-dress");
  });
});

describe("the Brief's what-broke line (SPEC-284)", () => {
  const fmt = (iso: string) => iso;
  it("says a new break started on the captured day", () => {
    const p = { ...page({ scriptErrors: 3, deadClicks: 0, frictionEvents: 3, sessions: 7 }), reason: "new" as const, priorDailyAvg: 0 };
    expect(brokeLine(p, "2026-09-20", fmt)).toBe("3 script errors on 7 sessions — started 2026-09-20; none the week before.");
    expect(brokeChip(p)).toBe("new yesterday");
  });
  it("says how far up a doubled page is", () => {
    const p = { ...page({ deadClicks: 6, scriptErrors: 0, frictionEvents: 6, sessions: 70 }), reason: "up" as const, priorDailyAvg: 1 };
    expect(brokeLine(p, "2026-09-20", fmt)).toBe("6 dead clicks on 70 sessions — up 6× on the week's daily average of 1.");
    expect(brokeChip(p)).toBe("up 6×");
  });
});

describe("the source verdict chip (SPEC-284)", () => {
  const base = { sessions: 600, avgScrollDepth: 0.3, quickBacks: 100, attributedOrders: 0, rageClicks: 0 };
  it("judges the audience and the page apart, and refuses to judge a trickle", () => {
    expect(sourceVerdictLine({ ...base, attributedOrders: 41 }).label).toBe("Converting");
    expect(sourceVerdictLine({ ...base, attributedOrders: 41, rageClicks: 3 }).label).toBe("Converting, with friction");
    expect(sourceVerdictLine({ ...base, avgScrollDepth: 0.51 }).label).toBe("Good audience, broken page");
    expect(sourceVerdictLine({ ...base, quickBacks: 402 }).label).toBe("Wrong audience");
    expect(sourceVerdictLine(base).label).toBe("No orders yet");
    expect(sourceVerdictLine({ ...base, sessions: 20 })).toMatchObject({ label: "Too few to judge", tone: "muted" });
  });
});
