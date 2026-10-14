"use client";

import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { AnswerCard } from "@/features/chat/answer-card";
import { PinnedAnswers } from "@/features/chat/pinned-answers";
import { pinnedAnswers } from "@/lib/chat-rail";
import { BotAvatar } from "@/features/chat/bot-avatar";
import { ChatComposer } from "@/features/chat/chat-composer";
import { Crossfade } from "@/features/chat/crossfade";
import { ChatEmptyState } from "@/features/chat/chat-empty-state";
import { ThreadSkeleton } from "@/features/chat/chat-skeletons";
import { MessageBubble } from "@/features/chat/message-bubble";
import { TypingIndicator } from "@/features/chat/typing-indicator";
import type { StreamingModel } from "@/features/chat/use-chat-session";
import type { ChatConversation, ChatMessage, SuggestedPrompt } from "@/types/chat";
import { formatDate, getInitials } from "@/utils/format";

const FOLLOW_THRESHOLD_PX = 80;

interface ChatViewProps {
  conversation: ChatConversation | null;
  /** SPEC-354: the thread to show is still on its way — draw its skeleton, not the welcome. */
  loading?: boolean;
  userName: string;
  prompts: SuggestedPrompt[];
  /** AI-generated follow-ups from the last answer (SPEC-030); null → the
   * curated starters apply. */
  dynamicPrompts: SuggestedPrompt[] | null;
  input: string;
  isThinking: boolean;
  /** Accumulated in-flight reply (SPEC-016); null when not streaming. */
  streamingReply: string | null;
  /** Live agent progress phrase (SPEC-036); null → spiral only. */
  thinkingStatus: string | null;
  /** What is answering the live stream (SPEC-238); tagged only when overridden. */
  streamingModel?: StreamingModel | null;
  /** The composer's bottom-left controls — the model pill (SPEC-238 Patch). */
  composerTools?: React.ReactNode;
  onInputChange: (value: string) => void;
  onSend: (text: string) => void;
  /** SPEC-271: the composer's sphere toggles voice mode. */
  onTalk?: () => void;
  /** SPEC-271: the voice pane, in place of the thread while it is open. */
  voice?: React.ReactNode;
  /** Answer-card actions (SPEC-240). */
  onRate?: (message: ChatMessage, value: 1 | -1) => void;
  onRegenerate?: (message: ChatMessage) => void;
  /** Pin / unpin an answer (SPEC-249). */
  onPin?: (message: ChatMessage, pinned: boolean) => void;
  /** SPEC-355: replace a stored question, and the turns after it, with new text. */
  onEdit?: (message: ChatMessage, text: string) => void;
}

