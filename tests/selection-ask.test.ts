import { describe, expect, it } from "vitest";

import {
  SELECTION_MAX_CHARS,
  bubblePosition,
  isIgnoredSelectionTarget,
  normaliseSelection,
  selectionQuestion,
  withSelection,
} from "@/lib/selection-ask";

describe("normaliseSelection", () => {
  it("collapses whitespace from a multi-line table selection", () => {
    expect(normaliseSelection("  Andrea Jumper F6\n\t100% return rate   (30 days) ")).toBe(
      "Andrea Jumper F6 100% return rate (30 days)",
    );
  });

  it("ignores stray clicks and blank selections", () => {
    expect(normaliseSelection("")).toBeNull();
    expect(normaliseSelection("   ")).toBeNull();
    expect(normaliseSelection("ab")).toBeNull();
    expect(normaliseSelection(null)).toBeNull();
    expect(normaliseSelection("abc")).toBe("abc");
  });

  it("cuts an over-long selection at the backend ceiling with an ellipsis", () => {
    const text = normaliseSelection("word ".repeat(200));
    expect(text).not.toBeNull();
    expect(text!.length).toBeLessThanOrEqual(SELECTION_MAX_CHARS);
    expect(text!.endsWith("…")).toBe(true);
  });
});

describe("selectionQuestion / withSelection", () => {
  it("reads naturally and carries the text", () => {
    expect(selectionQuestion("Andrea Jumper F6")).toBe(
      'I highlighted this on the page: "Andrea Jumper F6". What is it telling me, and what should I do about it?',
    );
  });

  it("attaches the selection to the page context and keeps null null", () => {
    expect(withSelection({ route: "/products", page: "Product Analyst" }, "x y z")).toEqual({
      route: "/products",
      page: "Product Analyst",
      selection: "x y z",
    });
    expect(withSelection(null, "x y z")).toBeNull();
  });
});

describe("isIgnoredSelectionTarget", () => {
  it("skips editable fields and the Ask Glisp panel", () => {
    expect(isIgnoredSelectionTarget("input", false, false)).toBe(true);
    expect(isIgnoredSelectionTarget("TEXTAREA", false, false)).toBe(true);
    expect(isIgnoredSelectionTarget("div", true, false)).toBe(true);
    expect(isIgnoredSelectionTarget("td", false, true)).toBe(true);
    expect(isIgnoredSelectionTarget("td", false, false)).toBe(false);
  });
});

describe("bubblePosition", () => {
  const bubble = { width: 90, height: 28 };
  const viewport = { width: 1000, height: 800 };

  it("sits centred above the selection by default", () => {
    const placed = bubblePosition({ top: 300, left: 400, width: 200, height: 20 }, bubble, viewport);
    expect(placed).toEqual({ top: 300 - 28 - 8, left: 400 + 100 - 45, side: "above" });
  });

  it("drops below when the selection is at the top of the viewport", () => {
    const placed = bubblePosition({ top: 10, left: 400, width: 200, height: 20 }, bubble, viewport);
    expect(placed.side).toBe("below");
    expect(placed.top).toBe(10 + 20 + 8);
  });

  it("clamps to the viewport gutter on both edges", () => {
    expect(bubblePosition({ top: 300, left: -50, width: 20, height: 20 }, bubble, viewport).left).toBe(8);
    expect(bubblePosition({ top: 300, left: 990, width: 20, height: 20 }, bubble, viewport).left).toBe(
      1000 - 90 - 8,
    );
  });
});
