import { describe, expect, it } from "vitest";

import {
  closeDanglingTokens,
  splitStreamingMarkdown,
} from "@/lib/markdown-stream";

describe("splitStreamingMarkdown", () => {
  it("keeps everything in the tail before the first blank line", () => {
    expect(splitStreamingMarkdown("Revenue is **up")).toEqual({
      stableBlocks: [],
      tail: "Revenue is **up",
    });
  });

  it("moves completed blocks to stable and keeps the growing tail", () => {
    const { stableBlocks, tail } = splitStreamingMarkdown(
      "First paragraph.\n\n- a bullet\n- another\n\nStill typi",
    );
    expect(stableBlocks).toEqual(["First paragraph.", "- a bullet\n- another"]);
    expect(tail).toBe("Still typi");
  });

  it("keeps a growing table intact in the tail (no blank line yet)", () => {
    const markdown = "Intro done.\n\n| # | Product |\n| --- | --- |\n| 1 | Hoo";
    const { stableBlocks, tail } = splitStreamingMarkdown(markdown);
    expect(stableBlocks).toEqual(["Intro done."]);
    expect(tail).toBe("| # | Product |\n| --- | --- |\n| 1 | Hoo");
  });

  it("never splits inside an open code fence", () => {
    const markdown = "Look:\n\n```sql\nSELECT 1;\n\nSELECT 2;\n\nstill code";
    const { stableBlocks, tail } = splitStreamingMarkdown(markdown);
    expect(stableBlocks).toEqual(["Look:"]);
    expect(tail).toBe("```sql\nSELECT 1;\n\nSELECT 2;\n\nstill code");
  });

  it("stabilizes a fence once it closes", () => {
    const markdown = "```\ncode\n```\n\nAfter fence";
    const { stableBlocks, tail } = splitStreamingMarkdown(markdown);
    expect(stableBlocks).toEqual(["```\ncode\n```"]);
    expect(tail).toBe("After fence");
  });

  it("drops whitespace-only blocks and handles empty input", () => {
    expect(splitStreamingMarkdown("")).toEqual({ stableBlocks: [], tail: "" });
    expect(splitStreamingMarkdown("a\n\n \n\nb").stableBlocks).toEqual(["a"]);
  });
});

describe("closeDanglingTokens", () => {
  it("closes an unbalanced bold marker", () => {
    expect(closeDanglingTokens("Revenue is **up 12")).toBe(
      "Revenue is **up 12**",
    );
  });

  it("leaves balanced bold alone", () => {
    expect(closeDanglingTokens("**up 12%** now")).toBe("**up 12%** now");
  });

  it("closes an unbalanced inline code span", () => {
    expect(closeDanglingTokens("run `npm bui")).toBe("run `npm bui`");
  });

  it("closes an unbalanced strikethrough", () => {
    expect(closeDanglingTokens("was ~~$50")).toBe("was ~~$50~~");
  });

  it("closes an open code fence and skips inline handling inside it", () => {
    expect(closeDanglingTokens("```sql\nSELECT `x")).toBe(
      "```sql\nSELECT `x\n```",
    );
  });

  it("does not touch single asterisk list markers", () => {
    expect(closeDanglingTokens("* item one")).toBe("* item one");
  });

  it("does not touch snake_case identifiers", () => {
    expect(closeDanglingTokens("column store_id and order_")).toBe(
      "column store_id and order_",
    );
  });

  it("handles multiple dangling tokens together", () => {
    expect(closeDanglingTokens("**bold and `code")).toBe(
      "**bold and `code`**",
    );
  });
});

describe("completeStreamingTable (SPEC-355)", () => {
  it("gives a header in flight its delimiter row", async () => {
    const { completeStreamingTable } = await import("@/lib/markdown-stream");
    expect(completeStreamingTable("Here:\n| Company | Past Due |")).toBe(
      "Here:\n| Company | Past Due |\n| --- | --- |",
    );
  });

  it("completes a partial delimiter and leaves a whole one alone", async () => {
    const { completeStreamingTable } = await import("@/lib/markdown-stream");
    expect(completeStreamingTable("| A | B | C |\n| --- | -")).toBe("| A | B | C |\n| --- | --- | --- |");
    const whole = "| A | B |\n| --- | --- |\n| 1 | 2";
    expect(completeStreamingTable(whole)).toBe(whole);
  });

  it("leaves text that is not a trailing table untouched", async () => {
    const { completeStreamingTable } = await import("@/lib/markdown-stream");
    expect(completeStreamingTable("Revenue is up")).toBe("Revenue is up");
    expect(completeStreamingTable("")).toBe("");
  });

  it("is applied by closeDanglingTokens", async () => {
    const { closeDanglingTokens } = await import("@/lib/markdown-stream");
    expect(closeDanglingTokens("| **Amici | $1")).toBe("| **Amici | $1**\n| --- | --- |");
  });
});
