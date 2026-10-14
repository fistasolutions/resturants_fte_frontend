/** SPEC-272 — CI Plans: the pure half — adapters, filtering, counts, effort and
 * decision lines, and the two validations that gate a request. */
import { describe, expect, it } from "vitest";

import {
  decisionLine,
  draftFromPlan,
  draftProblems,
  draftToBody,
  draftValid,
  EMPTY_DRAFT,
  hasDetails,
  effortAwaiting,
  filterPlans,
  formatEffort,
  formatEffortOnTable,
  isPlanFilter,
  parseEffort,
  parseGets,
  planCounts,
  noteProblem,
  rejectionProblems,
  rejectionValid,
  toCiPlan,
  toCiPlanList,
  type ApiCiPlan,
} from "@/lib/ci-plans";
import { ciTabFor } from "@/lib/ci";
import type { CiPlan } from "@/types/ci-plans";

const API: ApiCiPlan = {
  id: 3,
  title: "Money pages",
  memo: "Titles and meta for commercial pages.",
  why: "208 of 452 searches are commercial.",
  gets: ["Every page scored", "One-click Optimise"],
  effort_days: 4,
  where_it_lives: "A new Search Visibility tab",
  value: "$2.4M sits behind these pages.",
  status: "awaiting",
  created_by_name: "Team",
  decided_by_name: null,
  decided_at: null,
  reject_reason: null,
  reject_instead: null,
  accept_note: null,
  has_image: false,
  created_at: "2026-09-17T09:00:00+00:00",
  updated_at: "2026-09-17T09:00:00+00:00",
};

function plan(over: Partial<CiPlan> = {}): CiPlan {
  return { ...toCiPlan(API), ...over };
}

const day = (iso: string) => iso.slice(0, 10);

describe("adapters", () => {
  it("maps the wire shape to the view model and tolerates missing lists", () => {
    const p = toCiPlan(API);
    expect(p).toMatchObject({ id: 3, effortDays: 4, whereItLives: "A new Search Visibility tab", hasImage: false, createdAt: API.created_at });
    expect(toCiPlan({ ...API, gets: undefined as unknown as string[], where_it_lives: undefined as unknown as string, created_at: null })).toMatchObject({ gets: [], whereItLives: "", createdAt: "" });
    const list = toCiPlanList({ plans: [API], counts: { awaiting: 1, accepted: 0, rejected: 0 }, effort_awaiting_days: 4 });
    expect(list.plans).toHaveLength(1);
    expect(list.effortAwaitingDays).toBe(4);
  });
});

describe("filter, counts, effort", () => {
  const plans = [plan({ id: 1 }), plan({ id: 2, status: "accepted", effortDays: 2 }), plan({ id: 3, status: "rejected", effortDays: 1 }), plan({ id: 4, effortDays: 2.5 })];

  it("filters by status and recognises the URL value", () => {
    expect(filterPlans(plans, "all").map((p) => p.id)).toEqual([1, 2, 3, 4]);
    expect(filterPlans(plans, "awaiting").map((p) => p.id)).toEqual([1, 4]);
    expect(filterPlans(plans, "rejected").map((p) => p.id)).toEqual([3]);
    expect(isPlanFilter("accepted")).toBe(true);
    expect(isPlanFilter("green")).toBe(false);
    expect(isPlanFilter(null)).toBe(false);
  });

  it("counts the cards and sums only the awaiting effort", () => {
    expect(planCounts(plans)).toEqual({ awaiting: 2, accepted: 1, rejected: 1 });
    expect(effortAwaiting(plans)).toBe(6.5);
    expect(effortAwaiting([plan({ effortDays: null })])).toBe(0);
  });

  it("formats effort in days", () => {
    expect(formatEffort(4)).toBe("4 days");
    expect(formatEffort(1)).toBe("1 day");
    expect(formatEffort(2.5)).toBe("2.5 days");
    expect(formatEffort(2.04)).toBe("2 days");
    expect(formatEffort(null)).toBe("—");
    expect(formatEffortOnTable(11)).toBe("~11 days");
    expect(formatEffortOnTable(0)).toBe("—");
  });
});

