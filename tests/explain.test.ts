import { describe, expect, it } from "vitest";

import {
  FOCUS_MAX_CHARS,
  deltaPhrase,
  draftContextFor,
  explainFocus,
  explainQuestion,
  readingOf,
  withFocus,
} from "@/lib/explain";
import type { ChatPageContext } from "@/types/chat";

describe("deltaPhrase", () => {
  it("signs a rise and uses a true minus for a fall", () => {
    expect(deltaPhrase(8)).toBe("+8%");
    expect(deltaPhrase(-3.25)).toBe("−3.3%");
    expect(deltaPhrase(0)).toBe("0%");
  });

  it("is empty when the card shows no delta", () => {
    expect(deltaPhrase(null)).toBe("");
    expect(deltaPhrase(undefined)).toBe("");
    expect(deltaPhrase(Number.NaN)).toBe("");
  });
});

describe("readingOf", () => {
  it("reads value, delta and caption the way the card prints them", () => {
    expect(
      readingOf({ metric: "Revenue", value: "$12,345", delta: 8, detail: "vs previous period" }),
    ).toBe("$12,345, +8% vs previous period");
  });

  it("parenthesises a caption when there is no delta", () => {
    expect(readingOf({ metric: "Avg discount", value: "$4.10", detail: "per discounted order" })).toBe(
      "$4.10 (per discounted order)",
    );
  });

  it("collapses whitespace and never reads an empty value", () => {
    expect(readingOf({ metric: "x", value: "  ", detail: "  a   b " })).toBe("— (a b)");
  });
});

describe("explainQuestion", () => {
  it("is a natural question that carries the figure", () => {
    expect(
      explainQuestion({ metric: "Revenue", value: "$12,345", delta: 8, detail: "vs previous period" }),
    ).toBe(
      'Explain the "Revenue" figure on this page — it reads $12,345, +8% vs previous period. What is behind it, and what should I do about it?',
    );
  });

  it("works for a verdict with no delta", () => {
    expect(explainQuestion({ metric: "Catalogue health", value: "Healthy" })).toBe(
      'Explain the "Catalogue health" figure on this page — it reads Healthy. What is behind it, and what should I do about it?',
    );
  });
});

describe("explainFocus", () => {
  it("is the card as printed", () => {
    expect(explainFocus({ metric: "Orders", value: "1,204", delta: -2.5, detail: "vs last week" })).toBe(
      "Orders — 1,204, −2.5% vs last week",
    );
  });

  it("never exceeds the backend ceiling and stays one line", () => {
    const focus = explainFocus({
      metric: "M".repeat(150),
      value: "V".repeat(100),
      detail: "line one\nline two",
    });
    expect(focus.length).toBeLessThanOrEqual(FOCUS_MAX_CHARS);
    expect(focus.endsWith("…")).toBe(true);
    expect(focus).not.toContain("\n");
  });
});

describe("withFocus", () => {
  const context: ChatPageContext = { route: "/dashboard", page: "Dashboard" };

  it("attaches the focus without touching the rest of the context", () => {
    expect(withFocus(context, { metric: "Revenue", value: "$1" })).toEqual({
      route: "/dashboard",
      page: "Dashboard",
      focus: "Revenue — $1",
    });
    expect(context).toEqual({ route: "/dashboard", page: "Dashboard" });
  });

  it("keeps a missing context missing", () => {
    expect(withFocus(null, { metric: "Revenue", value: "$1" })).toBeNull();
  });
});

describe("draftContextFor", () => {
  const page = { page: "dashboard", route: "/dashboard" } as Parameters<typeof draftContextFor>[2];
  const drafted = { ...page, focus: "Yesterday: $294,715.47" } as NonNullable<typeof page>;
  it("carries the card's focus while the text is still the drafted question", () => {
    const draft = { question: "Explain the \"Yesterday\" figure on this page.", context: drafted };
    expect(draftContextFor(draft, draft.question, page)).toBe(drafted);
    expect(draftContextFor(draft, `  ${draft.question} `, page)).toBe(drafted);
  });
  it("falls back to the page context once the owner has written something else, or with no draft", () => {
    const draft = { question: "Explain the \"Yesterday\" figure on this page.", context: drafted };
    expect(draftContextFor(draft, "Why is it down?", page)).toBe(page);
    expect(draftContextFor(null, draft.question, page)).toBe(page);
  });
});
