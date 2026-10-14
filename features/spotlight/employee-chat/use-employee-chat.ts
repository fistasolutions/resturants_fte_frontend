"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useApiQuery } from "@/hooks/use-api-query";
import { useHydrated } from "@/hooks/use-hydrated";
import {
  EMPLOYEES,
  lastThreadKey,
  newThread,
  threadTitleFrom,
  threadToOpen,
  upsertThread,
  withReply,
  withUserTurn,
  type EmployeeId,
} from "@/lib/employee-chat";
import { isStoredMessageId, messagesBefore, withMessageId } from "@/lib/chat-edit";
import { chatQueries } from "@/lib/queries/chat";
import { createStreamPacer } from "@/lib/stream-pacer";
import { deleteConversation, getAssistantReply } from "@/services/chat";
import type { ChatConversation, ChatMessage } from "@/types/chat";

export interface EmployeeChat {
  threads: ChatConversation[] | null;
  loading: boolean;
  error: Error | null;
  /**
   * SPEC-354: the thread to show is known — the list has landed and the remembered
   * thread (or none) is chosen. Until then the panel draws a skeleton, never the
   * welcome state or "No chats yet".
   */
  settled: boolean;
  activeId: string | null;
  active: ChatConversation | null;
  input: string;
  setInput: (value: string) => void;
  busy: boolean;
  status: string | null;
  streaming: string | null;
  failure: string | null;
  send: (text: string) => Promise<void>;
  /** SPEC-355: replace a stored question (and everything after it) with `text`. */
  edit: (messageId: string, text: string) => Promise<void>;
  open: (id: string) => void;
  newChat: () => void;
  remove: (id: string) => Promise<void>;
}

