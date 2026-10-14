"use client";

import { useEffect, useSyncExternalStore } from "react";

import { messagesBefore } from "@/lib/chat-edit";
import {
  appendMessage,
  CHAT_STORAGE_KEY,
  createConversation,
  mergeConversations,
  parseStoredConversations,
  sortConversations,
} from "@/lib/chat-store";
import {
  ChatImportError,
  createProject as createProjectApi,
  deleteConversation as deleteConversationApi,
  deleteProject as deleteProjectApi,
  importConversations,
  listConversations,
  pinMessage as pinMessageApi,
  setActiveConversation,
  updateConversation as updateConversationApi,
  updateProject as updateProjectApi,
} from "@/services/chat";
import type { ChatConversation, ChatMessage, ChatProject, ChatProjectStyle } from "@/types/chat";

/**
 * Chat history as an external store, consumed via useSyncExternalStore — SSR
 * renders the loading state (null) and the client hydrates without mismatch.
 *
 * Source of truth is the BACKEND (SPEC-019 / backend SPEC-010): loaded once
 * per page life, mutated optimistically in memory. The server persists turns
 * itself during /chat, so sends need no extra write calls. Any pre-existing
 * localStorage history is imported exactly once, then the key is removed.
 */

let snapshot: ChatConversation[] | null = null;
/** True once the server history has been folded in (SPEC-243) — a thread started
 * before that makes the snapshot non-null without making it loaded. */
let loaded = false;
/** SPEC-245: the account's last active thread — `undefined` until history has
 * loaded, then the server's value, then whatever this tab records. */
let lastActive: string | null | undefined = undefined;
const activeListeners = new Set<() => void>();

function emitActive(next: string | null): void {
  lastActive = next;
  activeListeners.forEach((listener) => listener());
}

function subscribeActive(listener: () => void): () => void {
  activeListeners.add(listener);
  return () => activeListeners.delete(listener);
}

function getActive(): string | null | undefined {
  return lastActive;
}

function getServerActive(): undefined {
  return undefined;
}

// ── SPEC-249: projects ───────────────────────────────────────────────────────
let projectsSnapshot: ChatProject[] | null = null;
const projectListeners = new Set<() => void>();

function emitProjects(next: ChatProject[] | null): void {
  projectsSnapshot = next;
  projectListeners.forEach((listener) => listener());
}

function subscribeProjects(listener: () => void): () => void {
  projectListeners.add(listener);
  return () => projectListeners.delete(listener);
}

function getProjects(): ChatProject[] | null {
  return projectsSnapshot;
}

function getServerProjects(): null {
  return null;
}

/** Recount every project from the conversations on screen. */
function withCounts(projects: ChatProject[], conversations: ChatConversation[]): ChatProject[] {
  const counts = new Map<string, number>();
  for (const conversation of conversations) {
    if (conversation.projectId) {
      counts.set(conversation.projectId, (counts.get(conversation.projectId) ?? 0) + 1);
    }
  }
  return projects.map((project) => ({
    ...project,
    conversationCount: counts.get(project.id) ?? 0,
  }));
}

function updateProjects(next: ChatProject[]): void {
  emitProjects(
    withCounts(next, snapshot ?? []).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
  );
}

/** Create a project: on screen at once under a temporary id, then the server's
 * copy replaces it. Rejects with the server's message (a duplicate name) after
 * removing the placeholder. */
async function createChatProject(name: string, style: ChatProjectStyle): Promise<ChatProject> {
  const now = new Date().toISOString();
  const placeholder: ChatProject = {
    id: `pending-${crypto.randomUUID()}`,
    name,
    createdAt: now,
    updatedAt: now,
    conversationCount: 0,
    color: style.color,
    icon: style.icon,
  };
  updateProjects([placeholder, ...(projectsSnapshot ?? [])]);
  try {
    const created = await createProjectApi(name, style);
    updateProjects(
      (projectsSnapshot ?? []).map((project) => (project.id === placeholder.id ? created : project)),
    );
    return created;
  } catch (error) {
    updateProjects((projectsSnapshot ?? []).filter((project) => project.id !== placeholder.id));
    throw error;
  }
}

