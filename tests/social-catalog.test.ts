import { describe, expect, it } from "vitest";

import {
  buildProductsQuery,
  categoryLabel,
  mergeDraftsByChannel,
  pageInfo,
  pageWindow,
  searchApplies,
  SOCIAL_CATEGORIES,
  sortDrafts,
  STUDIO_PAGE_SIZE,
} from "@/lib/social-catalog";
import { mockContentStudio } from "@/lib/mock/social";
import type { ProductDraft } from "@/types/social";

/** A ProductDraft fixture reusing the mock catalog's first creative. */
function draft(channel: string, over: Partial<ProductDraft> = {}): ProductDraft {
  return {
    postId: `post-${channel}`,
    channel,
    creative: mockContentStudio.products[0].creative,
    hasImage: false,
    imageConcept: null,
    ...over,
  };
}

describe("categoryLabel (SPEC-134 category → display label)", () => {
  it("returns the configured label for each known category", () => {
    for (const { id, label } of SOCIAL_CATEGORIES) {
      expect(categoryLabel(id)).toBe(label);
    }
  });

  it("title-cases an unknown token as a graceful fallback", () => {
    expect(categoryLabel("mystery_signal")).toBe("Mystery signal");
    expect(categoryLabel("")).toBe("");
  });
});

describe("searchApplies (search is an `all`-only affordance)", () => {
  it("is true only for the full-catalog `all` category", () => {
    expect(searchApplies("all")).toBe(true);
    expect(searchApplies("recommended")).toBe(false);
    expect(searchApplies("best_seller")).toBe(false);
    expect(searchApplies("dead_stock")).toBe(false);
    expect(searchApplies("high_margin")).toBe(false);
  });
});

describe("buildProductsQuery (GET /social/products query string)", () => {
  it("always includes the category", () => {
    expect(buildProductsQuery("recommended")).toBe("?category=recommended");
    expect(buildProductsQuery("dead_stock")).toBe("?category=dead_stock");
  });

  it("includes a trimmed search only for the `all` category", () => {
    expect(buildProductsQuery("all", "wrap dress")).toBe(
      "?category=all&search=wrap+dress",
    );
    expect(buildProductsQuery("all", "  red  ")).toBe("?category=all&search=red");
  });

  it("drops search for non-`all` categories even when provided", () => {
    expect(buildProductsQuery("best_seller", "wrap dress")).toBe(
      "?category=best_seller",
    );
  });

  it("drops an empty or whitespace-only search on `all`", () => {
    expect(buildProductsQuery("all", "")).toBe("?category=all");
    expect(buildProductsQuery("all", "   ")).toBe("?category=all");
  });

  it("includes limit only when a positive number, in a stable key order", () => {
    expect(buildProductsQuery("all", "hat", 8)).toBe(
      "?category=all&search=hat&limit=8",
    );
    expect(buildProductsQuery("recommended", undefined, 12)).toBe(
      "?category=recommended&limit=12",
    );
    expect(buildProductsQuery("recommended", undefined, 0)).toBe(
      "?category=recommended",
    );
    expect(buildProductsQuery("recommended", undefined, -1)).toBe(
      "?category=recommended",
    );
  });

  it("includes offset only when positive, after limit (SPEC-135)", () => {
    expect(buildProductsQuery("recommended", undefined, 12, 24)).toBe(
      "?category=recommended&limit=12&offset=24",
    );
    expect(buildProductsQuery("all", "hat", 12, 12)).toBe(
      "?category=all&search=hat&limit=12&offset=12",
    );
    // Page 1 (offset 0) and negatives are omitted.
    expect(buildProductsQuery("recommended", undefined, 12, 0)).toBe(
      "?category=recommended&limit=12",
    );
    expect(buildProductsQuery("recommended", undefined, 12, -12)).toBe(
      "?category=recommended&limit=12",
    );
    // Offset without limit still appends in deterministic order.
    expect(buildProductsQuery("recommended", undefined, undefined, 5)).toBe(
      "?category=recommended&offset=5",
    );
  });
});

