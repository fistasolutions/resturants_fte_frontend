/** SPEC-105 — client-side catalog pagination helpers. */

import { describe, expect, it } from "vitest";

import {
  CATALOG_PAGE_SIZE,
  clampPage,
  pageCount,
  paginate,
} from "@/lib/catalog-pagination";

const rows = Array.from({ length: 23 }, (_, i) => i + 1);

describe("pageCount", () => {
  it("rounds up to whole pages", () => {
    expect(pageCount(23)).toBe(3); // 10 + 10 + 3
    expect(pageCount(20)).toBe(2);
    expect(pageCount(10)).toBe(1);
  });

  it("never drops below 1, even for an empty catalog", () => {
    expect(pageCount(0)).toBe(1);
  });

  it("honours a custom page size", () => {
    expect(pageCount(23, 5)).toBe(5);
  });
});

describe("paginate", () => {
  it("returns the right slice per page (default size 10)", () => {
    expect(paginate(rows, 1)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(paginate(rows, 2)).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
    expect(paginate(rows, 3)).toEqual([21, 22, 23]); // last, partial page
  });

  it("returns an empty slice for out-of-range pages", () => {
    expect(paginate(rows, 4)).toEqual([]);
  });
});

describe("clampPage", () => {
  it("clamps into [1, pageCount]", () => {
    expect(clampPage(0, 23)).toBe(1);
    expect(clampPage(99, 23)).toBe(3);
    expect(clampPage(2, 23)).toBe(2);
  });
});

describe("CATALOG_PAGE_SIZE", () => {
  it("is a small visible page (the client only generates verdicts for this many)", () => {
    expect(CATALOG_PAGE_SIZE).toBeLessThanOrEqual(24);
  });
});
