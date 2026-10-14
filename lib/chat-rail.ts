/**
 * The chat history rail's three sections (SPEC-249): Projects, Pinned, Chats —
 * plus the rules around them (project names, the excerpt a pinned answer shows).
 * Pure, so the rail component only lays things out.
 */
import { groupConversationsByDay, type ConversationGroup } from "@/lib/conversation-groups";
import type { ChatConversation, ChatMessage, ChatProject } from "@/types/chat";

/** Backend `PROJECT_NAME_MAX`. */
export const PROJECT_NAME_MAX = 60;

export interface ProjectSection {
  project: ChatProject;
  /** Newest-updated first, whatever their pin state. */
  conversations: ChatConversation[];
}

export interface ChatRail {
  projects: ProjectSection[];
  /** Pinned chats, newest-pinned first (filed ones too — a pin is a pin). */
  pinned: ChatConversation[];
  /** Everything unfiled and unpinned, grouped by day. */
  recent: ConversationGroup[];
  recentCount: number;
}

/** The rail's sections from the flat, newest-updated-first history. */
export function buildRail(
  conversations: ChatConversation[],
  projects: ChatProject[],
  now: Date = new Date(),
): ChatRail {
  const byProject = new Map<string, ChatConversation[]>(projects.map((p) => [p.id, []]));
  const pinned: ChatConversation[] = [];
  const recent: ChatConversation[] = [];
  for (const conversation of conversations) {
    const bucket = conversation.projectId ? byProject.get(conversation.projectId) : undefined;
    if (bucket) bucket.push(conversation);
    if (conversation.pinnedAt) pinned.push(conversation);
    else if (!bucket) recent.push(conversation);
  }
  pinned.sort((a, b) => (b.pinnedAt ?? "").localeCompare(a.pinnedAt ?? ""));
  return {
    projects: projects.map((project) => ({
      project,
      conversations: byProject.get(project.id) ?? [],
    })),
    pinned,
    recent: groupConversationsByDay(recent, now),
    recentCount: recent.length,
  };
}

/** Trim and collapse a typed project name; null when it cannot be saved. */
export function cleanProjectName(raw: string): string | null {
  const name = raw.replace(/\s+/g, " ").trim();
  if (!name || name.length > PROJECT_NAME_MAX) return null;
  return name;
}

/** The pinned answers of a thread, in thread order. */
export function pinnedAnswers(conversation: ChatConversation | null): ChatMessage[] {
  return (conversation?.messages ?? []).filter(
    (message) => message.role === "assistant" && Boolean(message.pinnedAt),
  );
}

/** The first sentence of an answer for the pinned strip: Markdown marks dropped,
 * cut at a sentence end or `max` characters. */
export function answerExcerpt(content: string, max = 120): string {
  const flat = content
    .replace(/```[\s\S]*?```/g, " ")
    // A heading names a section; the excerpt wants the answer's own words.
    .replace(/^\s*#{1,6}\s+.*$/gm, " ")
    .replace(/^\s*([-*+]\s+|\d+\.\s+|>\s+)/gm, "")
    // Table rules and pipes are layout, not words.
    .replace(/^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/gm, " ")
    .replace(/\|/g, " ")
    .replace(/[*_`~]+/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
  if (!flat) return "";
  // A whole first sentence stands on its own; only a hard cut gets an ellipsis.
  const sentence = flat.match(/^.+?[.!?](?=\s|$)/)?.[0];
  if (sentence && sentence.length <= max) return sentence;
  if (flat.length <= max) return flat;
  return `${flat.slice(0, max).replace(/[\s,;:]+$/, "")}…`;
}

/** The project a fresh thread belongs to, as the composer's empty state names it. */
export function projectNameFor(projects: ChatProject[], projectId: string | null): string | null {
  return projects.find((project) => project.id === projectId)?.name ?? null;
}

/** A title for a truncating row: the stored title already ends in "…" when it was
 * cut at 40 characters, and the row's own `truncate` adds another — one is enough. */
export function railTitle(title: string): string {
  return title.replace(/[\s.…]+$/u, "") || title;
}
