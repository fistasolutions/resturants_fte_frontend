"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { MessageSquarePlus, Trash2, type LucideIcon } from "lucide-react";

import { confirmCopy } from "@/lib/confirm";
import { useConfirm } from "@/components/shared/confirm-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AnswerCard } from "@/features/chat/answer-card";
import { ChatComposer } from "@/features/chat/chat-composer";
import { RailSkeleton, ThreadSkeleton } from "@/features/chat/chat-skeletons";
import { MessageBubble } from "@/features/chat/message-bubble";
import { TypingIndicator } from "@/features/chat/typing-indicator";
import { GenerationCard } from "@/features/spotlight/employee-chat/generation-card";
import { useEmployeeChat, type EmployeeChat } from "@/features/spotlight/employee-chat/use-employee-chat";
import { useCan } from "@/hooks/use-can";
import { CHAT_COLUMN_CLASS } from "@/lib/chat-layout";
import { cardsFrom, threadTimeLabel, type EmployeeMeta } from "@/lib/employee-chat";
import { cn } from "@/lib/utils";
import type { ChatConversation, ChatMessage } from "@/types/chat";

/** The employee's tile — its own mark, on the ink tile the hub uses. */
function EmployeeTile({ icon: Icon, className }: { icon: LucideIcon; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center rounded-lg bg-foreground text-background",
        className,
      )}
    >
      <Icon className="size-4" />
    </span>
  );
}

/** The employee's icon at the grounded pill's size. */
function IconMark({ icon: Icon }: { icon: LucideIcon }) {
  return <Icon className="size-3" aria-hidden />;
}

