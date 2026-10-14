import { describe, expect, it } from "vitest";

import { navItems } from "@/lib/navigation";
import {
  CHAT_DRAWER_SHORTCUT_KEY,
  DEFAULT_DRAWER_PROMPTS,
  DRAWER_PROMPTS_BY_ROUTE,
  chatWorkspaceHref,
  isChatDrawerShortcut,
  isChatWorkspace,
  isEditableTarget,
  promptsForPath,
  shortcutLabel,
} from "@/lib/chat-drawer-prompts";

describe("promptsForPath", () => {
  it("picks the set for the route's first segment", () => {
    expect(promptsForPath("/inventory")).toBe(DRAWER_PROMPTS_BY_ROUTE.inventory);
    expect(promptsForPath("/returns")).toBe(DRAWER_PROMPTS_BY_ROUTE.returns);
  });

  it("resolves nested routes to their parent's set", () => {
    expect(promptsForPath("/inventory/transfers/review")).toBe(DRAWER_PROMPTS_BY_ROUTE.inventory);
    expect(promptsForPath("/orders/review/send/75397202150")).toBe(DRAWER_PROMPTS_BY_ROUTE.orders);
    expect(promptsForPath("/team-performance/agents/12/review")).toBe(
      DRAWER_PROMPTS_BY_ROUTE["team-performance"],
    );
  });

  it("treats the root as the dashboard", () => {
    expect(promptsForPath("/")).toBe(DRAWER_PROMPTS_BY_ROUTE.dashboard);
  });

  it("falls back to the /chat starters where the analyst has no tool", () => {
    for (const path of ["/social", "/ads", "/results", "/ai", "/system", "/integrations", "/settings", "/docs"]) {
      expect(promptsForPath(path), path).toBe(DEFAULT_DRAWER_PROMPTS);
    }
    expect(promptsForPath("/no-such-route")).toBe(DEFAULT_DRAWER_PROMPTS);
  });

  it("only keys routes that exist in the sidebar", () => {
    const segments = new Set(navItems.map((item) => item.href.split("/")[1]));
    for (const key of Object.keys(DRAWER_PROMPTS_BY_ROUTE)) {
      expect(segments.has(key), `${key} is not a sidebar route`).toBe(true);
    }
  });
});

describe("prompt sets", () => {
  const sets = [DEFAULT_DRAWER_PROMPTS, ...Object.values(DRAWER_PROMPTS_BY_ROUTE)];

  it("offer exactly four prompts each", () => {
    for (const set of sets) expect(set).toHaveLength(4);
  });

  it("never repeat a label or an id within a set", () => {
    for (const set of sets) {
      expect(new Set(set.map((prompt) => prompt.label)).size).toBe(set.length);
      expect(new Set(set.map((prompt) => prompt.id)).size).toBe(set.length);
    }
  });

  it("phrase every prompt as a question or a request the analyst can act on", () => {
    for (const set of sets) {
      for (const prompt of set) {
        expect(prompt.label.length, prompt.label).toBeGreaterThan(12);
        expect(prompt.label.length, prompt.label).toBeLessThanOrEqual(60);
      }
    }
  });
});

describe("isChatWorkspace", () => {
  it("is true on /chat and any sub-route only", () => {
    expect(isChatWorkspace("/chat")).toBe(true);
    expect(isChatWorkspace("/chat/anything")).toBe(true);
    expect(isChatWorkspace("/chatter")).toBe(false);
    expect(isChatWorkspace("/dashboard")).toBe(false);
    // SPEC-293: an employee's chat tab is a workspace too — the pill would sit on
    // its send button; every other Spotlight tab keeps the launcher.
    expect(isChatWorkspace("/spotlight", "chat")).toBe(true);
    expect(isChatWorkspace("/spotlight", "inbound")).toBe(false);
    expect(isChatWorkspace("/spotlight", null)).toBe(false);
    expect(isChatWorkspace("/spotlight/draft/x", "chat")).toBe(false);
  });
});

describe("chatWorkspaceHref", () => {
  it("selects the thread when there is one", () => {
    expect(chatWorkspaceHref("abc-123")).toBe("/chat?c=abc-123");
  });

  it("encodes ids that need it", () => {
    expect(chatWorkspaceHref("a b&c")).toBe("/chat?c=a%20b%26c");
  });

  it("is the bare workspace for an empty thread", () => {
    expect(chatWorkspaceHref(null)).toBe("/chat");
  });
});

describe("isChatDrawerShortcut", () => {
  const base = { key: CHAT_DRAWER_SHORTCUT_KEY, metaKey: false, ctrlKey: false, altKey: false, shiftKey: false };

  it("matches ⌘J and Ctrl+J, either case", () => {
    expect(isChatDrawerShortcut({ ...base, metaKey: true })).toBe(true);
    expect(isChatDrawerShortcut({ ...base, ctrlKey: true })).toBe(true);
    expect(isChatDrawerShortcut({ ...base, key: "J", metaKey: true })).toBe(true);
  });

  it("ignores the bare key and other modifier combinations", () => {
    expect(isChatDrawerShortcut(base)).toBe(false);
    expect(isChatDrawerShortcut({ ...base, metaKey: true, shiftKey: true })).toBe(false);
    expect(isChatDrawerShortcut({ ...base, metaKey: true, altKey: true })).toBe(false);
    expect(isChatDrawerShortcut({ ...base, key: "b", metaKey: true })).toBe(false);
  });
});

describe("isEditableTarget", () => {
  it("is true for form fields and contenteditable, false for everything else", () => {
    expect(isEditableTarget("INPUT", false)).toBe(true);
    expect(isEditableTarget("textarea", false)).toBe(true);
    expect(isEditableTarget("SELECT", false)).toBe(true);
    expect(isEditableTarget("DIV", true)).toBe(true);
    expect(isEditableTarget("DIV", false)).toBe(false);
    expect(isEditableTarget("BUTTON", false)).toBe(false);
  });
});

describe("shortcutLabel", () => {
  it("shows the command glyph on Apple platforms and Ctrl elsewhere", () => {
    expect(shortcutLabel("Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)")).toBe("⌘J");
    expect(shortcutLabel("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)")).toBe("⌘J");
    expect(shortcutLabel("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")).toBe("Ctrl+J");
    expect(shortcutLabel("Mozilla/5.0 (X11; Linux x86_64)")).toBe("Ctrl+J");
    expect(shortcutLabel("")).toBe("Ctrl+J");
  });
});