describe("decision line", () => {
  it("invites while awaiting and names who and when once decided", () => {
    expect(decisionLine(plan(), day)).toBe("Open to decide");
    expect(decisionLine(plan({ status: "accepted", decidedByName: "Store CEO", decidedAt: "2026-09-17T10:00:00Z" }), day)).toBe("Accepted by Store CEO on 2026-09-17");
    expect(decisionLine(plan({ status: "rejected", decidedByName: null, decidedAt: null }), day)).toBe("Rejected by the owner");
  });
});

describe("rejection", () => {
  it("requires both texts with ten characters after trimming", () => {
    expect(rejectionValid("", "")).toBe(false);
    expect(rejectionValid("Not now — wrong order.", "   short  ")).toBe(false);
    expect(rejectionProblems("  ", "One number on the Overview.")).toMatchObject({ reason: expect.stringContaining("why not"), instead: null });
    expect(rejectionValid("Not now — wrong order.", "One number on the Overview.")).toBe(true);
  });
});

describe("the plan draft", () => {
  it("parses bullets one per line, stripping markers, capped at 12", () => {
    expect(parseGets("- Every page scored\n• One-click Optimise\n\n  * Approve & apply  ")).toEqual(["Every page scored", "One-click Optimise", "Approve & apply"]);
    expect(parseGets(Array.from({ length: 14 }, (_, i) => `line ${i}`).join("\n"))).toHaveLength(12);
    expect(parseGets("")).toEqual([]);
  });

  it("parses effort as days or nothing, and refuses nonsense", () => {
    expect(parseEffort("4")).toBe(4);
    expect(parseEffort(" 2.5 ")).toBe(2.5);
    expect(parseEffort("2.46")).toBe(2.5);
    expect(parseEffort("")).toBeNull();
    expect(parseEffort("abc")).toBeUndefined();
    expect(parseEffort("-1")).toBeUndefined();
    expect(parseEffort("400")).toBeUndefined();
  });

  it("names every missing box and builds the wire body", () => {
    const empty = draftProblems({ title: "", memo: "", why: "", gets: "", whereItLives: "", value: "", effortDays: "x" });
    // "in one line" and "the value" are optional since SPEC-278 Patches
    expect(Object.keys(empty).sort()).toEqual(["effortDays", "gets", "title", "why"]);
    expect(draftValid({ ...EMPTY_DRAFT, title: "Money pages", why: "Because now.", gets: "One thing" })).toBe(true);
    expect(hasDetails(EMPTY_DRAFT)).toBe(false);
    expect(hasDetails({ ...EMPTY_DRAFT, effortDays: "4" })).toBe(true);
    expect(hasDetails(EMPTY_DRAFT, true)).toBe(true);
    const draft = draftFromPlan(plan());
    expect(draft).toEqual({ title: "Money pages", memo: API.memo, why: API.why, gets: "Every page scored\nOne-click Optimise", whereItLives: "A new Search Visibility tab", value: API.value, effortDays: "4" });
    expect(draftValid(draft)).toBe(true);
    expect(draftToBody({ ...draft, effortDays: "", gets: "  - one\n\n" })).toEqual({
      title: "Money pages",
      memo: API.memo,
      why: API.why,
      gets: ["one"],
      value: API.value,
      where_it_lives: "A new Search Visibility tab",
      effort_days: null,
    });
  });
});

describe("the tab bar", () => {
  it("knows which routes carry the shell's header and which render bare", () => {
    expect(ciTabFor("/ci")).toBe("reports");
    expect(ciTabFor("/ci/")).toBe("reports");
    expect(ciTabFor("/ci/plans")).toBe("plans");
    expect(ciTabFor("/ci/plans/12")).toBeNull();
    expect(ciTabFor("/ci/daily-0916")).toBeNull();
  });
});

describe("the note on a Yes (SPEC-278)", () => {
  it("maps accept_note and tolerates its absence from older payloads", () => {
    expect(toCiPlan({ ...API, accept_note: "Keep the tiles." }).acceptNote).toBe("Keep the tiles.");
    expect(toCiPlan({ ...API, accept_note: undefined }).acceptNote).toBeNull();
  });
  it("is optional — only too long is a problem", () => {
    expect(noteProblem("")).toBeNull();
    expect(noteProblem("Ship it after the tax report.")).toBeNull();
    expect(noteProblem("x".repeat(4001))).toMatch(/under 4000/);
  });
});
