import { describe, expect, it } from "vitest";

import { isStoredMessageId, messagesBefore, withMessageId } from "@/lib/chat-edit";
import type { ChatMessage } from "@/types/chat";

const at = "2026-10-08T10:00:00Z";
const thread: ChatMessage[] = [
  { id: "11", role: "user", content: "First?", createdAt: at },
  { id: "12", role: "assistant", content: "One.", createdAt: at },
  { id: "13", role: "user", content: "Second?", createdAt: at },
  { id: "14", role: "assistant", content: "Two.", createdAt: at },
];

describe("chat edit (SPEC-355)", () => {
  it("knows a stored id from a local one", () => {
    expect(isStoredMessageId("13")).toBe(true);
    expect(isStoredMessageId("local-3b2f")).toBe(false);
    expect(isStoredMessageId("6a1e4c1e-1f0a-4c3b-9d8e-0a1b2c3d4e5f")).toBe(false);
    expect(isStoredMessageId("")).toBe(false);
  });

  it("keeps only what came before the edited question", () => {
    expect(messagesBefore(thread, "13")?.map((m) => m.id)).toEqual(["11", "12"]);
    expect(messagesBefore(thread, "11")).toEqual([]);
    expect(messagesBefore(thread, "99")).toBeNull();
  });

  it("swaps a local id for the stored one", () => {
    const local = [...thread.slice(0, 2), { id: "local-x", role: "user" as const, content: "Q?", createdAt: at }];
    expect(withMessageId(local, "local-x", "15").map((m) => m.id)).toEqual(["11", "12", "15"]);
    expect(withMessageId(local, "missing", "15")).toEqual(local);
  });
});
