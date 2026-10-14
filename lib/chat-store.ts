/**
 * Pure chat-history logic (unit-tested). Persistence is a thin adapter in
 * `features/chat/use-chat-history.ts` — Phase 1 uses localStorage; Phase 8
 * swaps the adapter for backend agent sessions without touching this logic.
 */
import type { ChatConversation, ChatMessage } from "@/types/chat";

// v2: bumped when the seeded reply format changed (SPEC-010 Patches) so
// existing previews re-seed with the Markdown-formatted conversations.
export const CHAT_STORAGE_KEY = "aias_chat_history_v2";

const TITLE_MAX_LENGTH = 40;
export const NEW_CHAT_TITLE = "New chat";

export function createConversation(id: string, nowISO: string): ChatConversation {
  return {
    id,
    title: NEW_CHAT_TITLE,
    createdAt: nowISO,
    updatedAt: nowISO,
    messages: [],
  };
}

/** First user message → conversation title, ellipsized at 40 chars. */
export function conversationTitleFrom(content: string): string {
  const flat = content.trim().replace(/\s+/g, " ");
  if (!flat) return NEW_CHAT_TITLE;
  if (flat.length <= TITLE_MAX_LENGTH) return flat;
  return `${flat.slice(0, TITLE_MAX_LENGTH - 1).trimEnd()}…`;
}

/** Append a message; bumps updatedAt and auto-titles on the first user message. */
export function appendMessage(
  conversation: ChatConversation,
  message: ChatMessage,
): ChatConversation {
  const isFirstUserMessage =
    message.role === "user" &&
    !conversation.messages.some((existing) => existing.role === "user");

  return {
    ...conversation,
    title: isFirstUserMessage
      ? conversationTitleFrom(message.content)
      : conversation.title,
    updatedAt: message.createdAt,
    messages: [...conversation.messages, message],
  };
}

/** Most recently updated first. */
export function sortConversations(
  conversations: ChatConversation[],
): ChatConversation[] {
  return [...conversations].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
}

/**
 * The server history folded in behind whatever is already on screen (SPEC-243):
 * every local conversation is kept exactly as it is — it is at least as fresh as
 * the server's copy, and may be mid-stream — and server conversations the client
 * has not seen are added. So a thread started before history arrived is never
 * overwritten by it.
 */
export function mergeConversations(
  local: ChatConversation[] | null,
  server: ChatConversation[],
): ChatConversation[] {
  const seen = new Set((local ?? []).map((conversation) => conversation.id));
  return sortConversations([
    ...(local ?? []),
    ...server.filter((conversation) => !seen.has(conversation.id)),
  ]);
}

function isChatMessage(value: unknown): value is ChatMessage {
  if (typeof value !== "object" || value === null) return false;
  const message = value as Record<string, unknown>;
  return (
    typeof message.id === "string" &&
    (message.role === "user" || message.role === "assistant") &&
    typeof message.content === "string" &&
    typeof message.createdAt === "string"
  );
}

function isChatConversation(value: unknown): value is ChatConversation {
  if (typeof value !== "object" || value === null) return false;
  const conversation = value as Record<string, unknown>;
  return (
    typeof conversation.id === "string" &&
    typeof conversation.title === "string" &&
    typeof conversation.createdAt === "string" &&
    typeof conversation.updatedAt === "string" &&
    Array.isArray(conversation.messages) &&
    conversation.messages.every(isChatMessage)
  );
}

/** Safe parse of persisted history — malformed/foreign data yields null. */
export function parseStoredConversations(
  raw: string | null,
): ChatConversation[] | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.every(isChatConversation)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function serializeConversations(
  conversations: ChatConversation[],
): string {
  return JSON.stringify(conversations);
}