function DayDivider({ label }: { label: string }) {
  return (
    <div role="separator" aria-label={label} className="flex items-center gap-3">
      <span className="h-px flex-1 bg-border" />
      <span className="rounded-full border bg-card px-3 py-0.5 text-[11px] text-muted-foreground">
        {label}
      </span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

/** Avatar-led row while a reply is in flight — the avatar carries the motion (SPEC-252). */
function AssistantMark() {
  return <BotAvatar state="thinking" className="mt-0.5 size-9 rounded-lg" />;
}

/**
 * The conversation column: messages (or empty state), streaming reply,
 * composer. Scrolls ONLY inside its own container — auto-follow targets the
 * container's scrollTop and respects a user who has scrolled up (SPEC-016).
 */
export function ChatView({
  conversation,
  loading = false,
  userName,
  prompts,
  dynamicPrompts,
  input,
  isThinking,
  streamingReply,
  thinkingStatus,
  streamingModel = null,
  composerTools,
  onInputChange,
  onSend,
  onTalk,
  voice,
  onRate,
  onRegenerate,
  onPin,
  onEdit,
}: ChatViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const followRef = useRef(true);
  const messageCount = conversation?.messages.length ?? 0;

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    followRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < FOLLOW_THRESHOLD_PX;
  }

  // New messages always snap to bottom; stream chunks follow only if the
  // user is already at the bottom (never hijack a re-reading scroll).
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
    followRef.current = true;
  }, [messageCount, isThinking]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el && followRef.current) el.scrollTop = el.scrollHeight;
  }, [streamingReply]);

  const isEmpty = !conversation || conversation.messages.length === 0;
  const userInitials = getInitials(userName);

  const askedQuestions = new Set(
    (conversation?.messages ?? [])
      .filter((message) => message.role === "user")
      .map((message) => message.content.trim().toLowerCase()),
  );
  // SPEC-030: the AI's fresh set renders whole and is replaced (never
  // consumed) after each answer; the depleting starter filter only applies
  // to restored conversations that have no dynamic set yet.
  const followUps =
    dynamicPrompts ??
    prompts
      .filter((prompt) => !askedQuestions.has(prompt.label.toLowerCase()))
      .slice(0, 3);
  const lastMessage = conversation?.messages.at(-1);
  const showFollowUps =
    !isThinking &&
    streamingReply === null &&
    lastMessage?.role === "assistant" &&
    followUps.length > 0;

  const pinned = pinnedAnswers(conversation);

  function jumpTo(message: ChatMessage) {
    const el = document.getElementById(`message-${message.id}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    // A brief ring so the eye lands on the right card; CSS only, then gone.
    el.classList.add("ring-2", "ring-ai/60");
    window.setTimeout(() => el.classList.remove("ring-2", "ring-ai/60"), 1200);
  }

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
      {pinned.length > 0 && (
        <PinnedAnswers
          answers={pinned}
          onJump={jumpTo}
          onUnpin={(message) => onPin?.(message, false)}
        />
      )}
      {/* SPEC-271: the thread and the voice pane share the conversation area;
          the sphere button and ✕ crossfade between them — rail, header and the
          message box stay put. */}
      <Crossfade
        mode={voice ? "voice" : "text"}
        layers={{
          text: (
            <>
              {loading && isEmpty && streamingReply === null && !isThinking ? (
                <ThreadSkeleton />
              ) : isEmpty && streamingReply === null && !isThinking ? (
                <ChatEmptyState
                  userName={userName}
                  prompts={prompts}
                  disabled={isThinking}
                  onPrompt={onSend}
                />
              ) : (
                <div
                  ref={scrollRef}
                  onScroll={handleScroll}
                  className="scrollbar-subtle min-h-0 flex-1 overflow-y-auto overscroll-contain"
                >
                  <div className="w-full space-y-6 px-4 py-6 md:px-8">
                    {conversation?.messages.map((message, index) => {
                      const previous = conversation.messages[index - 1];
                      const dayLabel = formatDate(message.createdAt);
                      const newDay =
                        !previous || formatDate(previous.createdAt) !== dayLabel;
                      return (
                        <div key={message.id} className="space-y-6">
                          {newDay && <DayDivider label={dayLabel} />}
                          {message.role === "assistant" ? (
                            // SPEC-240: one answer card per assistant turn.
                            <AnswerCard
                              message={message}
                              onRate={onRate}
                              onRegenerate={onRegenerate}
                              onPin={onPin}
                              busy={isThinking}
                            />
                          ) : (
                            <MessageBubble
                              message={message}
                              maxWidthClassName="max-w-[95%] md:max-w-[90%]"
                              userInitials={userInitials}
                              // SPEC-355: an edit replaces this question and what followed.
                              onEdit={onEdit ? (text) => onEdit(message, text) : undefined}
                              busy={isThinking}
                            />
                          )}
                        </div>
                      );
                    })}

                    {isThinking && streamingReply === null && (
                      <div className="flex gap-3">
                        <AssistantMark />
                        <TypingIndicator label={thinkingStatus ?? undefined} />
                      </div>
                    )}

                    {streamingReply !== null && (
                      <AnswerCard streamingContent={streamingReply} streamingModel={streamingModel} />
                    )}

                    {showFollowUps && (
                      <div className="flex flex-wrap items-center gap-2 pl-11">
                        <span className="text-[11px] text-muted-foreground">
                          Ask next:
                        </span>
                        {followUps.map((prompt) => (
                          <Button
                            key={prompt.id}
                            variant="outline"
                            size="sm"
                            className="rounded-full"
                            onClick={() => onSend(prompt.label)}
                          >
                            {prompt.label}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ),
          voice,
        }}
      />

      <div className="shrink-0 px-4 py-4 md:px-8">
        <ChatComposer
          value={input}
          disabled={isThinking || streamingReply !== null}
          onChange={onInputChange}
          onSend={onSend}
          onTalk={onTalk}
          talking={Boolean(voice)}
          tools={composerTools}
        />
      </div>
    </div>
  );
}
