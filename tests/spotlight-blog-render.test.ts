import { describe, expect, it } from "vitest";

import {
  firstParagraphLineNumber,
  headingIdsByLine,
  isExternalHref,
  uniqueHeadingId,
} from "@/lib/spotlight";

// Pure, node-safe: the deterministic blog-render helpers (SPEC-126) that replace
// the render-time mutable counters that caused the hydration mismatch. Keyed off
// 1-based source line numbers, which are stable across SSR + client.

describe("headingIdsByLine", () => {
  it("maps each ## H2 to its 1-based source line and its anchor id", () => {
    const body = [
      "Intro paragraph.", // line 1
      "", // 2
      "## What makes a belt modest", // 3
      "", // 4
      "Body.", // 5
      "", // 6
      "## Care", // 7
    ].join("\n");

    const map = headingIdsByLine(body);
    expect(map.get(3)).toBe("what-makes-a-belt-modest");
    expect(map.get(7)).toBe("care");
    // Non-heading lines are absent.
    expect(map.get(1)).toBeUndefined();
    expect(map.size).toBe(2);
  });

  it("dedups repeated headings -1/-2 exactly like uniqueHeadingId", () => {
    const body = ["## Fit", "", "## Fit", "", "## Fit", "", "## Care"].join("\n");
    const map = headingIdsByLine(body);
    expect(map.get(1)).toBe("fit");
    expect(map.get(3)).toBe("fit-1");
    expect(map.get(5)).toBe("fit-2");
    expect(map.get(7)).toBe("care");

    // Same sequence produced by uniqueHeadingId (the backend toc de-dup mirror).
    const counts = new Map<string, number>();
    expect(uniqueHeadingId("Fit", counts)).toBe("fit");
    expect(uniqueHeadingId("Fit", counts)).toBe("fit-1");
    expect(uniqueHeadingId("Fit", counts)).toBe("fit-2");
  });

  it("ignores H1/H3 and indented text — only ## headings", () => {
    const body = ["# Title", "### Sub", "## Real", "Not ## a heading"].join("\n");
    const map = headingIdsByLine(body);
    expect([...map.keys()]).toEqual([3]);
    expect(map.get(3)).toBe("real");
  });

  it("returns an empty map for a body with no H2 headings", () => {
    expect(headingIdsByLine("Just prose.\n\nMore prose.").size).toBe(0);
  });
});

describe("firstParagraphLineNumber", () => {
  it("returns the first non-blank paragraph line", () => {
    expect(firstParagraphLineNumber("First para.\n\nSecond.")).toBe(1);
    expect(firstParagraphLineNumber("\n\n   \nHello there.")).toBe(4);
  });

  it("skips a leading heading and lands on the first real paragraph", () => {
    const body = ["## Heading", "", "The body starts here.", ""].join("\n");
    expect(firstParagraphLineNumber(body)).toBe(3);
  });

  it("skips list items, blockquotes, hr, code fences, and table rows", () => {
    expect(firstParagraphLineNumber("- item\n* item\n+ item\nParagraph.")).toBe(4);
    expect(firstParagraphLineNumber("1. one\n2) two\nParagraph.")).toBe(3);
    expect(firstParagraphLineNumber("> quote\nParagraph.")).toBe(2);
    expect(firstParagraphLineNumber("---\nParagraph.")).toBe(2);
    expect(firstParagraphLineNumber("```\ncode\n```\nParagraph.")).toBe(4);
    expect(firstParagraphLineNumber("| a | b |\n| - | - |\nParagraph.")).toBe(3);
  });

  it("returns null when there is no paragraph line", () => {
    expect(firstParagraphLineNumber("")).toBeNull();
    expect(firstParagraphLineNumber("## Only\n\n### Headings")).toBeNull();
    expect(firstParagraphLineNumber("- only\n- lists")).toBeNull();
  });
});

describe("isExternalHref", () => {
  it("is true for absolute http(s) URLs", () => {
    expect(isExternalHref("https://example.com")).toBe(true);
    expect(isExternalHref("http://example.com/path?q=1")).toBe(true);
    expect(isExternalHref("HTTPS://EXAMPLE.COM")).toBe(true);
    expect(isExternalHref("  https://example.com  ")).toBe(true);
  });

  it("is false for relative, internal, anchor, other-scheme, and empty hrefs", () => {
    expect(isExternalHref("/products/modest-belt")).toBe(false);
    expect(isExternalHref("./relative")).toBe(false);
    expect(isExternalHref("#section")).toBe(false);
    expect(isExternalHref("mailto:hi@example.com")).toBe(false);
    expect(isExternalHref("")).toBe(false);
    // Defensive: helper tolerates a nullish value coerced by the caller.
    expect(isExternalHref(undefined as unknown as string)).toBe(false);
  });
});
