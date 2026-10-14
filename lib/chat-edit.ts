/**
 * Edit a question and resend it (SPEC-355 / backend SPEC-363) — the pure half shared by
 * every chat. An edit replaces the question and everything after it, so it needs the id the
 * server stored the question under; a turn still carrying its local id cannot be edited.
 */
import type { ChatMessage } from "@/types/chat";

/** A message the server has stored — its id is the row's numeric id. */
export function isStoredMessageId(id: string): boolean {
  return /^\d+$/.test(id);
}

/** The thread as it stands before `messageId` — what an edit of that question keeps.
 * `null` when the message is not in the thread. */
export function messagesBefore(messages: ChatMessage[], messageId: string): ChatMessage[] | null {
  const index = messages.findIndex((message) => message.id === messageId);
  return index < 0 ? null : messages.slice(0, index);
}

/** The thread with one message's id swapped — a question's local id for the stored one. */
export function withMessageId(messages: ChatMessage[], from: string, to: string): ChatMessage[] {
  return messages.map((message) => (message.id === from ? { ...message, id: to } : message));
}
