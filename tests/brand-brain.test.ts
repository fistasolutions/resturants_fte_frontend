/** SPEC-263 — Brand Brain v2 pure helpers and adapters. */

import { describe, expect, it } from "vitest";

import {
  bulkOptions,
  sampleSourceLine,
  voiceSummary,
  conflictCurrentValue,
  FACT_SECTION_ORDER,
  factHref,
  factSourceLine,
  factsSummary,
  filterCounts,
  filterFacts,
  isBrandBrainDetailPath,
  relatedFacts,
  SECTION_USERS,
  sectionStats,
  sourceHref,
  sourceTitleMap,
  adaptBrandRule,
  adaptBrandSource,
  adaptCoverage,
  adaptVoiceCheck,
  anyExtracting,
  BRAND_BRAIN_SECTIONS,
  brandBrainHref,
  brandBrainSectionLabel,
  coverageTone,
  eventKindLabel,
  groupFactsBySection,
  highlightHits,
  isBrandBrainSection,
  LEGACY_SECTION_REDIRECTS,
  pendingCount,
  rulesOfKind,
  sourceChip,
  wrongForms,
} from "@/lib/brand-brain";
import { brandBrainPaths, brandBrainQueries } from "@/lib/queries/brand-brain";
import type { BrandRule } from "@/types/brand-brain";
import type { Fact } from "@/types/spotlight";

describe("sections", () => {
  it("has nine sub-tabs in bar order, each with a label and an href", () => {
    expect(BRAND_BRAIN_SECTIONS).toEqual([
      "coverage",
      "review",
      "files",
      "facts",
      "voice",
      "guardrails",
      "style-guide",
      "personas",
      "competitors",
    ]);
    // Measured and History folded away (SPEC-281): old links still land somewhere true.
    expect(isBrandBrainSection("measured")).toBe(false);
    expect(LEGACY_SECTION_REDIRECTS.measured).toBe("/spotlight/brand-brain/facts?filter=measured");
    expect(LEGACY_SECTION_REDIRECTS.history).toBe("/spotlight/brand-brain/coverage");
    expect(brandBrainSectionLabel("guardrails")).toBe("Guardrails");
    expect(brandBrainSectionLabel("files")).toBe("Knowledge Base");
    // SPEC-341: what the Brand Researcher found, second after Coverage.
    expect(brandBrainSectionLabel("review")).toBe("Review");
    expect(brandBrainHref("review")).toBe("/spotlight/brand-brain/review");
    expect(brandBrainHref("files")).toBe("/spotlight/brand-brain/files");
    expect(isBrandBrainSection("voice")).toBe(true);
    expect(isBrandBrainSection("nope")).toBe(false);
    expect(isBrandBrainSection(undefined)).toBe(false);
  });
});

