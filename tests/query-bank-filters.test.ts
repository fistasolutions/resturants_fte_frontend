import { describe, expect, it } from "vitest";

import { filterQueries, queryFilterOptions } from "@/lib/spotlight";
import type { SpotlightQuery } from "@/types/spotlight";

/** Frontend SPEC-127 — pure filter logic for the Query bank. */

function makeQuery(overrides: Partial<SpotlightQuery>): SpotlightQuery {
  return {
    id: 1,
    keyword: "modest belts",
    monthlyVolume: null,
    persona: "The Service-Led Shopper",
    intent: "high",
    source: "derived",
    cluster: "belts",
    parentCategory: null,
    ...overrides,
  };
}

const QUERIES: SpotlightQuery[] = [
  makeQuery({ id: 1, keyword: "are belts modest enough", intent: "informational", source: "derived" }),
  makeQuery({ id: 2, keyword: "everyday modest belts", intent: "high", source: "derived" }),
  makeQuery({ id: 3, keyword: "modest belts for shabbos", intent: "seasonal", source: "search_console" }),
  makeQuery({ id: 4, keyword: "wedding guest skirt", intent: "high", source: "search_console" }),
];

describe("filterQueries", () => {
  it("passes everything through with the default (all/all/empty) filters", () => {
    expect(filterQueries(QUERIES, { search: "", intent: "all", source: "all" })).toHaveLength(4);
  });

  it("matches the keyword case-insensitively and trims the search", () => {
    const result = filterQueries(QUERIES, { search: "  SHABBOS ", intent: "all", source: "all" });
    expect(result.map((q) => q.id)).toEqual([3]);
  });

  it("filters by intent exactly, ignoring 'all'", () => {
    const result = filterQueries(QUERIES, { search: "", intent: "high", source: "all" });
    expect(result.map((q) => q.id)).toEqual([2, 4]);
  });

  it("filters by source exactly", () => {
    const result = filterQueries(QUERIES, { search: "", intent: "all", source: "search_console" });
    expect(result.map((q) => q.id)).toEqual([3, 4]);
  });

  it("ANDs multiple filters together", () => {
    const result = filterQueries(QUERIES, {
      search: "belts",
      intent: "high",
      source: "derived",
    });
    expect(result.map((q) => q.id)).toEqual([2]);
  });

  it("returns an empty array when nothing matches", () => {
    expect(
      filterQueries(QUERIES, { search: "zzz", intent: "all", source: "all" }),
    ).toEqual([]);
  });

  it("preserves input order", () => {
    const result = filterQueries(QUERIES, { search: "", intent: "all", source: "derived" });
    expect(result.map((q) => q.id)).toEqual([1, 2]);
  });
});

describe("queryFilterOptions", () => {
  it("returns distinct intents and sources in first-seen order", () => {
    expect(queryFilterOptions(QUERIES)).toEqual({
      intents: ["informational", "high", "seasonal"],
      sources: ["derived", "search_console"],
    });
  });

  it("returns empty arrays for an empty bank", () => {
    expect(queryFilterOptions([])).toEqual({ intents: [], sources: [] });
  });
});
