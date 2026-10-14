"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { History, PanelLeftOpen, SquarePen } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { BotAvatar } from "@/features/chat/bot-avatar";
import { ChatHistory, type ChatHistoryActions } from "@/features/chat/chat-history";
import { ChatView } from "@/features/chat/chat-view";
import { ModelPicker } from "@/features/chat/model-picker";
import { useChatSession } from "@/features/chat/use-chat-session";
import { useCan } from "@/hooks/use-can";
import { VoicePane } from "@/features/chat/voice-pane";
import { avatarState } from "@/lib/glisp-motion";
import type { SuggestedPrompt } from "@/types/chat";

interface ChatPageProps {
  userName: string;
  prompts: SuggestedPrompt[];
  /** When set (via ?q= from "Ask why →" links), auto-submits this question
   * once chat history has loaded. */
  initialQuestion?: string;
  /** When set (via ?c= from the Ask Glisp panel's "Open full workspace",
   * SPEC-235), selects that conversation once chat history has loaded. */
  initialConversationId?: string;
}

/** Desktop history rail collapse preference (SPEC-032): a tiny external
 * store over localStorage so the value is hydration-safe (server snapshot
 * is "expanded") and lint-clean (no setState-in-effect). */
const HISTORY_COLLAPSED_KEY = "aias_chat_collapsed";
const collapseListeners = new Set<() => void>();

function subscribeToCollapse(listener: () => void): () => void {
  collapseListeners.add(listener);
  return () => collapseListeners.delete(listener);
}

function readCollapsed(): boolean {
  return window.localStorage.getItem(HISTORY_COLLAPSED_KEY) === "1";
}

function writeCollapsed(collapsed: boolean): void {
  window.localStorage.setItem(HISTORY_COLLAPSED_KEY, collapsed ? "1" : "0");
  collapseListeners.forEach((listener) => listener());
}

