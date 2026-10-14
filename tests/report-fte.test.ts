/** SPEC-256 / SPEC-285 — the pure half of the Report FTE: routing an ask, the composer's
 * phases (now hydrated from the run's real status and fed by SSE frames), filters. */
import { describe, expect, it } from "vitest";

import { canRun, deskTemplates, offeredTemplates } from "@/lib/report-fte";

import {
  authorityLabel,
  composerReducer,
  filterTemplates,
  formatMs,
  hydrateComposerState,
  initialComposerState,
  mergeSections,
  mergeTrace,
  scorecardTiles,
  splitLead,
  templateForAsk,
  traceProgress,
  type ComposerState,
} from "@/lib/report-fte";
import type { ReportSection, ReportTemplateSummary, TraceCall } from "@/types/report-fte";

const REPORT_TEMPLATES: ReportTemplateSummary[] = [
  { id: "returns-by-brand", name: "Returns by Brand", cadence: "weekly", summary: "", sectionCount: 5, toolCount: 4, runs: "Mon 07:00" },
  { id: "brand-review", name: "Buying-Season Brand Review", cadence: "season", summary: "", sectionCount: 5, toolCount: 4, runs: "on demand" },
  { id: "discount-decisions", name: "Discount Decisions", cadence: "monthly", summary: "", sectionCount: 4, toolCount: 3, runs: "1st of month" },
  { id: "store-league", name: "Store League", cadence: "weekly", summary: "", sectionCount: 6, toolCount: 5, runs: "Mon 07:00" },
  { id: "tax-pack", name: "Sales & Tax Pack", cadence: "monthly", summary: "", sectionCount: 3, toolCount: 2, runs: "7th, Excel" },
  { id: "trading-week", name: "Trading Week", cadence: "weekly", summary: "", sectionCount: 7, toolCount: 6, runs: "Mon 07:00" },
  { id: "yesterday", name: "Yesterday in three lines", cadence: "daily", summary: "", sectionCount: 2, toolCount: 2, runs: "on demand" },
];

describe("templateForAsk", () => {
  it("routes an ask to the template it most plausibly wants", () => {
    expect(templateForAsk("Every Monday a returns report by brand", REPORT_TEMPLATES).templateId).toBe("returns-by-brand");
    expect(templateForAsk("Which discount codes lost money", REPORT_TEMPLATES).templateId).toBe("discount-decisions");
    expect(templateForAsk("Store league with footfall conversion", REPORT_TEMPLATES).templateId).toBe("store-league");
    expect(templateForAsk("Sales & tax summary for August", REPORT_TEMPLATES).templateId).toBe("tax-pack");
    expect(templateForAsk("Yesterday vs same day last year, in three lines", REPORT_TEMPLATES).title).toBe(
      "Yesterday in three lines",
    );
  });

  it("falls back to a custom report", () => {
    expect(templateForAsk("", REPORT_TEMPLATES)).toEqual({ templateId: null, title: "Custom report" });
    expect(templateForAsk("something nobody has a template for", REPORT_TEMPLATES).templateId).toBeNull();
  });
});

describe("composerReducer", () => {
  const start = initialComposerState("Draft — nothing sent.");

  it("walks idle → running → ready → sent, and records the receipt", () => {
    let state: ComposerState = composerReducer(start, { type: "run" });
    expect(state.phase).toBe("running");
    state = composerReducer(state, { type: "section_done", sectionId: "s1" });
    state = composerReducer(state, { type: "section_done", sectionId: "s1" }); // idempotent
    state = composerReducer(state, { type: "section_done", sectionId: "s2" });
    expect(state.completed).toEqual(["s1", "s2"]);
    state = composerReducer(state, { type: "finish", toolCount: 2, elapsed: "1.1 s" });
    expect(state.phase).toBe("ready");
    expect(state.status).toContain("2 tools");
    state = composerReducer(state, { type: "send", to: "Sara", at: "07:02" });
    expect(state.phase).toBe("sent");
    expect(state.statusTone).toBe("sent");
    expect(state.status).toContain("Sara");
    state = composerReducer(state, { type: "schedule", runs: "Mon 07:00" });
    expect(state.phase).toBe("scheduled");
  });

  it("refuses a send before the plan ran, and editing while running", () => {
    expect(composerReducer(start, { type: "send", to: "Sara", at: "x" }).phase).toBe("idle");
    const running = composerReducer(start, { type: "run" });
    expect(composerReducer(running, { type: "edit", sectionId: "s1" }).editing).toBeNull();
    expect(composerReducer(running, { type: "run" })).toBe(running);
    expect(composerReducer(start, { type: "edit", sectionId: "s3" }).editing).toBe("s3");
    expect(composerReducer(running, { type: "reset", status: "again" })).toEqual(initialComposerState("again"));
  });
});

