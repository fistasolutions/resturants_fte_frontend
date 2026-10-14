import { describe, expect, it } from "vitest";

import { isInAppHref, looksNumeric, normalizeAnswerMarkdown } from "@/lib/answer-markdown";

// The Accounts Payable answer the owner sent on 2026-10-08: records written as bullets.
const PIPE_BULLETS = [
  "Here is the payment run through Sunday:",
  "",
  "- **The Nina Collection - Israel** | Bill #26000 (Amici Casual Wear NY) | Due 2025-02-23 | Balance: $5,505.00 *(Partial)*",
  "- **Linen House LLC** | Bill #26011 (Linen House) | Due 2025-03-01 | Balance: $1,200.50",
  "- **Button Works** | Bill #26044 (Button Works) | Due 2025-03-04 | Balance: $880.00",
  "",
  "Pay these first.",
].join("\n");

describe("normalizeAnswerMarkdown (SPEC-352)", () => {
  it("turns a pipe-bulleted list into a table with inferred headers", () => {
    const out = normalizeAnswerMarkdown(PIPE_BULLETS);
    const lines = out.split("\n");
    expect(lines).toContain("|  | Bill | Due | Balance |");
    expect(lines).toContain("| --- | --- | --- | --- |");
    expect(lines).toContain(
      "| **The Nina Collection - Israel** | #26000 (Amici Casual Wear NY) | 2025-02-23 | $5,505.00 *(Partial)* |",
    );
    expect(out.startsWith("Here is the payment run through Sunday:\n\n|")).toBe(true);
    expect(out.endsWith("|\n\nPay these first.")).toBe(true);
  });

  it("keeps a numbered order as a # column", () => {
    const out = normalizeAnswerMarkdown(
      ["1. Amici | North Co | $5,505.00", "2. Linen House | South Co | $1,200.50"].join("\n"),
    );
    expect(out.split("\n")[0]).toBe("| # |  |  |  |");
    expect(out).toContain("| 1 | Amici | North Co | $5,505.00 |");
  });

  it("pads a short row rather than dropping the run", () => {
    const out = normalizeAnswerMarkdown(["- a | b | c | d", "- e | f | g"].join("\n"));
    expect(out).toContain("| e | f | g |  |");
  });

  it("leaves ordinary bullets, real tables and code fences alone", () => {
    const bullets = "- Revenue is up\n- Orders are flat";
    expect(normalizeAnswerMarkdown(bullets)).toBe(bullets);
    const table = "| A | B |\n| --- | --- |\n| 1 | 2 |";
    expect(normalizeAnswerMarkdown(table)).toBe(table);
    const fence = "```\n- a | b | c\n- d | e | f\n```";
    expect(normalizeAnswerMarkdown(fence)).toBe(fence);
    const single = "- only | one | row";
    expect(normalizeAnswerMarkdown(single)).toBe(single);
    const twoCells = "- a | b\n- c | d";
    expect(normalizeAnswerMarkdown(twoCells)).toBe(twoCells);
  });

  it("never names a column after a common first word of a name", () => {
    const out = normalizeAnswerMarkdown(
      ["- The Nina Collection | Due 2025-02-23 | $10.00", "- The Linen House | Due 2025-03-01 | $20.00"].join("\n"),
    );
    expect(out.split("\n")[0]).toBe("|  | Due |  |");
  });
});

describe("looksNumeric", () => {
  it("knows a figure", () => {
    for (const text of ["$5,505.00", "1,200", "12.5%", "-3", "(4.20)", "€9", "**$880.00**", "3.2k"]) {
      expect(looksNumeric(text)).toBe(true);
    }
  });

  it("knows a word", () => {
    for (const text of ["Amici", "2025-02-23", "Bill #26000", "", "N/A", "Due soon"]) {
      expect(looksNumeric(text)).toBe(false);
    }
  });
});

describe("isInAppHref", () => {
  it("accepts a relative path only", () => {
    expect(isInAppHref("/employees/finance?tab=run")).toBe(true);
    expect(isInAppHref("//evil.com")).toBe(false);
    expect(isInAppHref("/\\evil.com")).toBe(false);
    expect(isInAppHref("https://example.com")).toBe(false);
    expect(isInAppHref(undefined)).toBe(false);
  });
});