describe("adapters", () => {
  it("adapts coverage, mapping provenance names to chips and unknown tabs to files", () => {
    const data = adaptCoverage({
      score: 62,
      sections: [
        { key: "identity", label: "Identity", progress: 100, status: "complete", sources: ["owner"], stale: 0 },
        { key: "policies", label: "Policies", progress: 0, status: "empty", sources: [], stale: 2 },
        { key: "markets", label: "Markets", progress: 100, status: "weird", sources: ["measured", "file"], stale: 0 },
      ],
      missing: [{ key: "policies", title: "Returns policy", why: "w", cta: "Add", tab: "nope" }],
      counts: { approved: 31, pending: 9, empty: 4 },
      last_confirmed: "2026-08-11T00:00:00+00:00",
      usage: { drafts_30d: 14, social_posts_30d: 38, window_days: 30 },
    });
    expect(data.sections[0].sources).toEqual(["onboarding"]);
    expect(data.sections[2].sources).toEqual(["measured", "file"]);
    expect(data.sections[2].status).toBe("empty");
    expect(data.missing[0].tab).toBe("files");
    expect(data.usage).toEqual({ drafts30d: 14, socialPosts30d: 38, windowDays: 30 });
    expect(data.lastConfirmed).toBe("2026-08-11T00:00:00+00:00");
  });

  it("adapts sources with safe fallbacks for kind, role and status", () => {
    const source = adaptBrandSource({
      id: 3,
      kind: "pdf",
      name: "Size_Chart.pdf",
      url: null,
      role: "facts",
      status: "extracting",
      fact_count: 0,
      pending_count: 0,
      text_chars: 0,
      error: null,
      uploaded_by: "o@x.com",
      uploaded_at: "2026-09-17T10:00:00+00:00",
      checked_at: null,
    });
    expect(source.kind).toBe("pdf");
    expect(source.status).toBe("extracting");
    const odd = adaptBrandSource({ ...sourceRaw(), kind: "zip", role: "voice", status: "bogus" });
    expect(odd.kind).toBe("txt");
    expect(odd.role).toBe("voice");
    expect(odd.status).toBe("extracting");
  });

  it("adapts rules and the voice check", () => {
    const rule = adaptBrandRule({
      id: 1,
      kind: "word_required",
      label: "Shabbos",
      detail: "Shabbat, Sabbath",
      enabled: true,
      starts_on: null,
      ends_on: null,
      provenance: "owner",
    });
    expect(rule.kind).toBe("word_required");
    expect(wrongForms(rule)).toEqual(["Shabbat", "Sabbath"]);
    const check = adaptVoiceCheck({
      score: 59,
      verdict: "sent back",
      hits: [{ kind: "banned", text: "cheap", note: "n" }, { kind: "mystery", text: "x", note: "n" }],
      findings: [{ ok: true, text: "Warm" }],
      rewrite: "Better.",
      judged: true,
    });
    expect(check.verdict).toBe("sent back");
    expect(check.hits[1].kind).toBe("banned");
  });

  it("maps provenance names to chips", () => {
    expect(sourceChip("owner")).toBe("onboarding");
    expect(sourceChip("file")).toBe("file");
    expect(sourceChip("measured")).toBe("measured");
    expect(sourceChip("anything")).toBe("manual");
  });
});

describe("helpers", () => {
  it("coverageTone", () => {
    expect(coverageTone(100)).toBe("success");
    expect(coverageTone(40)).toBe("warning");
    expect(coverageTone(0)).toBe("destructive");
  });

  it("groups facts by section in reading order and drops empty sections", () => {
    const facts: Fact[] = [
      fact("policy", "Returns"),
      fact("identity", "Category"),
      fact("policy", "Shipping"),
      fact("proof_point", "AOV"),
    ];
    const groups = groupFactsBySection(facts);
    expect(groups.map((g) => g.section)).toEqual(["identity", "policy", "proof_point"]);
    expect(groups[1].facts.map((f) => f.label)).toEqual(["Returns", "Shipping"]);
  });

  it("counts pending and conflict facts as awaiting", () => {
    expect(
      pendingCount([{ status: "pending" }, { status: "conflict" }, { status: "approved" }, { status: "rejected" }]),
    ).toBe(2);
  });

  it("filters rules by kind and detects extraction in flight", () => {
    const rules: BrandRule[] = [ruleOf("word_banned", "cheap"), ruleOf("calendar", "Pesach"), ruleOf("word_banned", "hide")];
    expect(rulesOfKind(rules, "word_banned").map((r) => r.label)).toEqual(["cheap", "hide"]);
    expect(anyExtracting([{ status: "ready" }, { status: "extracting" }])).toBe(true);
    expect(anyExtracting([{ status: "ready" }, { status: "failed" }])).toBe(false);
  });

  it("splits text into highlighted runs around every hit, case-insensitively", () => {
    const runs = highlightHits("Cheap skirts for Shabbat, unbeatable!", [
      { kind: "banned", text: "cheap", note: "" },
      { kind: "wrong_form", text: "Shabbat", note: "" },
      { kind: "price_claim", text: "unbeatable", note: "" },
      { kind: "exclamation", text: "!", note: "" },
    ]);
    expect(runs.filter((r) => r.hit).map((r) => r.text)).toEqual(["Cheap", "Shabbat", "unbeatable"]);
    expect(runs.map((r) => r.text).join("")).toBe("Cheap skirts for Shabbat, unbeatable!");
    expect(highlightHits("clean", [])).toEqual([{ text: "clean", hit: false }]);
  });

  it("labels history kinds for the owner", () => {
    expect(eventKindLabel("fact_approved")).toBe("Approved");
    expect(eventKindLabel("something_new")).toBe("something new");
  });
});

