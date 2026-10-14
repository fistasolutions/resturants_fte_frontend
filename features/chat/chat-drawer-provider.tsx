"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { useChatSession, type ChatSession } from "@/features/chat/use-chat-session";
import { useCan } from "@/hooks/use-can";
import {
  isChatDrawerShortcut,
  isChatWorkspace,
  isEditableTarget,
} from "@/lib/chat-drawer-prompts";
import type { ExplainDraft } from "@/lib/explain";
import type { ChatPageContext } from "@/types/chat";

interface ChatDrawerContextValue {
  /** Whether the panel is showing. Always false on `/chat`. */
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  /** True on the full workspace — triggers hide and the panel stays closed. */
  suppressed: boolean;
  /** The drawer's analyst session; lives here so it outlives the sheet. */
  session: ChatSession;
  /** Open the panel and put a question to the current thread (SPEC-242 — the ✦
   * Explain button). While a reply is streaming the text waits in the composer
   * instead of being dropped. A no-op on `/chat`. */
  ask: (question: string, context: ChatPageContext | null) => void;
  /** Open the panel with a question in the composer, unsent (SPEC-242 Patches —
   * the ✦ on a card). The owner reads, edits, sends. A no-op on `/chat`. */
  draft: (question: string, context: ChatPageContext | null) => void;
  /** The pending ✦ draft, for the panel's send to carry its context; cleared
   * by `clearDraft` once sent. */
  pendingDraft: ExplainDraft | null;
  clearDraft: () => void;
  /** SPEC-271: the panel in voice mode — opened by the pill's Talk or the
   * composer's sphere; the pane lives inside the sheet. */
  voiceOpen: boolean;
  openVoice: () => void;
  closeVoice: () => void;
}

const ChatDrawerContext = createContext<ChatDrawerContextValue | null>(null);

/**
 * Owns the Ask Glisp panel (SPEC-235): its open state, its keyboard shortcut and —
 * the part that matters — its analyst session. Mounted once in
 * `app/(app)/layout.tsx`, which Next never unmounts on client navigation, so a
 * thread started on Inventory is still there, still streaming, after a move to
 * Orders and a close/re-open. The session itself is a second instance of the
 * same hook `/chat` uses, over the same shared history store.
 */
export function ChatDrawerProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // SPEC-293: an employee's chat tab is a chat workspace too.
  const suppressed = isChatWorkspace(pathname, searchParams.get("tab"));
  const [rawOpen, setRawOpen] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  // History is fetched the first time the panel opens (or the launcher is
  // hovered, see `ChatLauncher`) — never as a cost of merely loading a page.
  const [everOpened, setEverOpened] = useState(false);
  // SPEC-245: the panel reopens on the account's last thread once history lands.
  const session = useChatSession(everOpened, { restoreLast: true });
  // SPEC-358: a role without chat cannot send or open a call from anywhere in the app.
  const can = useCan();
  const chatAllowed = can("chat.use").allowed;

  // Arriving on `/chat` closes the panel for good rather than hiding it —
  // otherwise leaving the workspace would pop it back open. This is React's
  // "adjust state when a prop changes" pattern, not a setState in an effect.
  const [wasSuppressed, setWasSuppressed] = useState(suppressed);
  if (suppressed !== wasSuppressed) {
    setWasSuppressed(suppressed);
    if (suppressed) setRawOpen(false);
  }

  const open = rawOpen && !suppressed;

  function setOpen(next: boolean) {
    if (suppressed) return;
    if (next) setEverOpened(true);
    if (!next) setVoiceOpen(false);
    setRawOpen(next);
  }

  function toggle() {
    setOpen(!open);
  }

  function openVoice() {
    if (suppressed || !chatAllowed) return;
    setEverOpened(true);
    setRawOpen(true);
    setVoiceOpen(true);
  }

  function closeVoice() {
    setVoiceOpen(false);
  }

  const [pendingDraft, setPendingDraft] = useState<ExplainDraft | null>(null);

  function draft(question: string, context: ChatPageContext | null) {
    if (suppressed || !chatAllowed) return;
    setEverOpened(true);
    setRawOpen(true);
    setPendingDraft({ question, context });
    session.setInput(question);
  }

  function clearDraft() {
    setPendingDraft(null);
  }

  function ask(question: string, context: ChatPageContext | null) {
    if (suppressed || !chatAllowed) return;
    setEverOpened(true);
    setRawOpen(true);
    // The question shows in the composer at once; `send` clears it the moment
    // the turn joins the thread (after history lands, on a cold panel).
    session.setInput(question);
    if (session.isThinking || session.streamingReply !== null) return;
    void session.send(question, context);
  }

  useEffect(() => {
    if (suppressed || !chatAllowed) return;
    function onKeyDown(event: KeyboardEvent) {
      if (!isChatDrawerShortcut(event)) return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        isEditableTarget(target.tagName, target.isContentEditable)
      ) {
        return;
      }
      event.preventDefault();
      setEverOpened(true);
      setRawOpen((current) => !current);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [suppressed, chatAllowed]);

  return (
    <ChatDrawerContext.Provider
      value={{ open, setOpen, toggle, suppressed, session, ask, draft, pendingDraft, clearDraft, voiceOpen, openVoice, closeVoice }}
    >
      {children}
    </ChatDrawerContext.Provider>
  );
}

export function useChatDrawer(): ChatDrawerContextValue {
  const value = useContext(ChatDrawerContext);
  if (!value) {
    throw new Error("useChatDrawer must be used inside <ChatDrawerProvider>.");
  }
  return value;
}

/** For components that may render outside the provider (a card inside a print
 * view, a test harness): null there, the drawer everywhere else. */
export function useOptionalChatDrawer(): ChatDrawerContextValue | null {
  return useContext(ChatDrawerContext);
}
