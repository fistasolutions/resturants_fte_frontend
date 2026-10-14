/** SPEC-267 — Knowledge Base pure helpers. */

import { describe, expect, it } from "vitest";

import {
  librarySummary,
  libraryStatus,
  matchesStatus,
  statusCounts,
  streamPills,
  ACCEPT_LIVE,
  allTags,
  DEFAULT_LIBRARY_FILTERS,
  filterLibrary,
  formatBytes,
  KIND_META,
  parseTags,
  refuseReason,
  sortLibrary,
  taughtSummary,
} from "@/lib/knowledge-base";
import type { BrandSource } from "@/types/brand-brain";

function source(over: Partial<BrandSource>): BrandSource {
  return {
    id: 1,
    kind: "pdf",
    name: "x.pdf",
    title: "X",
    tags: [],
    url: null,
    role: "facts",
    status: "ready",
    factCount: 0,
    pendingCount: 0,
    personaCount: 0,
    sampleCount: 0,
    ruleCount: 0,
    textChars: 0,
    sizeBytes: 0,
    contentType: null,
    hasFile: true,
    error: null,
    uploadedBy: null,
    uploadedAt: "2026-09-17T10:00:00+00:00",
    checkedAt: null,
    nextCheckAt: null,
    ...over,
  };
}

describe("kinds", () => {
  it("lists six live kinds and three coming soon, and accepts only the live ones", () => {
    expect(KIND_META.filter((k) => !k.comingSoon).map((k) => k.label)).toEqual(["PDF", "Doc", "Sheet", "Slides", "CSV", "Text"]);
    expect(KIND_META.filter((k) => k.comingSoon).map((k) => k.label)).toEqual(["Image", "Audio", "Video"]);
    expect(ACCEPT_LIVE).toContain(".pptx");
    expect(ACCEPT_LIVE).not.toContain(".png");
  });

  it("refuses in the browser with a reason the owner can act on", () => {
    expect(refuseReason({ name: "Size_Chart.pdf", size: 1000 })).toBeNull();
    expect(refuseReason({ name: "deck.PPTX", size: 1000 })).toBeNull();
    expect(refuseReason({ name: "look.jpg", size: 1000 })).toBe("Images are coming soon — for now, paste the text instead.");
    expect(refuseReason({ name: "clip.mp4", size: 1000 })).toBe("Video is coming soon — for now, paste the text instead.");
    expect(refuseReason({ name: "archive.zip", size: 1000 })).toMatch(/^Only PDF/);
    expect(refuseReason({ name: "big.pdf", size: 11 * 1024 * 1024 })).toBe("That file is over 10 MB.");
  });
});

describe("tags", () => {
  it("parses a comma list, trims, de-duplicates case-insensitively, caps at 10", () => {
    expect(parseTags(" Company , product,company ,, ")).toEqual(["Company", "product"]);
    expect(parseTags("Policy", ["policy"])).toEqual(["policy"]);
    expect(parseTags(Array.from({ length: 12 }, (_, i) => `t${i}`).join(","))).toHaveLength(10);
  });

  it("counts every tag in the library, most used first", () => {
    expect(allTags([{ tags: ["A", "B"] }, { tags: ["B"] }, { tags: ["C", "B"] }])).toEqual([
      { tag: "B", count: 3 },
      { tag: "A", count: 1 },
      { tag: "C", count: 1 },
    ]);
  });
});