describe("query registry", () => {
  it("prefixes every key with brand-brain so one invalidation covers the family", () => {
    const defs = [
      brandBrainQueries.coverage(),
      brandBrainQueries.sources(),
      brandBrainQueries.sourceFacts(4),
      brandBrainQueries.facts(),
      brandBrainQueries.voice(),
      brandBrainQueries.rules(),
      brandBrainQueries.history(),
    ];
    for (const def of defs) expect(def.queryKey[0]).toBe("brand-brain");
    expect(brandBrainPaths.sourceFacts(4)).toBe("/brand-brain/sources/4/facts");
    expect(brandBrainPaths.history(20)).toBe("/brand-brain/history?limit=20");
  });
});

function fact(section: Fact["section"], label: string): Fact {
  return { id: 1, section, label, value: "v", source: "onboarding", status: "approved", enabled: true };
}

function ruleOf(kind: BrandRule["kind"], label: string): BrandRule {
  return { id: 1, kind, section: null, label, detail: null, enabled: true, startsOn: null, endsOn: null, provenance: "owner", sourceId: null };
}

function sourceRaw() {
  return {
    id: 1,
    kind: "txt",
    name: "x",
    url: null,
    role: "facts",
    status: "ready",
    fact_count: 1,
    text_chars: 10,
    error: null,
    uploaded_by: null,
    uploaded_at: null,
    checked_at: null,
  };
}

describe("Facts, redesigned (SPEC-274)", () => {
  const f = (over: Partial<Fact>): Fact => ({ label: "L", value: "V", source: "onboarding", status: "approved", enabled: true, section: "identity", id: 1, confirmedAt: "2026-08-11T00:00:00+00:00", ...over });
  const facts: Fact[] = [
    f({ id: 1, label: "Category", value: "Modern modest womenswear" }),
    f({ id: 2, label: "Size range", section: "product", source: "file", sourceId: 5, sourceLocator: "p.4", status: "conflict", sourceNote: "Conflicts with the approved value: Sizes XS–3XL." }),
    f({ id: 3, label: "Best-selling category", section: "product", source: "file", sourceId: 5, sourceLocator: "p.5", status: "pending", confirmedAt: null }),
    f({ id: 4, label: "Price position", section: "product", source: "file", sourceId: 5, enabled: false, confirmedAt: "2026-09-18T09:00:00+00:00" }),
    f({ id: null, label: "Customer rating", section: "proof_point", source: "measured", sourceNote: "trailing 90 days" }),
    f({ id: 6, label: "Old rating", section: "proof_point", status: "rejected" }),
  ];

  it("filters by what needs a decision, by source, by switched off and by measured", () => {
    expect(filterFacts(facts, "wait", "").map((x) => x.id)).toEqual([2, 3]);
    expect(filterFacts(facts, "file", "").map((x) => x.id)).toEqual([2, 3, 4]);
    expect(filterFacts(facts, "off", "").map((x) => x.id)).toEqual([4]);
    expect(filterFacts(facts, "measured", "").map((x) => x.label)).toEqual(["Customer rating"]);
    expect(filterFacts(facts, "all", "size").map((x) => x.id)).toEqual([2]);
    expect(filterFacts(facts, "all", "proof").map((x) => x.label)).toEqual(["Customer rating", "Old rating"]);
    expect(filterCounts(facts)).toEqual({ all: 5, wait: 2, file: 3, off: 1, measured: 1 });
  });

  it("summarises the brain for the tiles", () => {
    expect(factsSummary(facts)).toEqual({ total: 5, approved: 3, pending: 1, conflict: 1, off: 1, measured: 1, rejected: 1, onboarding: 1, file: 3, manual: 0, newestApproval: "2026-09-18T09:00:00+00:00", oldestFact: "2026-08-11T00:00:00+00:00" });
  });

  it("gives every section a count and a pending badge, in order", () => {
    const stats = sectionStats(facts);
    expect(stats.map((s) => s.section)).toEqual(FACT_SECTION_ORDER);
    expect(stats.find((s) => s.section === "product")).toEqual({ section: "product", label: "Products & sizing", count: 3, pending: 2 });
    expect(stats.find((s) => s.section === "competitor")?.count).toBe(0);
  });

  it("writes the inline source line from the fact and the library", () => {
    const titles = sourceTitleMap([{ id: 5, title: "Founding document" }]);
    const day = (iso: string) => iso.slice(0, 10);
    expect(factSourceLine(facts[0], titles, day)).toEqual({ name: "Onboarding", detail: "approved 2026-08-11" });
    expect(factSourceLine(facts[1], titles, day)).toEqual({ name: "Founding document", detail: "p.4 · conflicts with the approved value" });
    expect(factSourceLine(facts[2], titles, day)).toEqual({ name: "Founding document", detail: "p.5 · pending" });
    expect(factSourceLine(facts[3], titles, day)).toEqual({ name: "Founding document", detail: "approved 2026-09-18" });
    expect(factSourceLine(facts[4], titles, day)).toEqual({ name: "Measured from the store", detail: "trailing 90 days" });
    expect(factSourceLine(f({ source: "file", sourceId: 99 }), titles, day).name).toBe("A document");
  });

  it("offers a selection only what it can do — never Approve to an approved fact", () => {
    expect(bulkOptions(facts, new Set([1]))).toEqual({ total: 1, decide: 0, approvedOn: 1, approvedOff: 0 });
    expect(bulkOptions(facts, new Set([1, 2, 3, 4]))).toEqual({ total: 4, decide: 2, approvedOn: 1, approvedOff: 1 });
    expect(bulkOptions(facts, new Set([99]))).toEqual({ total: 0, decide: 0, approvedOn: 0, approvedOff: 0 });
  });

  it("reads the approved value out of a conflict note and finds related facts", () => {
    expect(conflictCurrentValue(facts[1])).toBe("Sizes XS–3XL.");
    expect(conflictCurrentValue(facts[0])).toBeNull();
    expect(relatedFacts(facts[1], facts).map((x) => x.id)).toEqual([3, 4]);
    expect(SECTION_USERS.product).toContain("product pages");
    expect(isBrandBrainDetailPath("/spotlight/brand-brain/files/5")).toBe(true);
    expect(isBrandBrainDetailPath("/spotlight/brand-brain/facts/12/")).toBe(true);
    expect(isBrandBrainDetailPath("/spotlight/brand-brain/files")).toBe(false);
    expect(sourceHref(5)).toBe("/spotlight/brand-brain/files/5");
    expect(factHref(12)).toBe("/spotlight/brand-brain/facts/12");
  });
});

