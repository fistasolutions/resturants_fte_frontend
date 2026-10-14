import { describe, expect, it } from "vitest";

import {
  REVIEW_GROUPS,
  adaptResearchReview,
  displayLabel,
  adaptResearchRun,
  factGroup,
  foundSummary,
  groupCount,
  hidesCompetitorRun,
  lookSource,
  lookSubtitle,
  researchLines,
  researchToastView,
  sourceLabel,
  stepClock,
  stepPosition,
  type ApiResearchReview,
  type ApiResearchRun,
} from "@/lib/brand-research";

const STEPS = [
  ["store", "Reading your store"],
  ["catalog", "Reading what you sell"],
  ["profile", "Writing your brand profile"],
  ["voice", "Learning how you talk"],
  ["style", "Capturing your look"],
  ["competitors", "Finding your competitors"],
] as const;

function apiRun(over: Partial<ApiResearchRun> = {}): ApiResearchRun {
  return {
    id: 7,
    trigger: "auto",
    status: "running",
    steps: STEPS.map(([key, label], i) => ({
      key,
      label,
      state: i < 2 ? "done" : i === 2 ? "running" : "waiting",
      detail: i === 2 ? "Reading about-us, faq" : "",
    })),
    progress: 25,
    found: null,
    competitor_run_id: null,
    error: null,
    started_at: "2026-10-06T10:00:00Z",
    finished_at: null,
    seen_at: null,
    ...over,
  };
}

describe("brand research toast (SPEC-341)", () => {
  it("shows the running step, its detail, the step position and the %", () => {
    const run = adaptResearchRun(apiRun());
    const view = researchToastView(run);
    expect(view.tone).toBe("running");
    expect(view.title).toBe("Researching your brand");
    expect(view.progress).toBe(25);
    expect(view.current?.key).toBe("profile");
    expect(view.summary).toBe("Reading about-us, faq");
    expect(view.canReview).toBe(false);
    expect(stepPosition(run)).toBe("2 of 6 done · 1 working");
  });

  it("ends on ready to review with what was found", () => {
    const run = adaptResearchRun(
      apiRun({ status: "done", progress: 100, found: { facts: 18, personas: 4, voice: 6, competitors: 3 } }),
    );
    const view = researchToastView(run);
    expect(view.tone).toBe("done");
    expect(view.title).toBe("Your brand is ready to review");
    expect(view.summary).toBe("18 facts · 4 customer types · 6 voice rules · 3 competitors");
    expect(view.canReview).toBe(true);
  });

  it("says when a finished run found nothing, and why a failed one stopped", () => {
    expect(researchToastView(adaptResearchRun(apiRun({ status: "done", found: {} }))).canReview).toBe(false);
    expect(foundSummary({ facts: 0, personas: 0, voice: 0, words: 0, style: 0, competitors: 0 })).toBe(
      "Nothing new to review",
    );
    const failed = researchToastView(adaptResearchRun(apiRun({ status: "failed", error: "Nothing could be read." })));
    expect(failed.tone).toBe("failed");
    expect(failed.summary).toBe("Nothing could be read.");
  });

  it("clamps progress and hides only the competitor run it follows", () => {
    expect(adaptResearchRun(apiRun({ progress: 140 })).progress).toBe(100);
    const run = adaptResearchRun(apiRun({ competitor_run_id: 12 }));
    expect(hidesCompetitorRun(run, 12)).toBe(true);
    expect(hidesCompetitorRun(run, 13)).toBe(false);
    expect(hidesCompetitorRun(null, 12)).toBe(false);
  });
});

