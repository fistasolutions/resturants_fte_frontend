import { describe, expect, it } from "vitest";

import {
  SLASH_COMMANDS,
  expandSlash,
  filterSlash,
  parseSlash,
  periodPhrase,
} from "@/lib/slash-commands";

describe("parseSlash", () => {
  it("reads the command and its argument, and knows when the word is still being typed", () => {
    expect(parseSlash("/revenue 30d")).toEqual({ command: "revenue", arg: "30d", typing: false });
    expect(parseSlash("/re")).toEqual({ command: "re", arg: "", typing: true });
    expect(parseSlash("/")).toEqual({ command: "", arg: "", typing: true });
    expect(parseSlash("/product Katie Dress - Geo")).toEqual({ command: "product", arg: "Katie Dress - Geo", typing: false });
    expect(parseSlash("revenue")).toBeNull();
    expect(parseSlash("how much / revenue")).toBeNull();
  });
});

describe("filterSlash", () => {
  it("narrows by prefix in menu order and lists everything for an empty query", () => {
    expect(filterSlash("re").map((c) => c.name)).toEqual(["revenue", "returns"]);
    expect(filterSlash("").length).toBe(SLASH_COMMANDS.length);
    expect(filterSlash("zzz")).toEqual([]);
  });
});

describe("periodPhrase", () => {
  it("maps the known periods, defaults to 7d, and keeps an unknown one verbatim", () => {
    expect(periodPhrase("30d")).toBe("last 30 days");
    expect(periodPhrase("today")).toBe("today");
    expect(periodPhrase(null)).toBe("last 7 days");
    expect(periodPhrase("last quarter")).toBe("last quarter");
  });
});

describe("expandSlash", () => {
  it("expands a period shortcut into the full question", () => {
    expect(expandSlash("/revenue 30d")).toEqual({
      kind: "send",
      question: "How is revenue for the last 30 days, and how does it compare to the period before?",
    });
    expect(expandSlash("/top")).toEqual({
      kind: "send",
      question: "What were my top products by revenue in the last 7 days?",
    });
  });

  it("expands a no-argument shortcut and a named one", () => {
    expect(expandSlash("/stock")).toEqual({ kind: "send", question: "Anything low on stock I should reorder?" });
    expect(expandSlash("/product Katie Dress")).toEqual({
      kind: "send",
      question: 'How is "Katie Dress" selling — units, revenue and returns?',
    });
  });

  it("asks for a missing name, treats /help as the menu, and leaves everything else alone", () => {
    expect(expandSlash("/product").kind).toBe("needs-name");
    expect(expandSlash("/watch returns on Katie Dress pass 20%")).toEqual({
      kind: "send",
      question: "Tell me when returns on Katie Dress pass 20%",
    });
    expect(expandSlash("/help")).toEqual({ kind: "help" });
    expect(expandSlash("/unknown thing")).toEqual({ kind: "not-a-shortcut" });
    expect(expandSlash("plain question")).toEqual({ kind: "not-a-shortcut" });
  });

  it("every command has a summary and a question (except help)", () => {
    for (const command of SLASH_COMMANDS) {
      expect(command.summary.length).toBeGreaterThan(0);
      if (command.name !== "help") expect(command.question.length).toBeGreaterThan(10);
    }
  });
});
