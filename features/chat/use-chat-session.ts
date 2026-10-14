"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useChatHistory } from "@/features/chat/use-chat-history";
import {
  forgetFollowUps,
  loadFollowUps,
  saveFollowUps,
} from "@/lib/chat-followups";
import { speakReadAloud, stopReadAloud } from "@/features/chat/read-aloud-store";
import { voiceRepliesOn } from "@/features/chat/use-voice-replies";
import { useApiQuery } from "@/hooks/use-api-query";
import { isStoredMessageId, messagesBefore } from "@/lib/chat-edit";
import {
  overrideToPreference,
  preferenceToOverride,
  withPreferred,
} from "@/lib/chat-model-preference";
import { markdownToPlainText } from "@/lib/markdown-plain";
import { chatQueries } from "@/lib/queries/chat";
import { createStreamPacer } from "@/lib/stream-pacer";
import { getAssistantReply, rateMessage, setChatModel, type LiveTurn } from "@/services/chat";
import type { ChatModels } from "@/types/ai-providers";
import type {
  ChatConversation,
  ChatMessage,
  ChatModelOverride,
  ChatPageContext,
  ChatProject,
  ChatProjectStyle,
  SuggestedPrompt,
} from "@/types/chat";

/** What is answering the live stream (SPEC-238), for the streaming bubble's tag. */
export interface StreamingModel {
  model: string;
  temperature: number | null;
  overridden: boolean;
}

/**
 * One analyst session: the active conversation, the composer draft, the
 * in-flight stream and the follow-up chips — plus the send / select / new /
 * delete flow around them (SPEC-235).
 *
 * Lifted out of `chat-page.tsx` so the `/chat` page and the Ask Glisp panel run
 * the identical flow against the identical history store: every send goes
 * through `getAssistantReply` (the server persists both turns, SPEC-019), every
 * chip set is cached per conversation (SPEC-223). Each consumer owns its own
 * instance — the page and the drawer are separate sessions over shared history.
 */
export interface ChatSession {
  conversations: ChatConversation[] | null;
  /**
   * SPEC-354: a `restoreLast` session whose history has not landed yet, so the thread
   * to show is not known. The panel draws a skeleton instead of the starters meanwhile.
   * A failed history load settles it too (the store emits an empty list).
   */
  restoring: boolean;
  activeConversation: ChatConversation | null;
  activeId: string | null;
  input: string;
  setInput: (value: string) => void;
  isThinking: boolean;
  /** Accumulated in-flight reply (SPEC-016); null when idle. */
  streamingReply: string | null;
  /** Live agent progress phrase (SPEC-036, backend SPEC-030); null when idle. */
  thinkingStatus: string | null;
  /** AI-generated follow-ups from the last answer (SPEC-030); null falls back
   * to the curated starters. */
  dynamicPrompts: SuggestedPrompt[] | null;
  /** The active conversation's own model/temperature (SPEC-238); null = default. */
  /** SPEC-273: the thread a live call lands in — the open one, or a new one in the
   * project the owner is in. Returns `{ id, projectId }` for `POST /chat/live`. */
  lineFor: () => { id: string; projectId: string | null };
  /** SPEC-273: one exchange the server stored during a call — two cards into that thread. */
  liveTurn: (conversationId: string, turn: LiveTurn) => void;
  /** SPEC-266: the account's remembered chat model — every surface reads one answer. */
  override: ChatModelOverride | null;
  /** Save (or clear, with null) the account's chat model; rejects with the server's reason. */
  setOverride: (override: ChatModelOverride | null) => Promise<void>;
  /** The model answering the in-flight stream; null when idle. */
  streamingModel: StreamingModel | null;
  /** `context` (SPEC-236): where the question was asked from; the drawer passes
   * it, the chat page passes nothing. */
  send: (text: string, context?: ChatPageContext | null) => Promise<void>;
  /**
   * SPEC-355: replace a stored question — and every turn after it — with `text`, the way
   * ChatGPT edits. The server deletes them before it answers (backend SPEC-363).
   */
  edit: (messageId: string, text: string, context?: ChatPageContext | null) => Promise<void>;
  /** 👍 / 👎 / clear on a stored reply (SPEC-240); optimistic, reverted on failure. */
  rate: (message: ChatMessage, value: 1 | -1) => Promise<void>;
  /** Re-ask the question that produced this reply, as a new turn (SPEC-240). */
  regenerate: (message: ChatMessage, context?: ChatPageContext | null) => Promise<void>;
  selectConversation: (conversationId: string) => void;
  /** `projectId` (SPEC-249): the fresh thread starts inside that project;
   * left out (SPEC-255) it starts in the current project, if any. */
  newChat: (projectId?: string | null) => void;
  deleteConversation: (conversationId: string) => void;
  // ── SPEC-249: projects, pinned chats, pinned answers ──────────────────────
  /** null until history has loaded. */
  projects: ChatProject[] | null;
  /** The project a not-yet-created thread will start in. */
  pendingProjectId: string | null;
  /** SPEC-255: the project the owner is "in" — the active thread's, or the one
   * they clicked. New chat lands there. */
  currentProjectId: string | null;
  /** Click a project: it becomes current and a fresh thread opens inside it. */
  enterProject: (projectId: string) => void;
  /** Back to plain New chat. */
  leaveProject: () => void;
  createProject: (name: string, style: ChatProjectStyle) => Promise<ChatProject>;
  updateProject: (
    projectId: string,
    patch: { name?: string } & Partial<ChatProjectStyle>,
  ) => Promise<void>;
  deleteProject: (projectId: string) => void;
  pinConversation: (conversationId: string, pinned: boolean) => Promise<void>;
  moveConversation: (conversationId: string, projectId: string | null) => Promise<void>;
  pinMessage: (message: ChatMessage, pinned: boolean) => Promise<void>;
}

