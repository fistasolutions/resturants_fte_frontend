import { describe, expect, it } from "vitest";

import { markdownToPlainText } from "@/lib/markdown-plain";

describe("markdownToPlainText", () => {
  it("strips headings, emphasis, code, links and list markers", () => {
    const md = [
      "### Revenue",
      "",
      "Revenue today is **$7,874.48** across *61 orders* — see [the dashboard](/dashboard).",
      "- First point",
      "2. Second `point`",
      "> quoted",
      "---",
    ].join("\n");
    expect(markdownToPlainText(md)).toBe(
      "Revenue Revenue today is $7,874.48 across 61 orders — see the dashboard. First point Second point quoted",
    );
  });

  it("reads a table as sentences and skips the separator row", () => {
    const md = ["| Metric | Value |", "|---|---:|", "| Orders | 42 |", "| AOV | $385.22 |"].join("\n");
    expect(markdownToPlainText(md)).toBe("Metric, Value. Orders, 42. AOV, $385.22.");
  });

  it("keeps fenced code as spoken lines and drops the fences", () => {
    expect(markdownToPlainText("```\nSELECT 1\n```")).toBe("SELECT 1");
  });

  it("collapses whitespace and handles empty input", () => {
    expect(markdownToPlainText("")).toBe("");
    expect(markdownToPlainText("a\n\n\n   b  ")).toBe("a b");
  });
});

describe("markdownToPlainText — inline syntax inside table cells", () => {
  it("strips bold and links inside cells too (caught live on a stock table)", () => {
    const md = ["| Size | Stock |", "|:--|:--|", "| 0 / SR810 | **6** |", "| [2](/x) | *9* |"].join("\n");
    expect(markdownToPlainText(md)).toBe("Size, Stock. 0 / SR810, 6. 2, 9.");
  });
});
