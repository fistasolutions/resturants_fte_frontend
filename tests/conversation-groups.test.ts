/** SPEC-032 — day-grouping for the chat history rail. */
import { describe, expect, it } from "vitest";

import { groupConversationsByDay } from "@/lib/conversation-groups";
import type { ChatConversation } from "@/types/chat";

const NOW = new Date("2026-07-20T15:00:00Z");

function conversation(id: string, updatedAt: string): ChatConversation {
  return { id, title: `Chat ${id}`, createdAt: updatedAt, updatedAt, messages: [] };
}

describe("groupConversationsByDay", () => {
  it("labels today's and yesterday's conversations", () => {
    const groups = groupConversationsByDay(
      [
        conversation("a", "2026-07-20T09:00:00Z"),
        conversation("b", "2026-07-20T01:00:00Z"),
        conversation("c", "2026-07-19T23:59:00Z"),
      ],
      NOW,
    );
    expect(groups.map((group) => group.label)).toEqual(["Today", "Yesterday"]);
    expect(groups[0].conversations.map((item) => item.id)).toEqual(["a", "b"]);
    expect(groups[1].conversations.map((item) => item.id)).toEqual(["c"]);
  });

  it("labels older conversations with their formatted date", () => {
    const groups = groupConversationsByDay(
      [conversation("d", "2026-07-16T12:00:00Z")],
      NOW,
    );
    expect(groups).toHaveLength(1);
    expect(groups[0].label).toBe("Jul 16, 2026");
  });

  it("keeps input order and one group per consecutive day", () => {
    const groups = groupConversationsByDay(
      [
        conversation("a", "2026-07-20T10:00:00Z"),
        conversation("b", "2026-07-18T10:00:00Z"),
        conversation("c", "2026-07-18T08:00:00Z"),
        conversation("d", "2026-07-16T10:00:00Z"),
      ],
      NOW,
    );
    expect(groups.map((group) => group.label)).toEqual([
      "Today",
      "Jul 18, 2026",
      "Jul 16, 2026",
    ]);
    expect(groups[1].conversations.map((item) => item.id)).toEqual(["b", "c"]);
  });

  it("uses UTC day boundaries", () => {
    // 2026-07-19T23:30Z is 'yesterday' in UTC even though many local zones
    // would already call it today.
    const groups = groupConversationsByDay(
      [conversation("e", "2026-07-19T23:30:00Z")],
      new Date("2026-07-20T00:30:00Z"),
    );
    expect(groups[0].label).toBe("Yesterday");
  });

  it("puts malformed timestamps into 'Earlier'", () => {
    const groups = groupConversationsByDay(
      [conversation("f", "not-a-date")],
      NOW,
    );
    expect(groups[0].label).toBe("Earlier");
  });

  it("returns an empty list for no conversations", () => {
    expect(groupConversationsByDay([], NOW)).toEqual([]);
  });
});