describe("library", () => {
  const rows = [
    source({ id: 1, title: "Size Chart 2026", tags: ["Product"], kind: "pdf", uploadedAt: "2026-09-17T10:00:00+00:00" }),
    source({ id: 2, title: "Brand book", tags: ["Company"], kind: "pptx", uploadedAt: "2026-09-16T10:00:00+00:00" }),
    source({ id: 3, title: "Returns policy", tags: ["Policy"], kind: "url", url: "https://examplestore.com/pages/returns", uploadedAt: "2026-09-15T10:00:00+00:00" }),
  ];

  it("filters by query over title, url and tags, by tag, and by kind", () => {
    expect(filterLibrary(rows, { ...DEFAULT_LIBRARY_FILTERS, query: "size chart" }).map((s) => s.id)).toEqual([1]);
    expect(filterLibrary(rows, { ...DEFAULT_LIBRARY_FILTERS, query: "returns" }).map((s) => s.id)).toEqual([3]);
    expect(filterLibrary(rows, { ...DEFAULT_LIBRARY_FILTERS, tag: "Company" }).map((s) => s.id)).toEqual([2]);
    expect(filterLibrary(rows, { ...DEFAULT_LIBRARY_FILTERS, kind: "url" }).map((s) => s.id)).toEqual([3]);
    expect(filterLibrary(rows, DEFAULT_LIBRARY_FILTERS)).toHaveLength(3);
  });

  it("sorts newest, by name, needs-review first and most taught", () => {
    expect(sortLibrary(rows, "newest").map((s) => s.id)).toEqual([1, 2, 3]);
    expect(sortLibrary(rows, "name").map((s) => s.title)).toEqual(["Brand book", "Returns policy", "Size Chart 2026"]);
    const mixed = [
      source({ id: 1, status: "ready", pendingCount: 0, factCount: 2, uploadedAt: "2026-09-17T10:00:00+00:00" }),
      source({ id: 2, status: "ready", pendingCount: 3, factCount: 9, uploadedAt: "2026-09-16T10:00:00+00:00" }),
      source({ id: 3, status: "failed", uploadedAt: "2026-09-15T10:00:00+00:00" }),
      source({ id: 4, status: "extracting", uploadedAt: "2026-09-14T10:00:00+00:00" }),
    ];
    expect(sortLibrary(mixed, "review").map((s) => s.id)).toEqual([2, 3, 4, 1]);
    expect(sortLibrary(mixed, "taught").map((s) => s.id)).toEqual([2, 1, 3, 4]);
  });

  it("gives each item one status and counts them for the segments (SPEC-274)", () => {
    expect(libraryStatus(source({ status: "extracting" }))).toBe("reading");
    expect(libraryStatus(source({ status: "failed" }))).toBe("failed");
    expect(libraryStatus(source({ status: "ready", pendingCount: 2 }))).toBe("review");
    expect(libraryStatus(source({ status: "ready", pendingCount: 0, kind: "url" }))).toBe("watched");
    expect(libraryStatus(source({ status: "ready", pendingCount: 0 }))).toBe("ready");
    const mixed = [source({ status: "ready", pendingCount: 2 }), source({ status: "ready", kind: "url" }), source({ status: "failed" })];
    expect(statusCounts(mixed)).toEqual({ all: 3, review: 1, reading: 0, ready: 1, failed: 1 });
    expect(mixed.filter((s) => matchesStatus(s, "ready"))).toHaveLength(1);
    expect(mixed.filter((s) => matchesStatus(s, "review"))).toHaveLength(1);
  });

  it("sums the library tiles and builds the four stream pills", () => {
    const lib = [
      source({ kind: "docx", factCount: 16, pendingCount: 14, sampleCount: 4, ruleCount: 10, uploadedAt: "2026-09-18T06:00:00+00:00" }),
      source({ kind: "text", factCount: 2, uploadedAt: "2026-09-17T06:00:00+00:00" }),
      source({ kind: "url", factCount: 3, personaCount: 1 }),
    ];
    expect(librarySummary(lib)).toEqual({ items: 3, documents: 1, notes: 1, pages: 1, facts: 21, personas: 1, samples: 4, rules: 10, pending: 14, pendingSources: 1, newestAt: "2026-09-18T06:00:00+00:00" });
    const pills = streamPills(lib[0]);
    expect(pills.map((p) => p.tone)).toEqual(["wait", "zero", "on", "off"]);
    expect(pills[0].label).toBe("Facts 16 · 14 to review");
    expect(streamPills(lib[1])[0].label).toBe("Facts 2 · approved");
    expect(pills[3].label).toBe("Rules 10");
  });

  it("summarises what an item taught", () => {
    expect(taughtSummary(source({ status: "extracting" }))).toBe("Extracting…");
    expect(taughtSummary(source({ status: "failed", error: "Bad PDF" }))).toBe("Bad PDF");
    expect(taughtSummary(source({ role: "voice", sampleCount: 42 }))).toBe("42 voice samples");
    expect(taughtSummary(source({ factCount: 6, pendingCount: 6 }))).toBe("6 facts awaiting");
    expect(taughtSummary(source({ factCount: 6, personaCount: 1, sampleCount: 3, ruleCount: 2 }))).toBe(
      "6 facts · 1 persona · 3 samples · 2 rules",
    );
  });

  it("formats bytes", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(20 * 1024)).toBe("20 KB");
    expect(formatBytes(2.5 * 1024 * 1024)).toBe("2.5 MB");
  });
});