describe("pageInfo (SPEC-135 offset pagination math)", () => {
  it("reports a single page (1 of 1) for an empty catalog", () => {
    const info = pageInfo(0, 12, 0);
    expect(info).toMatchObject({
      page: 1,
      pageCount: 1,
      hasPrev: false,
      hasNext: false,
      from: 0,
      to: 0,
      total: 0,
    });
  });

  it("reports a single page when total fits in one window", () => {
    const info = pageInfo(8, 12, 0);
    expect(info).toMatchObject({
      page: 1,
      pageCount: 1,
      hasPrev: false,
      hasNext: false,
      from: 1,
      to: 8,
    });
  });

  it("derives first / middle / last page across a multi-page total", () => {
    const first = pageInfo(30, 12, 0);
    expect(first).toMatchObject({ page: 1, pageCount: 3, hasPrev: false, hasNext: true, from: 1, to: 12 });

    const middle = pageInfo(30, 12, 12);
    expect(middle).toMatchObject({ page: 2, pageCount: 3, hasPrev: true, hasNext: true, from: 13, to: 24 });

    const last = pageInfo(30, 12, 24);
    expect(last).toMatchObject({ page: 3, pageCount: 3, hasPrev: true, hasNext: false, from: 25, to: 30 });
  });

  it("handles an exact multiple with no dangling page", () => {
    expect(pageInfo(24, 12, 12)).toMatchObject({
      page: 2,
      pageCount: 2,
      hasPrev: true,
      hasNext: false,
      from: 13,
      to: 24,
    });
  });

  it("falls back to STUDIO_PAGE_SIZE for a non-positive limit", () => {
    const info = pageInfo(30, 0, 0);
    expect(info.pageCount).toBe(Math.ceil(30 / STUDIO_PAGE_SIZE));
    expect(info.to).toBe(STUDIO_PAGE_SIZE);
  });

  it("clamps a negative offset to the first page", () => {
    expect(pageInfo(30, 12, -10)).toMatchObject({ page: 1, hasPrev: false, from: 1 });
  });
});

describe("pageWindow (SPEC-135 numbered page buttons)", () => {
  it("returns [1] when there is at most one page", () => {
    expect(pageWindow(1, 1)).toEqual([1]);
    expect(pageWindow(1, 0)).toEqual([1]);
  });

  it("lists every page when the count fits the window", () => {
    expect(pageWindow(2, 3)).toEqual([1, 2, 3]);
  });

  it("centers on the current page and never exceeds min(max, pageCount)", () => {
    expect(pageWindow(5, 10, 5)).toEqual([3, 4, 5, 6, 7]);
    expect(pageWindow(5, 10, 5)).toHaveLength(5);
  });

  it("clamps the window to the start and end of the range", () => {
    expect(pageWindow(1, 10, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(pageWindow(10, 10, 5)).toEqual([6, 7, 8, 9, 10]);
  });

  it("clamps an out-of-range current page into the window", () => {
    expect(pageWindow(99, 4, 5)).toEqual([1, 2, 3, 4]);
    expect(pageWindow(-3, 4, 5)).toEqual([1, 2, 3, 4]);
  });
});

describe("sortDrafts (stable IG → FB order)", () => {
  it("orders Instagram before Facebook regardless of input order", () => {
    const sorted = sortDrafts([draft("facebook"), draft("instagram")]);
    expect(sorted.map((d) => d.channel)).toEqual(["instagram", "facebook"]);
  });

  it("does not mutate the input array", () => {
    const input = [draft("facebook"), draft("instagram")];
    sortDrafts(input);
    expect(input.map((d) => d.channel)).toEqual(["facebook", "instagram"]);
  });
});

describe("mergeDraftsByChannel (persist across regenerate)", () => {
  it("replaces the same channel and preserves the others", () => {
    const existing = [
      draft("instagram", { postId: "ig-old" }),
      draft("facebook", { postId: "fb-old" }),
    ];
    const incoming = [draft("instagram", { postId: "ig-new" })];
    const merged = mergeDraftsByChannel(existing, incoming);

    expect(merged.map((d) => d.channel)).toEqual(["instagram", "facebook"]);
    expect(merged.find((d) => d.channel === "instagram")?.postId).toBe("ig-new");
    expect(merged.find((d) => d.channel === "facebook")?.postId).toBe("fb-old");
  });

  it("adds a brand-new channel and orders the result IG → FB", () => {
    const existing = [draft("facebook", { postId: "fb-1" })];
    const incoming = [draft("instagram", { postId: "ig-1" })];
    const merged = mergeDraftsByChannel(existing, incoming);
    expect(merged.map((d) => d.channel)).toEqual(["instagram", "facebook"]);
  });

  it("hydrates from empty (first generation)", () => {
    const merged = mergeDraftsByChannel([], [draft("instagram"), draft("facebook")]);
    expect(merged.map((d) => d.channel)).toEqual(["instagram", "facebook"]);
  });

  it("does not mutate either input", () => {
    const existing = [draft("facebook", { postId: "fb-1" })];
    const incoming = [draft("facebook", { postId: "fb-2" })];
    mergeDraftsByChannel(existing, incoming);
    expect(existing[0].postId).toBe("fb-1");
    expect(incoming[0].postId).toBe("fb-2");
  });
});
