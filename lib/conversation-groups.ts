/**
 * Day-grouping for the chat history rail (SPEC-032). UTC-based like
 * utils/date.ts so labels are stable regardless of the viewer's timezone.
 */
import type { ChatConversation } from "@/types/chat";
import { formatDate } from "@/utils/format";

export interface ConversationGroup {
  label: string;
  conversations: ChatConversation[];
}

function utcDayKey(date: Date): string {
  return `${date.getUTCFullYear()}-${date.getUTCMonth()}-${date.getUTCDate()}`;
}

/**
 * Groups an already-sorted (newest-first) conversation list into labeled
 * sections: "Today", "Yesterday", then formatted dates ("Jul 16, 2026").
 * Malformed timestamps land in "Earlier". Input order is preserved.
 */
export function groupConversationsByDay(
  conversations: ChatConversation[],
  now: Date = new Date(),
): ConversationGroup[] {
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const todayKey = utcDayKey(now);
  const yesterdayKey = utcDayKey(yesterday);

  const groups: ConversationGroup[] = [];
  for (const conversation of conversations) {
    const updated = new Date(conversation.updatedAt);
    const label = Number.isNaN(updated.getTime())
      ? "Earlier"
      : utcDayKey(updated) === todayKey
        ? "Today"
        : utcDayKey(updated) === yesterdayKey
          ? "Yesterday"
          : formatDate(conversation.updatedAt);
    const last = groups[groups.length - 1];
    if (last && last.label === label) {
      last.conversations.push(conversation);
    } else {
      groups.push({ label, conversations: [conversation] });
    }
  }
  return groups;
}