function readRemembered(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** The remembered id is read as an external store's snapshot (SPEC-354): pure for React,
 * `null` on the server, the stored id in the browser. Nothing else writes it while the
 * hook is mounted, so there is nothing to subscribe to. */
const noSubscription = () => () => {};

function remember(key: string, id: string | null): void {
  try {
    if (id) window.localStorage.setItem(key, id);
    else window.localStorage.removeItem(key);
  } catch {
    // A private window or blocked storage: the rail still works, it just forgets.
  }
}

/**
 * One employee's chat (SPEC-293): its threads from the client cache (backend
 * SPEC-287 scopes the list), the open thread, and a send that streams the reply
 * through the same SSE reader the Glisp surfaces use — with `employee` on the
 * request so the backend runs the employee's agent and files the thread under it.
 * The Glisp store is never touched; the last-opened thread is remembered per
 * employee in localStorage.
 */
export function useEmployeeChat(employee: EmployeeId): EmployeeChat {
  const queryClient = useQueryClient();
  const query = useApiQuery(chatQueries.employeeConversations(employee));
  const key = chatQueries.employeeConversations(employee).queryKey;
  const storageKey = lastThreadKey(employee);

  // `undefined` = the owner has not chosen yet; the remembered thread applies.
  const [chosen, setChosen] = useState<string | null | undefined>(undefined);
  const hydrated = useHydrated();
  const remembered = useSyncExternalStore(
    noSubscription,
    () => readRemembered(storageKey),
    () => null,
  );
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [streaming, setStreaming] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const threads = query.data ?? null;

  // SPEC-354: reopen where the owner left off in the same render the list lands — no
  // deferred tick, so the welcome state never paints for a frame before the thread. The
  // remembered id is read only once hydrated, so the server render and the first client
  // render agree (React #418).
  const settled = chosen !== undefined || (hydrated && threads !== null);
  const activeId =
    chosen !== undefined
      ? chosen
      : settled && threads !== null
        ? threadToOpen(threads, remembered)
        : null;

  const activeRef = useRef<string | null>(null);
  useEffect(() => {
    activeRef.current = activeId;
  }, [activeId]);

  const active = useMemo(
    () => threads?.find((t) => t.id === activeId) ?? null,
    [threads, activeId],
  );

  const patch = useCallback(
    (thread: ChatConversation) => {
      queryClient.setQueryData<ChatConversation[]>(key, (current) =>
        upsertThread(current ?? [], thread),
      );
    },
    [queryClient, key],
  );

  const open = useCallback(
    (id: string) => {
      setChosen(id);
      remember(storageKey, id);
      setFailure(null);
    },
    [storageKey],
  );

  const newChat = useCallback(() => {
    setChosen(null);
    remember(storageKey, null);
    setFailure(null);
    setInput("");
  }, [storageKey]);

  /**
   * One turn: the question on screen at once, the reply drawn at a steady pace
   * (SPEC-355 — committed only once all of it is shown), and the question's local id
   * swapped for the stored one as soon as the server names it, so it can be edited.
   * `base` and `replaceFrom` are an edit: the thread as it stood before the question.
   */
  const run = useCallback(
    async (text: string, base: ChatConversation | null, replaceFrom: number | null) => {
      const trimmed = text.trim();
      if (!trimmed || busy) return;
      const now = new Date().toISOString();
      const thread = base ?? newThread(crypto.randomUUID(), threadTitleFrom(trimmed), now);
      const localId = `local-${crypto.randomUUID()}`;
      const userTurn: ChatMessage = { id: localId, role: "user", content: trimmed, createdAt: now };
      patch(withUserTurn(thread, userTurn));
      setChosen(thread.id);
      remember(storageKey, thread.id);
      setInput("");
      setBusy(true);
      setFailure(null);
      setStatus("Understanding the ask…");
      setStreaming(null);
      const current = () =>
        queryClient.getQueryData<ChatConversation[]>(key)?.find((t) => t.id === thread.id) ??
        withUserTurn(thread, userTurn);
      let questionId = localId;
      const pacer = createStreamPacer((shown) => setStreaming(shown));
      try {
        const turn = await getAssistantReply(
          trimmed,
          thread.id,
          (accumulated) => pacer.push(accumulated),
          undefined,
          (phrase) => setStatus(phrase),
          null,
          null,
          undefined,
          null,
          employee,
          {
            replaceFrom,
            onUserMessageId: (id) => {
              const latest = current();
              patch({ ...latest, messages: withMessageId(latest.messages, questionId, id) });
              questionId = id;
            },
          },
        );
        await pacer.finish();
        patch(
          withReply(current(), {
            id: turn.messageId ?? `local-${crypto.randomUUID()}`,
            content: turn.reply,
            createdAt: new Date().toISOString(),
            sources: turn.sources,
          }),
        );
      } catch (cause) {
        pacer.cancel();
        setFailure(cause instanceof Error ? cause.message : `${EMPLOYEES[employee].name} could not answer.`);
      } finally {
        setBusy(false);
        setStatus(null);
        setStreaming(null);
      }
    },
    [busy, patch, storageKey, employee, queryClient, key],
  );

  const send = useCallback(
    (text: string) => run(text, threads?.find((t) => t.id === activeRef.current) ?? null, null),
    [run, threads],
  );

  const edit = useCallback(
    async (messageId: string, text: string) => {
      const thread = threads?.find((t) => t.id === activeRef.current) ?? null;
      const before = thread ? messagesBefore(thread.messages, messageId) : null;
      if (!thread || before === null || !isStoredMessageId(messageId)) return;
      await run(text, { ...thread, messages: before }, Number(messageId));
    },
    [run, threads],
  );

  const remove = useCallback(
    async (id: string) => {
      await deleteConversation(id);
      queryClient.setQueryData<ChatConversation[]>(key, (current) =>
        (current ?? []).filter((t) => t.id !== id),
      );
      if (activeRef.current === id) {
        setChosen(null);
        remember(storageKey, null);
      }
    },
    [queryClient, key, storageKey],
  );

  return {
    threads,
    loading: query.isPending,
    error: query.error ?? null,
    settled,
    activeId,
    active,
    input,
    setInput,
    busy,
    status,
    streaming,
    failure,
    send,
    edit,
    open,
    newChat,
    remove,
  };
}
