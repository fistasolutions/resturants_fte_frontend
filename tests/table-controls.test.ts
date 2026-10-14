/** SPEC-258 — in-place search, facet and pages for a loaded analysis table. */

import { describe, expect, it } from "vitest";

import {
  applyControls,
  DEFAULT_TABLE_CONTROLS,
  facetOptions,
  isDefaultControls,
  matchesQuery,
  pageRange,
  pageWindow,
  TABLE_PAGE_SIZE,
  type TableSpec,
} from "@/lib/table-controls";

interface Row {
  id: number;
  title: string;
  category: string;
  verdict: string;
}

const spec: TableSpec<Row> = {
  search: (r) => [r.title, r.category],
  facet: (r) => r.verdict,
};

/** 40 rows: 30 losing, 7 healthy, 3 without cost data; every fifth is a skirt. */
const rows: Row[] = Array.from({ length: 40 }, (_, i) => ({
  id: i + 1,
  title: i % 5 === 0 ? `Paneled skirt ${i + 1}` : `Embroider top ${i + 1}`,
  category: i % 5 === 0 ? "Skirts" : "Tops",
  verdict: i < 30 ? "Losing money" : i < 37 ? "Healthy" : "No cost data",
}));

describe("matchesQuery", () => {
  it("matches every token against any field, case-insensitively", () => {
    expect(matchesQuery(["Paneled skirt", "Skirts"], "SKIRT")).toBe(true);
    expect(matchesQuery(["Paneled skirt", "Skirts"], "paneled skirts")).toBe(true);
    expect(matchesQuery(["Paneled skirt", "Skirts"], "paneled top")).toBe(false);
  });

  it("treats blank as match-all", () => {
    expect(matchesQuery(["x"], "")).toBe(true);
    expect(matchesQuery(["x"], "   ")).toBe(true);
  });
});

describe("facetOptions", () => {
  it("counts each label, most common first, ties by label", () => {
    expect(facetOptions(rows, spec.facet)).toEqual([
      { label: "Losing money", count: 30 },
      { label: "Healthy", count: 7 },
      { label: "No cost data", count: 3 },
    ]);
    const tied = [{ verdict: "b" }, { verdict: "a" }];
    expect(facetOptions(tied, (r) => r.verdict).map((f) => f.label)).toEqual(["a", "b"]);
  });

  it("is empty for no rows", () => {
    expect(facetOptions([], spec.facet)).toEqual([]);
  });
});

describe("applyControls", () => {
  it("pages the whole set when nothing is active", () => {
    const slice = applyControls(rows, DEFAULT_TABLE_CONTROLS, spec);
    expect(slice.total).toBe(40);
    expect(slice.matches).toBe(40);
    expect(slice.pages).toBe(3);
    expect(slice.page).toBe(1);
    expect(slice.rows).toHaveLength(TABLE_PAGE_SIZE);
    expect(slice.rows[0].id).toBe(1);
  });

  it("returns the requested page", () => {
    const slice = applyControls(rows, { ...DEFAULT_TABLE_CONTROLS, page: 3 }, spec);
    expect(slice.rows.map((r) => r.id)).toEqual(Array.from({ length: 10 }, (_, i) => 31 + i));
  });

  it("filters by facet", () => {
    const slice = applyControls(rows, { ...DEFAULT_TABLE_CONTROLS, facet: "Healthy" }, spec);
    expect(slice.matches).toBe(7);
    expect(slice.pages).toBe(1);
    expect(slice.rows.every((r) => r.verdict === "Healthy")).toBe(true);
  });

  it("filters by query across fields and combines with the facet", () => {
    const byQuery = applyControls(rows, { ...DEFAULT_TABLE_CONTROLS, query: "skirt" }, spec);
    expect(byQuery.matches).toBe(8);
    const both = applyControls(rows, { query: "skirts", facet: "Losing money", page: 1 }, spec);
    expect(both.matches).toBe(6);
    expect(both.rows.every((r) => r.category === "Skirts" && r.verdict === "Losing money")).toBe(true);
  });

  it("clamps a page that no longer exists after the set shrinks", () => {
    const slice = applyControls(rows, { query: "skirt", facet: null, page: 3 }, spec);
    expect(slice.page).toBe(1);
    expect(slice.rows).toHaveLength(8);
  });

  it("reports an empty result without throwing", () => {
    const slice = applyControls(rows, { ...DEFAULT_TABLE_CONTROLS, query: "nothing here" }, spec);
    expect(slice.matches).toBe(0);
    expect(slice.rows).toEqual([]);
    expect(slice.pages).toBe(1);
    expect(pageRange(slice)).toEqual([0, 0]);
  });

  it("honours a custom page size", () => {
    const slice = applyControls(rows, DEFAULT_TABLE_CONTROLS, { ...spec, pageSize: 10 });
    expect(slice.pages).toBe(4);
    expect(slice.rows).toHaveLength(10);
  });
});

describe("pageRange", () => {
  it("gives the 1-based bounds of the visible slice", () => {
    expect(pageRange({ page: 2, pageSize: 15, matches: 40 })).toEqual([16, 30]);
    expect(pageRange({ page: 3, pageSize: 15, matches: 40 })).toEqual([31, 40]);
  });
});

describe("pageWindow", () => {
  it("shows every page up to seven", () => {
    expect(pageWindow(1, 1)).toEqual([1]);
    expect(pageWindow(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("windows around the current page with gaps past seven", () => {
    expect(pageWindow(7, 14)).toEqual([1, "…", 6, 7, 8, "…", 14]);
    expect(pageWindow(1, 14)).toEqual([1, 2, 3, 4, "…", 14]);
    expect(pageWindow(14, 14)).toEqual([1, "…", 11, 12, 13, 14]);
    expect(pageWindow(2, 14)).toEqual([1, 2, 3, 4, "…", 14]);
  });

  it("never emits a gap for a single skipped page", () => {
    // 1 2 3 4 5 … 14 would hide nothing between 4 and 5; the window is contiguous.
    expect(pageWindow(4, 14)).toEqual([1, 2, 3, 4, 5, "…", 14]);
  });
});

describe("isDefaultControls", () => {
  it("is true only with no query and no facet, whatever the page", () => {
    expect(isDefaultControls(DEFAULT_TABLE_CONTROLS)).toBe(true);
    expect(isDefaultControls({ query: " ", facet: null, page: 4 })).toBe(true);
    expect(isDefaultControls({ query: "a", facet: null, page: 1 })).toBe(false);
    expect(isDefaultControls({ query: "", facet: "x", page: 1 })).toBe(false);
  });
});