/** Client orchestrator for /chat: history state, active conversation, send flow. */
export function ChatPage({
  userName,
  prompts,
  initialQuestion,
  initialConversationId,
}: ChatPageProps) {
  // The send / select / new / delete flow is shared with the Ask Glisp panel
  // (SPEC-235) — one hook, so the page and the panel can never drift apart.
  const session = useChatSession();
  // Root Rule 13: asking Glisp needs "chat.use"; a role without it reads, never sends.
  const chatGate = useCan()("chat.use");
  // SPEC-271: Talk to Glisp inside the conversation area, into the thread that is open.
  const [voiceOpen, setVoiceOpen] = useState(false);
  const {
    conversations,
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
    rate,
    regenerate,
    projects,
    currentProjectId,
    pinMessage,
  } = session;
  const [historyOpen, setHistoryOpen] = useState(false);
  /** Desktop rail collapse (SPEC-032); server snapshot renders expanded. */
  const historyCollapsed = useSyncExternalStore(
    subscribeToCollapse,
    readCollapsed,
    () => false,
  );

  function setCollapsed(collapsed: boolean) {
    writeCollapsed(collapsed);
  }

  // Auto-submit the ?q= question exactly once after chat history loads (SPEC-046).
  const autoSubmittedRef = useRef(false);
  useEffect(() => {
    if (!initialQuestion || autoSubmittedRef.current || conversations === null) return;
    autoSubmittedRef.current = true;
    void send(initialQuestion);
    // `send` is a closure recreated each render; `autoSubmittedRef` guards against
    // duplicate calls so the only thing that must trigger a re-check is `conversations`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations]);

  // Open the ?c= conversation exactly once after history loads (SPEC-235) — the
  // drawer's hand-off. An id that is not in the history is ignored, not an error.
  const autoSelectedRef = useRef(false);
  // SPEC-354: until the hand-off is applied (or dismissed as unknown), the thread area
  // shows the skeleton rather than the welcome state it is about to replace.
  const [handOffPending, setHandOffPending] = useState(Boolean(initialConversationId));
  useEffect(() => {
    if (!initialConversationId || autoSelectedRef.current || conversations === null) return;
    autoSelectedRef.current = true;
    if (conversations.some((conversation) => conversation.id === initialConversationId)) {
      session.selectConversation(initialConversationId);
    }
    setHandOffPending(false);
    // Same guard shape as the ?q= effect above: only `conversations` can re-trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations]);

  function selectConversation(conversationId: string) {
    session.selectConversation(conversationId);
    setHistoryOpen(false);
  }

  function newChat(projectId?: string | null) {
    session.newChat(projectId);
    setHistoryOpen(false);
  }

  const deleteConversation = session.deleteConversation;

  // SPEC-249: the rail's actions — the same set for the desktop rail and the phone sheet.
  const railActions: ChatHistoryActions = {
    onNewChat: newChat,
    onSelect: selectConversation,
    onDelete: deleteConversation,
    onPin: (id, pinned) => void session.pinConversation(id, pinned),
    onMove: (id, projectId) => void session.moveConversation(id, projectId),
    onEnterProject: (id) => {
      session.enterProject(id);
      setHistoryOpen(false);
    },
    onLeaveProject: session.leaveProject,
    onCreateProject: (value) => session.createProject(value.name, value),
    onUpdateProject: (id, value) => session.updateProject(id, value),
    onDeleteProject: session.deleteProject,
  };

  return (
    <div className="flex h-[calc(100svh-3.5rem)] max-h-[calc(100svh-3.5rem)] min-h-0 flex-1 flex-col overflow-hidden md:h-svh md:max-h-svh">
      <header className="flex items-center justify-between gap-3 border-b bg-card p-4 md:px-6">
        <div className="flex items-center gap-3">
          <BotAvatar state={avatarState(isThinking)} className="size-10 rounded-lg" />
          <div>
            <h1 className="font-heading text-2xl tracking-wide">Chat with AI</h1>
            <p className="flex items-center gap-1.5 text-xs text-success">
              <span className="size-1.5 rounded-full bg-success" aria-hidden />
              Glisp · AI Business Analyst · Online
            </p>
          </div>
        </div>

        <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="md:hidden">
              <History className="size-4" aria-hidden />
              History
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-4">
            <SheetHeader className="p-0 pb-3">
              <SheetTitle>Chat history</SheetTitle>
            </SheetHeader>
            <ChatHistory
              conversations={conversations}
              projects={projects}
              activeId={activeId}
              currentProjectId={currentProjectId}
              {...railActions}
            />
          </SheetContent>
        </Sheet>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside
          aria-label="Chat history"
          className={`hidden shrink-0 flex-col overflow-hidden border-r bg-card transition-[width] duration-200 md:flex ${
            historyCollapsed ? "w-14 items-center px-2 py-4" : "w-68 p-4"
          }`}
        >
          {historyCollapsed ? (
            <div className="flex flex-col items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Expand chat history"
                title="Expand chat history"
                onClick={() => setCollapsed(false)}
              >
                <PanelLeftOpen className="size-4" aria-hidden />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="New chat"
                title="New chat"
                onClick={() => newChat()}
              >
                <SquarePen className="size-4" aria-hidden />
              </Button>
            </div>
          ) : (
            <ChatHistory
              conversations={conversations}
              projects={projects}
              activeId={activeId}
              currentProjectId={currentProjectId}
              {...railActions}
              onCollapse={() => setCollapsed(true)}
            />
          )}
        </aside>

        {!chatGate.allowed ? (
          <p role="status" className="px-4 pt-3 text-sm text-muted-foreground">
            {chatGate.reason}
          </p>
        ) : null}
        <ChatView
          conversation={activeConversation}
          loading={handOffPending}
          userName={userName}
          prompts={prompts}
          dynamicPrompts={dynamicPrompts}
          input={input}
          isThinking={isThinking}
          streamingReply={streamingReply}
          thinkingStatus={thinkingStatus}
          streamingModel={streamingModel}
          composerTools={
            // SPEC-238 Patch: this conversation's model and temperature live in the
            // composer, not the header.
            <ModelPicker override={override} onChange={setOverride} disabled={isThinking} />
          }
          onInputChange={setInput}
          onSend={(text) => {
            if (!chatGate.allowed) return;
            // typing while talking ends voice and sends the text (SPEC-271)
            setVoiceOpen(false);
            send(text);
          }}
          onTalk={() => setVoiceOpen((current) => !current)}
          voice={
            voiceOpen ? (
              <VoicePane
                session={session}
                context={null}
                onClose={() => {
                  setVoiceOpen(false);
                  document.getElementById("chat-composer-input")?.focus();
                }}
                variant="page"
              />
            ) : null
          }
          onRate={rate}
          onRegenerate={regenerate}
          onPin={(message, pinned) => void pinMessage(message, pinned)}
          onEdit={(message, text) => {
            if (!chatGate.allowed) return;
            // typing while talking ends voice, as a send does (SPEC-271)
            setVoiceOpen(false);
            void session.edit(message.id, text);
          }}
        />
      </div>
    </div>
  );
}