/** Rename and/or restyle a project (SPEC-255) — optimistic, reverted on failure. */
async function updateChatProject(
  projectId: string,
  patch: { name?: string } & Partial<ChatProjectStyle>,
): Promise<void> {
  const before = projectsSnapshot ?? [];
  updateProjects(
    before.map((project) =>
      project.id === projectId
        ? { ...project, ...patch, updatedAt: new Date().toISOString() }
        : project,
    ),
  );
  try {
    const updated = await updateProjectApi(projectId, patch);
    updateProjects(
      (projectsSnapshot ?? []).map((project) => (project.id === projectId ? updated : project)),
    );
  } catch (error) {
    updateProjects(before);
    throw error;
  }
}

/** Delete a project; its chats stay, unfiled — locally at once, on the server too. */
function removeChatProject(projectId: string): void {
  update(
    (snapshot ?? []).map((conversation) =>
      conversation.projectId === projectId ? { ...conversation, projectId: null } : conversation,
    ),
  );
  updateProjects((projectsSnapshot ?? []).filter((project) => project.id !== projectId));
  void deleteProjectApi(projectId).catch((error) => {
    console.error("Deleting the project on the server failed:", error);
  });
}

/** File / unfile and pin / unpin a conversation — optimistic, reverted on failure. */
async function patchChatConversation(
  conversationId: string,
  patch: { projectId?: string | null; pinned?: boolean },
): Promise<void> {
  const before = snapshot ?? [];
  update(
    before.map((conversation) => {
      if (conversation.id !== conversationId) return conversation;
      const next = { ...conversation };
      if ("projectId" in patch) next.projectId = patch.projectId ?? null;
      if (patch.pinned !== undefined) {
        next.pinnedAt = patch.pinned ? new Date().toISOString() : null;
      }
      return next;
    }),
  );
  if ("projectId" in patch) updateProjects(projectsSnapshot ?? []);
  try {
    await updateConversationApi(conversationId, patch);
  } catch (error) {
    emit(sortConversations(before));
    updateProjects(projectsSnapshot ?? []);
    throw error;
  }
}

/** Pin / unpin an answer — optimistic, reverted on failure. */
async function pinChatMessage(
  conversationId: string,
  messageId: string,
  pinned: boolean,
): Promise<void> {
  const before = snapshot ?? [];
  patchChatMessage(conversationId, messageId, {
    pinnedAt: pinned ? new Date().toISOString() : null,
  });
  try {
    await pinMessageApi(messageId, pinned);
  } catch (error) {
    emit(sortConversations(before));
    throw error;
  }
}

/** Record the thread the owner is in (SPEC-245). Local at once; the server write
 * is fire-and-forget and skipped when nothing changed. */
function rememberActive(conversationId: string | null): void {
  if (lastActive === conversationId) return;
  emitActive(conversationId);
  void setActiveConversation(conversationId).catch((error) => {
    console.error("Remembering the conversation on the server failed:", error);
  });
}
/** The one in-flight first load, so every caller awaits the same request. */
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit(next: ChatConversation[] | null): void {
  snapshot = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): ChatConversation[] | null {
  return snapshot;
}

function getServerSnapshot(): ChatConversation[] | null {
  return null;
}

/** Migrate localStorage history to the server (idempotent), then drop the key
 * — but only after a successful import, so a failure can retry next load. */
async function migrateLocalHistory(): Promise<void> {
  const stored = parseStoredConversations(
    window.localStorage.getItem(CHAT_STORAGE_KEY),
  );
  if (!stored || stored.length === 0) {
    window.localStorage.removeItem(CHAT_STORAGE_KEY);
    return;
  }
  try {
    await importConversations(stored);
  } catch (error) {
    // A payload the server refuses (4xx) will never succeed on a retry — drop the
    // key rather than fail every load; a 5xx or a network failure keeps it.
    if (error instanceof ChatImportError && error.status >= 400 && error.status < 500) {
      window.localStorage.removeItem(CHAT_STORAGE_KEY);
      return;
    }
    throw error;
  }
  window.localStorage.removeItem(CHAT_STORAGE_KEY);
}

/** Idempotent first load: migrate, then fetch the server history and fold it
 * in behind anything already on screen (SPEC-243 — a send never has to wait
 * for it; a thread started meanwhile is kept, not overwritten). Exported so the
 * Ask Glisp launcher can warm it on hover (SPEC-235). */
