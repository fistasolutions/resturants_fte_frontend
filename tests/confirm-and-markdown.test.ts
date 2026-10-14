/**
 * SPEC-304 — the app asks in its own dialog, and renders a reply in full.
 *
 * Both halves are guarded mechanically: the wording is pure, and the element map is a
 * plain object, so a missing style fails here rather than in someone's screenshot.
 */

import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

import { describe, expect, it } from "vitest";

import { confirmCopy, quoted } from "@/lib/confirm";
import { CHAT_MARKDOWN_COMPONENTS } from "@/features/chat/chat-markdown";

describe("the words on a confirmation", () => {
  it("names what is being deleted, and what goes with it", () => {
    expect(confirmCopy("thread", "hey!")).toEqual({
      title: "Delete “hey!”?",
      body: "Its messages go with it.",
      confirmLabel: "Delete",
      destructive: true,
    });
    expect(confirmCopy("run", "Weekly payables").title).toContain("Weekly payables");
    expect(confirmCopy("source", "Size guide.pdf").body).toContain("stays");
  });

  it("counts a bulk delete, and says it in English", () => {
    expect(confirmCopy("facts", "", 1).title).toBe("Delete 1 fact?");
    expect(confirmCopy("facts", "", 12).title).toBe("Delete 12 facts?");
  });

  it("marks a reversible action as not destructive", () => {
    const pause = confirmCopy("schedules");
    expect(pause.destructive).toBe(false);
    expect(pause.confirmLabel).toBe("Pause all");
  });

  it("quotes with the owner's own punctuation", () => {
    expect(quoted("hey")).toBe("“hey”");
  });
});

describe("nothing asks through the browser any more", () => {
  it("has no window.confirm left in the app", () => {
    const hits = execSync(
      "grep -rln 'window\\.confirm(' features components app || true",
      { encoding: "utf8" },
    )
      .split("\n")
      .filter((line) => line.trim() && !line.includes("confirm-provider"));
    expect(hits).toEqual([]);
  });
});

describe("a reply renders in full", () => {
  it("styles every element a reply can contain", () => {
    for (const tag of [
      "h1", "h2", "h3", "h4", "p", "strong", "em", "a", "ul", "ol", "li",
      "blockquote", "hr", "pre", "code", "table", "thead", "tbody", "tr", "th", "td",
    ]) {
      expect(CHAT_MARKDOWN_COMPONENTS, `${tag} is unstyled`).toHaveProperty(tag);
    }
  });

  it("opens a link in a new tab, safely", () => {
    const source = readFileSync("features/chat/chat-markdown.tsx", "utf8");
    expect(source).toContain('target="_blank"');
    expect(source).toContain('rel="noreferrer"');
  });
});