describe("brand research review (SPEC-341)", () => {
  const raw: ApiResearchReview = {
    facts: [
      { id: 1, section: "identity", label: "Mission", value: "Clothes to keep", status: "pending", locator: "Page: About us", replaces: null },
      { id: 2, section: "voice", label: "tone", value: "Calm", status: "conflict", locator: "Homepage", replaces: "Bold" },
      { id: 3, section: "policy", label: "Returns", value: "30 days", status: "pending", locator: null, replaces: null },
    ],
    personas: [{ id: 4, name: "The Considered Buyer", role: "Buys less", description: "Reads labels.", tags: ["quality"] }],
    voice_rules: [{ id: 5, title: "Calm and plain", detail: "Short sentences." }],
    words: [{ id: 6, kind: "word_banned", label: "cheap", detail: null }],
    style: [{ id: 7, section: "palette", label: "Brand colours from Shopify", detail: "Primary: #111" }],
    competitors: [{ id: 8, name: "Rival", domain: "rival.example", positioning: "", why: "" }],
    counts: { facts: 3, personas: 1, voice: 1, words: 1, style: 1, competitors: 1, total: 8 },
    run: null,
  };

  it("groups every finding, voice facts under how you sound", () => {
    const review = adaptResearchReview(raw);
    expect(REVIEW_GROUPS.map((g) => g.key)).toEqual(["about", "customers", "voice", "words", "look", "competitors"]);
    expect(factGroup(review.facts[1])).toBe("voice");
    const counts = Object.fromEntries(REVIEW_GROUPS.map((g) => [g.key, groupCount(review, g.key)]));
    expect(counts).toEqual({ about: 2, customers: 1, voice: 2, words: 1, look: 1, competitors: 1 });
    expect(review.counts.total).toBe(8);
  });

  it("says where each finding came from in plain words", () => {
    expect(sourceLabel("Page: About us")).toBe("From your About us page");
    expect(sourceLabel("Homepage")).toBe("From your homepage");
    expect(sourceLabel("Shopify store description")).toBe("From your Shopify store description");
    expect(sourceLabel("Your catalogue")).toBe("From your catalogue");
    expect(sourceLabel(null)).toBe("From your store");
    expect(displayLabel("tone")).toBe("Tone");
    expect(displayLabel("Store type")).toBe("Store type");
  });
});

describe("every step, live (SPEC-367)", () => {
  const steps = [
    { key: "store", label: "Reading your store", state: "done", detail: "Read 3 pages, refund policy", started_at: "2026-10-09T10:00:00Z", finished_at: "2026-10-09T10:00:12Z" },
    { key: "buyers", label: "Counting who buys from you", state: "skipped", detail: "4 orders so far — too few to tell who buys.", started_at: "2026-10-09T10:00:00Z", finished_at: "2026-10-09T10:00:01Z" },
    { key: "reviews", label: "Reading your reviews", state: "running", detail: "Reading reviews on “Trail shoe”", started_at: "2026-10-09T10:00:12Z", finished_at: null },
    { key: "look", label: "Capturing your look", state: "running", detail: "Looking at 8 photos from your store", started_at: "2026-10-09T10:00:12Z", finished_at: null },
    { key: "profile", label: "Writing your brand profile", state: "failed", detail: "The profile could not be written.", started_at: "2026-10-09T10:00:12Z", finished_at: "2026-10-09T10:01:17Z" },
    { key: "competitors", label: "Finding your competitors", state: "waiting", detail: "", started_at: null, finished_at: null },
  ] as const;
  const run = adaptResearchRun(apiRun({ steps: steps.map((s) => ({ ...s })) }));

  it("gives each step its live line, its result or its reason", () => {
    const lines = researchLines(run);
    expect(lines.map((l) => [l.key, l.state, l.text])).toEqual([
      ["store", "done", "Read 3 pages, refund policy"],
      ["buyers", "skipped", "4 orders so far — too few to tell who buys."],
      ["reviews", "running", "Reading reviews on “Trail shoe”"],
      ["look", "running", "Looking at 8 photos from your store"],
      ["profile", "failed", "The profile could not be written."],
      ["competitors", "waiting", ""],
    ]);
  });

  it("counts what is done and working, and joins the running lines", () => {
    expect(stepPosition(run)).toBe("3 of 6 done · 2 working");
    expect(researchToastView(run).summary).toBe("Reading reviews on “Trail shoe” · Looking at 8 photos from your store");
    expect(stepPosition(adaptResearchRun(apiRun({ status: "done" })))).toBeNull();
  });

  it("times a running step and a finished one", () => {
    const now = Date.parse("2026-10-09T10:00:54Z");
    const [store, buyers, reviews, , profile, competitors] = researchLines(run);
    expect(stepClock(reviews, now)).toBe("0:42");
    expect(stepClock(store, now)).toBe("12s");
    expect(stepClock(buyers, now)).toBe("1s");
    expect(stepClock(profile, now)).toBe("1m 05s");
    expect(stepClock(competitors, now)).toBe("");
  });

  it("reads an older backend's steps, with no times", () => {
    const old = adaptResearchRun(apiRun());
    expect(old.steps[0]).toMatchObject({ startedAt: null, finishedAt: null });
    expect(stepClock(researchLines(old)[2], Date.now())).toBe("");
  });

  it("says where a look row came from and which part of the look it is", () => {
    expect(lookSource({ label: "Brand colours from Shopify" })).toBe("From your Shopify brand settings");
    expect(lookSource({ label: "Warm stone neutrals" })).toBe("From your store's photos");
    expect(lookSubtitle("safety")).toBe("How people are shown");
    expect(lookSubtitle("light")).toBe("Light");
    expect(lookSubtitle(null)).toBeUndefined();
  });
});