describe("labels and filters", () => {
  it("counts trace progress with the right tone", () => {
    expect(traceProgress(0, 5)).toEqual({ label: "0 of 5", tone: "neutral" });
    expect(traceProgress(3, 5)).toEqual({ label: "3 of 5", tone: "ai" });
    expect(traceProgress(5, 5)).toEqual({ label: "5 of 5 grounded", tone: "success" });
    expect(traceProgress(0, 0).label).toBe("no tools");
  });

  it("formats producer-measured durations", () => {
    expect(formatMs(412)).toBe("412 ms");
    expect(formatMs(6200)).toBe("6.2 s");
  });

  it("filters templates by cadence", () => {
    expect(filterTemplates(REPORT_TEMPLATES, "all")).toHaveLength(REPORT_TEMPLATES.length);
    expect(filterTemplates(REPORT_TEMPLATES, "daily").every((t) => t.cadence === "daily")).toBe(true);
    expect(filterTemplates(REPORT_TEMPLATES, "weekly").map((t) => t.id)).toEqual(["returns-by-brand", "store-league", "trading-week"]);
  });

  it("labels authority and splits a narrative lead", () => {
    expect(authorityLabel("sends_alone")).toEqual({ label: "Sends alone", tone: "success" });
    expect(authorityLabel("approve_each").tone).toBe("warning");
    expect(authorityLabel("off").label).toBe("Off");
    expect(splitLead("**MIRAGE is the problem.** Its rate rose.")).toEqual({
      lead: "MIRAGE is the problem.",
      rest: "Its rate rose.",
    });
    expect(splitLead("plain text")).toEqual({ lead: null, rest: "plain text" });
  });

  it("turns scorecard metrics into strip tiles without inventing a delta", () => {
    const tiles = scorecardTiles([
      { key: "delivered", label: "Delivered · 30d", value: "3", sub: "2 scheduled · 1 asked", tone: "neutral" },
      { key: "opened", label: "Opened", value: "100%", sub: "acted on: 1", tone: "good" },
      { key: "grounded", label: "Grounded", value: "100%", sub: "12 of 12 sections", tone: "good" },
      { key: "spend", label: "AI spend · 30d", value: "$0.09", sub: "metered per report", tone: "neutral" },
    ]);
    expect(tiles).toHaveLength(4);
    expect(tiles.every((t) => t.delta === null)).toBe(true);
    expect(tiles[1]).toMatchObject({ key: "opened", value: "100%", tone: "good" });
  });
});