describe("Voice, redesigned (SPEC-274 Patches)", () => {
  const sample = (id: number, sourceId: number | null, channel: string | null) => ({ id, text: "x".repeat(20), channel, sourceId, onVoice: null, createdAt: null });
  const rule = (id: number, enabled: boolean) => ({ id, title: `r${id}`, detail: "", enabled, provenance: "derived" as const, sourceId: null });

  it("names the next step from what is there", () => {
    expect(voiceSummary({ samples: [sample(1, null, "manual")], rules: [], minSamples: 3 })).toEqual({ samples: 1, fromFiles: 0, pasted: 1, rules: 0, rulesOn: 0, needed: 2, step: "samples" });
    expect(voiceSummary({ samples: [sample(1, 5, "file"), sample(2, 5, "file"), sample(3, null, "manual")], rules: [], minSamples: 3 }).step).toBe("derive");
    const ready = voiceSummary({ samples: [sample(1, 5, "file"), sample(2, 5, "file"), sample(3, null, "manual")], rules: [rule(1, true), rule(2, false)], minSamples: 3 });
    expect(ready).toMatchObject({ step: "ready", rules: 2, rulesOn: 1, fromFiles: 2, pasted: 1, needed: 0 });
  });

  it("writes a sample's source line", () => {
    const titles = sourceTitleMap([{ id: 5, title: "Founding document" }]);
    expect(sampleSourceLine(sample(1, 5, "file"), titles)).toBe("Founding document");
    expect(sampleSourceLine(sample(2, 99, "file"), titles)).toBe("A document");
    expect(sampleSourceLine(sample(3, null, "manual"), titles)).toBe("Pasted by you");
    expect(sampleSourceLine(sample(4, null, "instagram"), titles)).toBe("instagram");
  });
});