function EmptyState({
  meta,
  icon,
  onStarter,
}: {
  meta: EmployeeMeta;
  icon: LucideIcon;
  onStarter: (text: string, prefill: boolean) => void;
}) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4 px-4 py-10 text-center">
      <EmployeeTile icon={icon} className="size-12" />
      <div>
        <h3 className="text-lg font-semibold text-foreground">Talk to {meta.name}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{meta.role} — tell it what to write, or ask what it knows.</p>
      </div>
      <ul className="w-full space-y-1.5 text-left text-sm text-muted-foreground">
        {meta.offers.map((line) => (
          <li key={line} className="flex gap-2">
            <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-ai" />
            <span>{line}</span>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap justify-center gap-2" aria-label="Starter asks">
        {meta.starters.map((starter) => (
          <button
            key={starter.label}
            type="button"
            onClick={() => onStarter(starter.text, Boolean(starter.prefill))}
            className="rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {starter.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * One of the employee's turns (SPEC-352): its tile beside the platform's one answer card —
 * the same card Glisp answers in, so a table, a chart, the page that acts on the answer and
 * the receipt look the same in every chat. A card the turn started rides inside it.
 */
function EmployeeTurn({
  message,
  icon: Icon,
  extras,
}: {
  message: ChatMessage;
  icon: LucideIcon;
  extras?: (message: ChatMessage) => ReactNode;
}) {
  const cards = cardsFrom(message.sources);
  const extra = extras ? extras(message) : null;
  return (
    <div className="flex gap-3">
      <EmployeeTile icon={Icon} className="mt-0.5 size-8" />
      <div className="min-w-0 flex-1">
        <AnswerCard message={message} mark={<IconMark icon={Icon} />}>
          {cards.length > 0 || extra ? (
            <>
              {cards.map((card) => (
                <GenerationCard key={`${card.job_id}`} card={card} />
              ))}
              {extra}
            </>
          ) : null}
        </AnswerCard>
      </div>
    </div>
  );
}

function ThreadRail({
  name,
  threads,
  activeId,
  onOpen,
  onNew,
  onRemove,
}: {
  name: string;
  /** `null` while the list loads (SPEC-354): the rows are a skeleton, never "No chats yet". */
  threads: ChatConversation[] | null;
  activeId: string | null;
  onOpen: (id: string) => void;
  onNew: () => void;
  onRemove: (id: string) => void;
}) {
  return (
    <aside className="hidden h-full w-64 shrink-0 flex-col gap-2 xl:flex" aria-label={`${name} chats`}>
      <Button variant="outline" size="sm" className="justify-start" onClick={onNew}>
        <MessageSquarePlus className="size-4" aria-hidden />
        New chat
      </Button>
      {threads === null ? (
        <RailSkeleton />
      ) : (
        <ol className="scrollbar-subtle min-h-0 flex-1 space-y-0.5 overflow-y-auto">
          {threads.map((thread) => {
            const selected = thread.id === activeId;
            return (
              <li key={thread.id} className="group relative">
                <button
                  type="button"
                  onClick={() => onOpen(thread.id)}
                  aria-current={selected ? "true" : undefined}
                  className={cn(
                    "w-full rounded-lg px-3 py-2 pr-9 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    selected ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )}
                >
                  <span className="block truncate text-sm font-medium">{thread.title}</span>
                  <span className="block text-[11px] text-muted-foreground">{threadTimeLabel(thread.updatedAt)}</span>
                </button>
                <button
                  type="button"
                  aria-label={`Delete chat: ${thread.title}`}
                  onClick={() => onRemove(thread.id)}
                  className="absolute top-2 right-1.5 rounded-md p-1 text-muted-foreground opacity-0 transition-opacity outline-none group-hover:opacity-100 hover:text-destructive focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Trash2 className="size-3.5" aria-hidden />
                </button>
              </li>
            );
          })}
          {threads.length === 0 ? (
            <li className="px-3 py-2 text-xs text-muted-foreground">No chats yet.</li>
          ) : null}
        </ol>
      )}
    </aside>
  );
}

/**
 * An employee's chat (SPEC-293, generalised by SPEC-301): the employee's threads on the
 * left, the open thread and the composer on the right. A send streams the reply; a turn
 * that started work carries its card. Under `xl` the rail is a dropdown.
 *
 * The column is a FIXED height (SPEC-293 Patches): the rail, the header and the composer
 * stay put and only the message list scrolls. It fills to the bottom: an employee's chat
 * tab is a chat workspace (`isChatWorkspace`), so the floating Ask Glisp pill is
 * suppressed there rather than parked on the send button. The thread reaches the
 * viewport's bottom and right edges — it breaks out of the shell's `p-4 md:p-6` with
 * matching negative margins, and only its top-left corner is rounded, so the
 * conversation reads as the surface, not a card on a page.
 *
 * One panel for every employee: the threads are the employee's own (backend SPEC-287
 * files them under `conversations.employee`), never Glisp's and never another employee's.
 */
export function EmployeeChatPanel({ meta, icon }: { meta: EmployeeMeta; icon: LucideIcon }) {
  const chat = useEmployeeChat(meta.id);
  return <EmployeeChatView meta={meta} icon={icon} chat={chat} />;
}

/**
 * The chat itself, for any source of an `EmployeeChat` (SPEC-345): the shared engine's hook
 * above, or an employee whose backend is still to come. `extras` draws what a turn carries
 * beyond the stored cards — the Email Marketing Manager's "open the builder" actions.
 */
export function EmployeeChatView({
  meta,
  icon,
  chat,
  extras,
}: {
  meta: EmployeeMeta;
  icon: LucideIcon;
  chat: EmployeeChat;
  extras?: (message: ChatMessage) => ReactNode;
}) {
  const confirm = useConfirm();
  const inputId = `${meta.id}-chat-input`;
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  // Root Rule 13: asking an employee needs "chat.use"; a role without it reads, never sends.
  const chatGate = useCan()("chat.use");
  const logRef = useRef<HTMLDivElement>(null);
  const threads = chat.threads ?? [];
  const messages = chat.active?.messages ?? [];
  const messageCount = messages.length;
  const streamingLength = chat.streaming?.length ?? 0;

  // Keep the newest turn in view as it streams — the list is scrolled directly, never
  // `scrollIntoView`, which would also move the page behind a nested scroller.
  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [messageCount, streamingLength, chat.activeId]);

  async function remove(id: string) {
    const title = threads.find((t) => t.id === id)?.title ?? "this chat";
    if (!(await confirm(confirmCopy("thread", title)))) return;
    setPendingDelete(id);
    try {
      await chat.remove(id);
    } finally {
      setPendingDelete(null);
    }
  }

  function starter(text: string, prefill: boolean) {
    if (prefill) {
      chat.setInput(text);
      document.getElementById(inputId)?.focus();
      return;
    }
    void chat.send(text);
  }

  return (
    <div className="-mr-4 -mb-4 flex h-[calc(100svh-17.5rem)] gap-4 md:-mr-6 md:-mb-6 md:h-[calc(100svh-12.0625rem)]">
      <ThreadRail name={meta.name} threads={chat.threads} activeId={chat.activeId} onOpen={chat.open} onNew={chat.newChat} onRemove={(id) => void remove(id)} />

      {/* The Card's own outline is a ring, which cannot be sided — so the edges that
          meet the viewport lose it and only the two inner edges are drawn. */}
      <Card className="flex h-full min-h-0 min-w-0 flex-1 flex-col gap-0 rounded-none rounded-tl-2xl border-t border-l border-border p-0 ring-0">
        <div className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-3">
          <EmployeeTile icon={icon} className="size-8" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">{meta.name}</p>
            {/* A div, not a p: the skeleton is a div, and a div inside a p breaks hydration. */}
            <div className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
              <span className="shrink-0">{meta.role} ·</span>
              {chat.settled ? (
                <span className="truncate">{chat.active ? chat.active.title : "New chat"}</span>
              ) : (
                <Skeleton className="h-3 w-32" />
              )}
            </div>
          </div>
          <div className="xl:hidden">
            <Select value={chat.activeId ?? "__new"} onValueChange={(value) => (value === "__new" ? chat.newChat() : chat.open(value))}>
              <SelectTrigger className="h-8 w-44 text-xs" aria-label="Open a chat">
                <SelectValue placeholder="Chats" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__new">New chat</SelectItem>
                {threads.map((thread) => (
                  <SelectItem key={thread.id} value={thread.id}>{thread.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div
          ref={logRef}
          className="scrollbar-subtle min-h-0 flex-1 overflow-y-auto px-4 py-4"
          role="log"
          aria-live="polite"
          aria-busy={chat.busy}
        >
          {chat.error && chat.threads === null ? (
            <p className="px-2 py-6 text-center text-sm text-destructive">Your chats could not be loaded. Reload to try again.</p>
          ) : !chat.settled && !chat.busy ? (
            // SPEC-354: the data area waits in the thread's own shape; the frame does not move.
            <ThreadSkeleton />
          ) : messages.length === 0 && !chat.busy ? (
            <EmptyState meta={meta} icon={icon} onStarter={starter} />
          ) : (
            <div className={cn(CHAT_COLUMN_CLASS, "flex flex-col gap-4")}>
              {messages.map((message) =>
                message.role === "user" ? (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    busy={chat.busy || !chatGate.allowed}
                    onEdit={(text) => void chat.edit(message.id, text)}
                  />
                ) : (
                  <EmployeeTurn key={message.id} message={message} icon={icon} extras={extras} />
                ),
              )}
              {chat.busy ? (
                <div className="flex gap-3">
                  <EmployeeTile icon={icon} className="mt-0.5 size-8" />
                  <div className="min-w-0 flex-1">
                    {chat.streaming ? (
                      <AnswerCard
                        streamingContent={chat.streaming}
                        mark={<IconMark icon={icon} />}
                      />
                    ) : (
                      <TypingIndicator label={chat.status ?? `${meta.name} is thinking…`} />
                    )}
                  </div>
                </div>
              ) : null}
              {chat.failure ? (
                <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {chat.failure}
                </p>
              ) : null}
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-border p-3">
          <div className={CHAT_COLUMN_CLASS}>
            <ChatComposer
              value={chat.input}
              disabled={chat.busy || pendingDelete !== null || !chatGate.allowed}
              onChange={chat.setInput}
              onSend={(text) => void chat.send(text)}
              inputId={inputId}
              placeholder={meta.placeholder}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
