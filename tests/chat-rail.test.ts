import { describe, expect, it } from "vitest";

import {
  PROJECT_NAME_MAX,
  answerExcerpt,
  buildRail,
  cleanProjectName,
  pinnedAnswers,
  projectNameFor,
  railTitle,
} from "@/lib/chat-rail";
import type { ChatConversation, ChatProject } from "@/types/chat";

const NOW = new Date("2026-09-16T10:00:00.000Z");

function conv(id: string, extra: Partial<ChatConversation> = {}): ChatConversation {
  return {
    id,
    title: id,
    createdAt: "2026-09-16T09:00:00.000Z",
    updatedAt: "2026-09-16T09:00:00.000Z",
    messages: [],
    ...extra,
  };
}

const supplier: ChatProject = {
  id: "p-supplier",
  name: "Supplier X",
  createdAt: "2026-09-15T00:00:00Z",
  updatedAt: "2026-09-15T00:00:00Z",
  conversationCount: 2,
  color: "violet",
  icon: "truck",
};
const season: ChatProject = { ...supplier, id: "p-season", name: "Autumn", conversationCount: 0 };

describe("buildRail", () => {
  it("files chats into their projects, pins across sections, and leaves the rest by day", () => {
    const rail = buildRail(
      [
        conv("a", { projectId: "p-supplier" }),
        conv("b", { pinnedAt: "2026-09-16T08:00:00Z" }),
        conv("c", { projectId: "p-supplier", pinnedAt: "2026-09-16T09:30:00Z" }),
        conv("d"),
        conv("e", { projectId: "gone-project" }),
      ],
      [supplier, season],
      NOW,
    );
    expect(rail.projects.map((s) => [s.project.name, s.conversations.map((c) => c.id)])).toEqual([
      ["Supplier X", ["a", "c"]],
      ["Autumn", []],
    ]);
    // Newest-pinned first, filed or not.
    expect(rail.pinned.map((c) => c.id)).toEqual(["c", "b"]);
    // A chat whose project no longer exists is an ordinary chat again.
    expect(rail.recent.flatMap((g) => g.conversations.map((c) => c.id))).toEqual(["d", "e"]);
    expect(rail.recentCount).toBe(2);
    expect(rail.recent[0].label).toBe("Today");
  });

  it("is all empty on a fresh account", () => {
    expect(buildRail([], [], NOW)).toEqual({ projects: [], pinned: [], recent: [], recentCount: 0 });
  });
});

describe("cleanProjectName", () => {
  it("trims, collapses and bounds", () => {
    expect(cleanProjectName("  Supplier   X ")).toBe("Supplier X");
    expect(cleanProjectName("   ")).toBeNull();
    expect(cleanProjectName("x".repeat(PROJECT_NAME_MAX))).toHaveLength(PROJECT_NAME_MAX);
    expect(cleanProjectName("x".repeat(PROJECT_NAME_MAX + 1))).toBeNull();
  });
});

describe("pinnedAnswers / answerExcerpt", () => {
  it("returns only pinned assistant turns, in thread order", () => {
    const thread = conv("t", {
      messages: [
        { id: "1", role: "user", content: "q", createdAt: "", pinnedAt: "2026-09-16T00:00:00Z" },
        { id: "2", role: "assistant", content: "first", createdAt: "", pinnedAt: null },
        { id: "3", role: "assistant", content: "second", createdAt: "", pinnedAt: "2026-09-16T00:00:00Z" },
        { id: "4", role: "assistant", content: "third", createdAt: "", pinnedAt: "2026-09-16T00:00:01Z" },
      ],
    });
    expect(pinnedAnswers(thread).map((m) => m.id)).toEqual(["3", "4"]);
    expect(pinnedAnswers(null)).toEqual([]);
  });

  it("takes the first sentence, drops Markdown, and cuts long ones", () => {
    expect(answerExcerpt("**Revenue is up 8%.** Orders are flat.\n\n- item")).toBe("Revenue is up 8%.");
    expect(answerExcerpt("## Heading\nThe $63,415 figure is your gross revenue for today so far, which is up.")).toBe(
      "The $63,415 figure is your gross revenue for today so far, which is up.",
    );
    const long = answerExcerpt("word ".repeat(60).trim());
    expect(long.length).toBeLessThanOrEqual(121);
    expect(long.endsWith("…")).toBe(true);
    expect(answerExcerpt("| Metric | Value |\n|---|---|\n| Revenue | $1 |")).toBe("Metric Value Revenue $1");
    expect(answerExcerpt("   ")).toBe("");
  });
});

describe("projectNameFor", () => {
  it("names the project a new thread will start in", () => {
    expect(projectNameFor([supplier, season], "p-season")).toBe("Autumn");
    expect(projectNameFor([supplier], null)).toBeNull();
    expect(projectNameFor([supplier], "nope")).toBeNull();
  });
});

describe("railTitle", () => {
  it("drops the stored ellipsis so a truncating row shows one, never two", () => {
    expect(railTitle("Explain the \"Revenue\" figure on this pa…")).toBe('Explain the "Revenue" figure on this pa');
    expect(railTitle("what changed today, ...")).toBe("what changed today,");
    expect(railTitle("Best sellers")).toBe("Best sellers");
    expect(railTitle("…")).toBe("…");
  });
});
