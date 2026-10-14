import { describe, expect, it } from "vitest";

import {
  indexBadge,
  indexHint,
  indexSummaryLine,
  inspectInSearchConsoleUrl,
  worstState,
} from "@/lib/index-status";
import type { PostIndexStatus } from "@/types/spotlight";

function status(state: PostIndexStatus["state"]): PostIndexStatus {
  return {
    state,
    coverageState: "x",
    verdict: "NEUTRAL",
    lastCrawlTime: null,
    googleCanonical: null,
    referringUrls: [],
    inspectedAt: "2026-09-17T09:00:00+00:00",
  };
}

describe("indexBadge (SPEC-261)", () => {
  it("names every state and never calls an uninspected post indexed", () => {
    expect(indexBadge(null)).toEqual({ label: "Not inspected yet", tone: "muted" });
    expect(indexBadge(status("indexed"))).toEqual({ label: "Indexed", tone: "success" });
    expect(indexBadge(status("discovered"))).toEqual({
      label: "Discovered, not indexed",
      tone: "warning",
    });
    expect(indexBadge(status("crawled")).tone).toBe("warning");
    expect(indexBadge(status("unknown"))).toEqual({ label: "Unknown to Google", tone: "muted" });
    expect(indexBadge(status("excluded")).tone).toBe("destructive");
    expect(indexBadge(status("error")).tone).toBe("destructive");
  });
});

describe("indexHint", () => {
  it("gives a next step per state and a neutral line before inspection", () => {
    expect(indexHint("discovered")).toMatch(/link from a page Google already crawls/);
    expect(indexHint("unknown")).toMatch(/never seen this URL/);
    expect(indexHint("indexed")).toMatch(/Impressions arrive/);
    expect(indexHint("excluded")).toMatch(/noindex/);
    expect(indexHint(null)).toMatch(/next Search Console sync/);
  });
});

describe("worstState", () => {
  it("leads with the most urgent state present", () => {
    expect(worstState(["indexed", "discovered", null])).toBe("discovered");
    expect(worstState(["indexed", "unknown", "discovered"])).toBe("unknown");
    expect(worstState(["indexed", "error"])).toBe("error");
    expect(worstState(["indexed", "indexed"])).toBe("indexed");
    expect(worstState([null, null])).toBeNull();
    expect(worstState([])).toBeNull();
  });
});

describe("inspectInSearchConsoleUrl", () => {
  it("deep-links the URL Inspection tool with both parameters encoded", () => {
    const url = inspectInSearchConsoleUrl(
      "https://examplestore.com/",
      "https://examplestore.com/blogs/news/a-post",
    );
    expect(url).toBe(
      "https://search.google.com/search-console/inspect?resource_id=https%3A%2F%2Fexamplestore.com%2F&id=https%3A%2F%2Fexamplestore.com%2Fblogs%2Fnews%2Fa-post",
    );
    expect(inspectInSearchConsoleUrl(null, "https://x.com/p")).toBe(
      "https://search.google.com/search-console/inspect?id=https%3A%2F%2Fx.com%2Fp",
    );
  });
});

describe("indexSummaryLine", () => {
  it("counts posts and names the not-indexed and uninspected remainders", () => {
    expect(indexSummaryLine({ indexed: 2, notIndexed: 2, uninspected: 0 })).toBe(
      "2 of 4 posts indexed by Google · 2 not indexed",
    );
    expect(indexSummaryLine({ indexed: 1, notIndexed: 0, uninspected: 0 })).toBe(
      "1 of 1 post indexed by Google",
    );
    expect(indexSummaryLine({ indexed: 0, notIndexed: 0, uninspected: 3 })).toBe(
      "0 of 3 posts indexed by Google · 3 not inspected yet",
    );
    expect(indexSummaryLine({ indexed: 0, notIndexed: 0, uninspected: 0 })).toBe(
      "No published posts yet",
    );
  });
});
