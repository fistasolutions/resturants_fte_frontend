import { describe, expect, it } from "vitest";

import {
  appendMessage,
  conversationTitleFrom,
  createConversation,
  mergeConversations,
  NEW_CHAT_TITLE,
  parseStoredConversations,
  serializeConversations,
  sortConversations,
} from "@/lib/chat-store";
import type { ChatConversation, ChatMessage } from "@/types/chat";

const NOW = "2026-05-15T10:00:00.000Z";
const LATER = "2026-05-15T10:05:00.000Z";

function userMessage(content: string, createdAt = LATER): ChatMessage {
  return { id: "m1", role: "user", content, createdAt };
}

describe("createConversation", () => {
  it("starts empty with the placeholder title", () => {
    const conversation = createConversation("c1", NOW);
    expect(conversation).toEqual({
      id: "c1",
      title: NEW_CHAT_TITLE,
      createdAt: NOW,
      updatedAt: NOW,
      messages: [],
    });
  });
});

describe("conversationTitleFrom", () => {
  it("uses the message verbatim when short", () => {
    expect(conversationTitleFrom("What were yesterday's sales?")).toBe(
      "What were yesterday's sales?",
    );
  });
  it("collapses whitespace", () => {
    expect(conversationTitleFrom("  top   products\n today ")).toBe(
      "top products today",
    );
  });
  it("ellipsizes long messages at 40 chars", () => {
    const title = conversationTitleFrom("a".repeat(80));
    expect(title.length).toBeLessThanOrEqual(40);
    expect(title.endsWith("…")).toBe(true);
  });
  it("falls back to the placeholder for empty content", () => {
    expect(conversationTitleFrom("   ")).toBe(NEW_CHAT_TITLE);
  });
});

describe("appendMessage", () => {
  it("auto-titles from the first user message and bumps updatedAt", () => {
    const conversation = createConversation("c1", NOW);
    const next = appendMessage(conversation, userMessage("Show low stock"));
    expect(next.title).toBe("Show low stock");
    expect(next.updatedAt).toBe(LATER);
    expect(next.messages).toHaveLength(1);
  });
  it("keeps the title on later user messages", () => {
    let conversation = createConversation("c1", NOW);
    conversation = appendMessage(conversation, userMessage("First question"));
    conversation = appendMessage(conversation, {
      id: "m2",
      role: "user",
      content: "Second question",
      createdAt: LATER,
    });
    expect(conversation.title).toBe("First question");
    expect(conversation.messages).toHaveLength(2);
  });
  it("does not title from assistant messages", () => {
    const conversation = createConversation("c1", NOW);
    const next = appendMessage(conversation, {
      id: "m1",
      role: "assistant",
      content: "Hello!",
      createdAt: LATER,
    });
    expect(next.title).toBe(NEW_CHAT_TITLE);
  });
  it("does not mutate the original conversation", () => {
    const conversation = createConversation("c1", NOW);
    appendMessage(conversation, userMessage("hi"));
    expect(conversation.messages).toHaveLength(0);
  });
});

describe("sortConversations", () => {
  it("orders by updatedAt, newest first", () => {
    const older: ChatConversation = {
      ...createConversation("old", NOW),
      updatedAt: NOW,
    };
    const newer: ChatConversation = {
      ...createConversation("new", NOW),
      updatedAt: LATER,
    };
    expect(sortConversations([older, newer]).map((c) => c.id)).toEqual([
      "new",
      "old",
    ]);
  });
});

describe("mergeConversations (SPEC-243)", () => {
  it("keeps a thread started before history arrived, exactly as it is", () => {
    const local = appendMessage(createConversation("local", LATER), userMessage("hi"));
    const server: ChatConversation = { ...createConversation("old", NOW), updatedAt: NOW };
    const merged = mergeConversations([local], [server]);
    expect(merged.map((c) => c.id)).toEqual(["local", "old"]);
    expect(merged[0]).toBe(local);
  });

  it("prefers the local copy when the server already has the same thread", () => {
    const local = appendMessage(createConversation("same", LATER), userMessage("hi"));
    const stale: ChatConversation = { ...createConversation("same", NOW), updatedAt: NOW };
    const merged = mergeConversations([local], [stale]);
    expect(merged).toHaveLength(1);
    expect(merged[0].messages).toHaveLength(1);
  });

  it("is plain history when nothing is on screen yet", () => {
    const a: ChatConversation = { ...createConversation("a", NOW), updatedAt: NOW };
    const b: ChatConversation = { ...createConversation("b", NOW), updatedAt: LATER };
    expect(mergeConversations(null, [a, b]).map((c) => c.id)).toEqual(["b", "a"]);
  });
});

describe("parseStoredConversations / serializeConversations", () => {
  it("round-trips a valid history", () => {
    const conversation = appendMessage(
      createConversation("c1", NOW),
      userMessage("hello"),
    );
    const parsed = parseStoredConversations(
      serializeConversations([conversation]),
    );
    expect(parsed).toEqual([conversation]);
  });
  it("returns null for missing data", () => {
    expect(parseStoredConversations(null)).toBeNull();
  });
  it("returns null for corrupt JSON", () => {
    expect(parseStoredConversations("{not json")).toBeNull();
  });
  it("returns null for foreign shapes", () => {
    expect(parseStoredConversations(JSON.stringify({ nope: true }))).toBeNull();
    expect(
      parseStoredConversations(JSON.stringify([{ id: 1, messages: "x" }])),
    ).toBeNull();
  });
});