export function loadChatHistory(): Promise<void> {
  if (loaded) return Promise.resolve();
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      await migrateLocalHistory();
      const history = await listConversations();
      emit(mergeConversations(snapshot, history.conversations));
      // Projects created here before the load landed are kept (their ids are the
      // server's by then); the server's list fills in the rest.
      const seen = new Set(history.projects.map((project) => project.id));
      updateProjects([
        ...(projectsSnapshot ?? []).filter((project) => !seen.has(project.id)),
        ...history.projects,
      ]);
      // A pointer this tab already moved (a cold send) outranks the server's.
      if (lastActive === undefined) emitActive(history.activeId);
      loaded = true;
    } catch (error) {
      // Degrade gracefully: what is on screen stays, the rail is otherwise
      // empty, and sending still works (the server creates the conversation on
      // the first message either way).
      console.error("Loading chat history failed:", error);
      emit(sortConversations(snapshot ?? []));
      if (projectsSnapshot === null) emitProjects([]);
      if (lastActive === undefined) emitActive(null);
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

function update(next: ChatConversation[]): void {
  emit(sortConversations(next));
}

/** Local until its first message — the server creates the row via /chat.
 * `projectId` (SPEC-249) files it from the start. */
function startChatConversation(projectId: string | null = null): ChatConversation {
  const conversation: ChatConversation = {
    ...createConversation(crypto.randomUUID(), new Date().toISOString()),
    projectId,
    pinnedAt: null,
  };
  update([conversation, ...(snapshot ?? [])]);
  if (projectId) updateProjects(projectsSnapshot ?? []);
  return conversation;
}

function addChatMessage(conversationId: string, message: ChatMessage): void {
  update(
    (snapshot ?? []).map((conversation) =>
      conversation.id === conversationId
        ? appendMessage(conversation, message)
        : conversation,
    ),
  );
}

/** SPEC-355: an edited question replaces itself and every later turn — the thread keeps
 * only what came before it. A message not in the thread changes nothing. */
function truncateChatConversation(conversationId: string, fromMessageId: string): void {
  update(
    (snapshot ?? []).map((conversation) => {
      if (conversation.id !== conversationId) return conversation;
      const before = messagesBefore(conversation.messages, fromMessageId);
      return before === null ? conversation : { ...conversation, messages: before };
    }),
  );
}

/** Update one message in place (SPEC-240: a rating, the server id). */
function patchChatMessage(
  conversationId: string,
  messageId: string,
  patch: Partial<ChatMessage>,
): void {
  update(
    (snapshot ?? []).map((conversation) =>
      conversation.id === conversationId
        ? {
            ...conversation,
            messages: conversation.messages.map((message) =>
              message.id === messageId ? { ...message, ...patch } : message,
            ),
          }
        : conversation,
    ),
  );
}

function removeChatConversation(conversationId: string): void {
  update(
    (snapshot ?? []).filter(
      (conversation) => conversation.id !== conversationId,
    ),
  );
  updateProjects(projectsSnapshot ?? []);
  // Fire-and-forget server delete; 404 (never persisted / already gone) is fine.
  void deleteConversationApi(conversationId).catch((error) => {
    console.error("Deleting the conversation on the server failed:", error);
  });
}

/**
 * @param enabled — `false` subscribes without fetching. The Ask Glisp panel's
 * session is mounted in the app layout on every page (SPEC-235); it must not
 * cost a history request until the reader actually opens the panel.
 */
export function useChatHistory(enabled = true) {
  const conversations = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const lastActiveId = useSyncExternalStore(subscribeActive, getActive, getServerActive);
  const projects = useSyncExternalStore(subscribeProjects, getProjects, getServerProjects);

  useEffect(() => {
    if (enabled) void loadChatHistory();
  }, [enabled]);

  return {
    conversations,
    /** SPEC-245: `undefined` until history has loaded. */
    lastActiveId,
    rememberActive,
    /** SPEC-249: null until history has loaded. */
    projects,
    createProject: createChatProject,
    updateProject: updateChatProject,
    removeProject: removeChatProject,
    patchConversation: patchChatConversation,
    pinMessage: pinChatMessage,
    startConversation: startChatConversation,
    addMessage: addChatMessage,
    patchMessage: patchChatMessage,
    truncateConversation: truncateChatConversation,
    removeConversation: removeChatConversation,
  };
}