describe("live run helpers (SPEC-285)", () => {
  const section = (id: string, grounded = true): ReportSection => ({ id, title: id, tool: "t", grounded, kind: "kpis", kpis: [] });
  const call = (sectionId: string, tool: string, ms: number): TraceCall => ({ sectionId, tool, args: "", ms });

  it("hydrates the phase from the run's status", () => {
    expect(hydrateComposerState("draft", ["s1"], "note", "").phase).toBe("idle");
    const ready = hydrateComposerState("ready", ["s1", "s2"], "note", "Every figure: engine, 21 Sep");
    expect(ready.phase).toBe("ready");
    expect(ready.completed).toEqual(["s1", "s2"]);
    expect(ready.status).toContain("21 Sep");
    expect(hydrateComposerState("sent", ["s1"], "note", "").statusTone).toBe("sent");
    expect(hydrateComposerState("scheduled", ["s1"], "note", "").phase).toBe("scheduled");
    const failed = hydrateComposerState("failed", ["s1"], "note", "");
    expect(failed.phase).toBe("idle");
    expect(failed.status).toContain("failed");
  });

  it("merges a frame's sections in plan order, extras beside their family", () => {
    const skeleton = [section("s1"), section("s2"), section("s3")];
    const afterS2 = mergeSections(skeleton, [section("s2"), section("s2-b2")]);
    expect(afterS2.map((s) => s.id)).toEqual(["s1", "s2", "s2-b2", "s3"]);
    const afterS1 = mergeSections(afterS2, [section("s1", false)]);
    expect(afterS1[0].grounded).toBe(false);
    expect(afterS1.map((s) => s.id)).toEqual(["s1", "s2", "s2-b2", "s3"]);
    expect(mergeSections(afterS1, [section("s9")]).map((s) => s.id)).toEqual(["s1", "s2", "s2-b2", "s3", "s9"]);
  });

  it("replaces the trace's placeholder call with the measured one", () => {
    const trace = [call("s1", "revenue_summary", 0), call("s2", "top_products", 0)];
    const merged = mergeTrace(trace, [call("s2", "top_products", 412)]);
    expect(merged.map((c) => c.ms)).toEqual([0, 412]);
    expect(mergeTrace(merged, [call("s5", "write_narrative", 9000)])).toHaveLength(3);
  });

  it("marks several sections done at once, fails back to idle, and takes the backend's status lines", () => {
    let state: ComposerState = composerReducer(initialComposerState("note"), { type: "run" });
    state = composerReducer(state, { type: "sections_done", sectionIds: ["s1", "s1-b2"] });
    state = composerReducer(state, { type: "sections_done", sectionIds: ["s1-b2", "s2"] });
    expect(state.completed).toEqual(["s1", "s1-b2", "s2"]);
    const failed = composerReducer(state, { type: "fail", message: "The run failed before the report was ready." });
    expect(failed.phase).toBe("idle");
    expect(failed.status).toContain("failed");
    const ready = composerReducer(state, { type: "finish", toolCount: 3, elapsed: "4.1 s", status: "custom" });
    expect(ready.status).toBe("custom");
    const sent = composerReducer(ready, { type: "send", to: "x", at: "", status: "Approved · email not sent: SMTP is not configured" });
    expect(sent.status).toContain("SMTP");
    expect(composerReducer(sent, { type: "fail", message: "late" })).toBe(sent); // only a running run can fail
  });
});


describe("templates a workspace can run (SPEC-365)", () => {
  const t = (id: string, sectionApps?: string[][]): ReportTemplateSummary => ({
    id,
    name: id,
    cadence: "weekly",
    summary: "",
    sectionCount: sectionApps?.length ?? 1,
    toolCount: 1,
    runs: "on demand",
    sectionApps,
  });
  const executive = t("executive", [[], []]);
  const league = t("store-league", [[], ["vcount"], ["vcount"]]);
  const support = t("support-week", [["gorgias"], ["gorgias"]]);
  const website = t("website-behaviour", [["clarity"], ["google"]]);
  const custom = t("mine");
  const shopify = new Set(["shopify"]);

  it("runs when one data section reads Shopify alone or a connected app", () => {
    expect(canRun(executive, shopify)).toBe(true);
    expect(canRun(league, shopify)).toBe(true); // its first section is Shopify's
    expect(canRun(support, shopify)).toBe(false);
    expect(canRun(support, new Set(["gorgias"]))).toBe(true);
    expect(canRun(website, new Set(["google"]))).toBe(true);
    expect(canRun(custom, shopify)).toBe(true);
  });

  it("offers a guided workspace only what can run, and a full one everything", () => {
    const all = [executive, support, website, custom];
    expect(offeredTemplates(all, true, shopify).map((x) => x.id)).toEqual(["executive", "mine"]);
    expect(offeredTemplates(all, false, shopify)).toEqual(all);
  });

  it("fills the Desk's six from every template, and keeps a full workspace's as sent", () => {
    const many = [support, website, ...Array.from({ length: 7 }, (_, i) => t(`s${i}`, [[]]))];
    const data = { templates: many.slice(0, 6), templatesTotal: many.length, allTemplates: many };
    const guided = deskTemplates(data, true, shopify);
    expect(guided.templates.map((x) => x.id)).toEqual(["s0", "s1", "s2", "s3", "s4", "s5"]);
    expect(guided.total).toBe(7);
    expect(deskTemplates(data, false, shopify)).toEqual({ templates: data.templates, total: many.length });
    expect(deskTemplates({ templates: data.templates, templatesTotal: 9 }, true, shopify).total).toBe(9);
  });
});