export interface ChatSessionOptions {
  /** SPEC-245: when history first lands and this session has no thread of its
   * own, open the account's last active conversation. The drawer does; the
   * `/chat` workspace keeps its rail and `?c=` hand-off instead. */
  restoreLast?: boolean;
}

/**
 * @param loadHistory — passed through to `useChatHistory`; the drawer defers
 * the fetch until it is first opened, the page loads immediately.
 */
export function useChatSession(
  loadHistory = true,
  { restoreLast = false }: ChatSessionOptions = {},
): ChatSession {
  const {
    conversations,
    lastActiveId,
    rememberActive,
    projects,
    createProject,
    updateProject,
    removeProject,
    patchConversation,
    pinMessage: pinStoredMessage,
    startConversation,
    addMessage,
    patchMessage,
    truncateConversation,
    removeConversation,
  } = useChatHistory(loadHistory);
  const [activeId, setActiveId] = useState<string | null>(null);
  // SPEC-249: "New chat here" — the project a thread not yet created belongs to.
  const [pendingProjectId, setPendingProjectId] = useState<string | null>(null);
  // SPEC-255: the project the owner clicked into; the active thread's own project
  // outranks it (see `currentProjectId` below).
  const [enteredProjectId, setEnteredProjectId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [streamingReply, setStreamingReply] = useState<string | null>(null);
  const [thinkingStatus, setThinkingStatus] = useState<string | null>(null);
  const [dynamicPrompts, setDynamicPrompts] = useState<SuggestedPrompt[] | null>(null);
  // SPEC-266: the model the owner picked is the account's, read from the shared
  // `chat/models` answer so the page and the panel always agree; a pick writes the
  // cache first (both surfaces update at once), then saves, and reverts on failure.
  const queryClient = useQueryClient();
  const models = useApiQuery(chatQueries.models());
  const override = preferenceToOverride(models.data?.preferred);
  const [streamingModel, setStreamingModel] = useState<StreamingModel | null>(null);

  const activeConversation =
    conversations?.find((conversation) => conversation.id === activeId) ?? null;

  async function setOverride(next: ChatModelOverride | null) {
    const key = chatQueries.models().queryKey;
    const previous = queryClient.getQueryData<ChatModels>(key);
    queryClient.setQueryData<ChatModels>(key, (current) => withPreferred(current, next));
    try {
      await setChatModel(overrideToPreference(next));
    } catch (failure) {
      queryClient.setQueryData<ChatModels>(key, previous);
      throw failure;
    }
  }

  /** SPEC-223: a conversation's own follow-ups, or null for the starters. */
  function restorePrompts(conversationId: string | null): SuggestedPrompt[] | null {
    const cached = loadFollowUps(conversationId);
    return cached
      ? cached.map((label, index) => ({ id: `followup-${index}`, label }))
      : null;
  }

  // SPEC-245: pick up where you left off — once, when history first lands, and
  // only if nothing has been started here meanwhile (a cold ✦ press, SPEC-242,
  // owns the panel). React's "adjust state when a prop changes" pattern.
  const [restored, setRestored] = useState(!restoreLast);
  if (!restored && conversations !== null && lastActiveId !== undefined) {
    setRestored(true);
    if (
      activeId === null &&
      lastActiveId !== null &&
      conversations.some((conversation) => conversation.id === lastActiveId)
    ) {
      setActiveId(lastActiveId);
      setDynamicPrompts(restorePrompts(lastActiveId));
    }
  }

  const currentProjectId =
    activeConversation?.projectId ?? (activeId === null ? (pendingProjectId ?? enteredProjectId) : null);

  function enterProject(projectId: string) {
    stopReadAloud();
    setEnteredProjectId(projectId);
    setActiveId(null);
    setPendingProjectId(projectId);
    setDynamicPrompts(null);
    rememberActive(null);
  }

  function leaveProject() {
    setEnteredProjectId(null);
    setPendingProjectId(null);
  }

  function selectConversation(conversationId: string) {
    stopReadAloud();
    // Opening a chat puts the owner in that chat's project (or none).
    setEnteredProjectId(
      conversations?.find((conversation) => conversation.id === conversationId)?.projectId ?? null,
    );
    setActiveId(conversationId);
    // Restore THIS conversation's chips rather than clearing to the generic
    // starters, which read as if the assistant had forgotten the exchange.
    setDynamicPrompts(restorePrompts(conversationId));
    rememberActive(conversationId);
  }

  function newChat(projectId?: string | null) {
    stopReadAloud();
    // No argument: stay in the current project (SPEC-255). An explicit null leaves it.
    const target = projectId === undefined ? currentProjectId : projectId;
    setEnteredProjectId(target);
    setActiveId(null);
    setPendingProjectId(target);
    setDynamicPrompts(null);
    rememberActive(null);
  }

  function deleteProject(projectId: string) {
    removeProject(projectId);
    if (pendingProjectId === projectId) setPendingProjectId(null);
    if (enteredProjectId === projectId) setEnteredProjectId(null);
  }

  async function pinConversation(conversationId: string, pinned: boolean) {
    try {
      await patchConversation(conversationId, { pinned });
    } catch (error) {
      console.error("Pinning the chat failed:", error);
    }
  }

  async function moveConversation(conversationId: string, projectId: string | null) {
    try {
      await patchConversation(conversationId, { projectId });
    } catch (error) {
      console.error("Moving the chat failed:", error);
    }
  }

  async function pinMessage(message: ChatMessage, pinned: boolean) {
    if (!activeConversation || message.role !== "assistant") return;
    try {
      await pinStoredMessage(activeConversation.id, message.id, pinned);
    } catch (error) {
      console.error("Pinning the answer failed:", error);
    }
  }

  function deleteConversation(conversationId: string) {
    if (conversationId === activeId) stopReadAloud();
    removeConversation(conversationId);
    forgetFollowUps(conversationId);
    if (conversationId === activeId) {
      setActiveId(null);
      rememberActive(null);
    }
  }

  async function send(
    text: string,
    context: ChatPageContext | null = null,
    replaceFrom: number | null = null,
  ) {
    const trimmed = text.trim();
    if (!trimmed || isThinking) return;
    // A send before history has landed starts its thread at once; the history
    // folds in behind it when it arrives (SPEC-243 — `mergeConversations`). The
    // store functions below read the live snapshot, not this render's
    // `conversations`.
    const conversation = activeConversation ?? startConversation(pendingProjectId);
    // SPEC-266: the account's model rides every send explicitly — what the pill
    // shows is what answers (the backend falls back to it anyway).
    const chosen = override;
    setActiveId(conversation.id);
    setPendingProjectId(null);
    setInput("");
    const questionId = crypto.randomUUID();
    addMessage(conversation.id, {
      id: questionId,
      role: "user",
      content: trimmed,
      createdAt: new Date().toISOString(),
    });

    setIsThinking(true);
    // SPEC-355: the reply is drawn at a steady pace, and committed once all of it is shown.
    const pacer = createStreamPacer(setStreamingReply);
    // A new question interrupts any answer still being read aloud (SPEC-254).
    stopReadAloud();
    // What actually answered, from the stream's opening frame — the backend resolves
    // a temperature-only override onto the default model, so this is the truth.
    // (A holder object rather than a bare `let`: TypeScript narrows a closure-assigned
    // variable to `never` after the await.)
    const answered: { value: StreamingModel | null } = { value: null };
    try {
      // Chunks render live via streamingReply; the server persists both
      // turns itself (SPEC-019) — the in-memory commit happens once, on
      // completion (SPEC-016).
      const turn = await getAssistantReply(
        trimmed,
        conversation.id,
        (accumulated) => pacer.push(accumulated),
        (questions) => {
          saveFollowUps(conversation.id, questions);
          setDynamicPrompts(
            questions.map((label, index) => ({
              id: `followup-${index}`,
              label,
            })),
          );
        },
        setThinkingStatus,
        context,
        chosen,
        (model, temperature, overridden) => {
          answered.value = { model, temperature, overridden };
          setStreamingModel(answered.value);
        },
        // SPEC-249: a fresh thread is created inside its project by the server.
        conversation.projectId ?? null,
        null,
        {
          replaceFrom,
          // SPEC-355: the stored id, so this question can be edited straight away.
          onUserMessageId: (id) => patchMessage(conversation.id, questionId, { id }),
        },
      );
      await pacer.finish();
      // The thread exists on the server now (it created the row for this turn),
      // so it can be the account's remembered one (SPEC-245).
      rememberActive(conversation.id);
      const replyId = turn.messageId ?? crypto.randomUUID();
      // SPEC-254: with Voice replies on, the answer is read the moment it lands —
      // as the card's own Read aloud would, so its speaker shows the stop state.
      if (voiceRepliesOn()) speakReadAloud(replyId, markdownToPlainText(turn.reply));
      addMessage(conversation.id, {
        // The server's id when the reply was stored, so it can be rated at once
        // and matches history after a reload (SPEC-240).
        id: replyId,
        role: "assistant",
        content: turn.reply,
        createdAt: new Date().toISOString(),
        model: answered.value?.overridden ? answered.value.model : null,
        temperature: answered.value?.overridden ? answered.value.temperature : null,
        sources: turn.sources,
        feedback: null,
      });
    } catch (error) {
      pacer.cancel();
      addMessage(conversation.id, {
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          error instanceof Error && error.message
            ? error.message
            : "Something went wrong while answering. Please try again in a moment.",
        createdAt: new Date().toISOString(),
      });
    } finally {
      setStreamingReply(null);
      setThinkingStatus(null);
      setStreamingModel(null);
      setIsThinking(false);
    }
  }

  async function edit(messageId: string, text: string, context: ChatPageContext | null = null) {
    if (!activeConversation || isThinking || !isStoredMessageId(messageId)) return;
    if (messagesBefore(activeConversation.messages, messageId) === null) return;
    truncateConversation(activeConversation.id, messageId);
    await send(text, context, Number(messageId));
  }

  function lineFor(): { id: string; projectId: string | null } {
    // Same thread rules as `send` (SPEC-273): the open thread, or a new one in the
    // project the owner is in. Nothing is stored until the server announces a turn.
    const conversation = activeConversation ?? startConversation(pendingProjectId);
    setActiveId(conversation.id);
    setPendingProjectId(null);
    stopReadAloud();
    return { id: conversation.id, projectId: conversation.projectId ?? null };
  }

  function liveTurn(conversationId: string, turn: LiveTurn) {
    const now = new Date().toISOString();
    addMessage(conversationId, {
      id: crypto.randomUUID(),
      role: "user",
      content: turn.you,
      createdAt: now,
    });
    if (turn.content) {
      rememberActive(conversationId);
      addMessage(conversationId, {
        id: turn.messageId ?? crypto.randomUUID(),
        role: "assistant",
        content: turn.content,
        createdAt: now,
        model: turn.model,
        temperature: null,
        sources: turn.sources ?? undefined,
        feedback: null,
      });
    }
  }

  async function rate(message: ChatMessage, value: 1 | -1) {
    if (!activeConversation || message.role !== "assistant") return;
    const next = message.feedback === value ? 0 : value;
    const previous = message.feedback ?? null;
    patchMessage(activeConversation.id, message.id, { feedback: next || null });
    try {
      await rateMessage(message.id, next);
    } catch (error) {
      patchMessage(activeConversation.id, message.id, { feedback: previous });
      console.error("Saving the rating failed:", error);
    }
  }

  async function regenerate(message: ChatMessage, context: ChatPageContext | null = null) {
    if (!activeConversation) return;
    const index = activeConversation.messages.findIndex((m) => m.id === message.id);
    const question = [...activeConversation.messages.slice(0, index)]
      .reverse()
      .find((m) => m.role === "user");
    if (question) await send(question.content, context);
  }

  return {
    conversations,
    restoring: !restored,
    activeConversation,
    activeId,
    input,
    setInput,
    isThinking,
    streamingReply,
    thinkingStatus,
    dynamicPrompts,
    override,
    setOverride,
    streamingModel,
    send,
    edit,
    lineFor,
    liveTurn,
    rate,
    regenerate,
    selectConversation,
    newChat,
    deleteConversation,
    projects,
    pendingProjectId,
    currentProjectId,
    enterProject,
    leaveProject,
    createProject,
    updateProject,
    deleteProject,
    pinConversation,
    moveConversation,
    pinMessage,
  };
}
