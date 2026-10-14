"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  ArrowUpRight,
  BadgePercent,
  Boxes,
  ChartNoAxesCombined,
  FileText,
  Footprints,
  Headset,
  Landmark,
  MapPin,
  Maximize2,
  Package,
  Percent,
  RotateCcw,
  Search,
  ShoppingCart,
  SquarePen,
  TrendingUp,
  Users,
  Warehouse,
  X,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AnswerCard } from "@/features/chat/answer-card";
import { BotAvatar } from "@/features/chat/bot-avatar";
import { ChatComposer } from "@/features/chat/chat-composer";
import { ThreadSkeleton } from "@/features/chat/chat-skeletons";
import { Crossfade } from "@/features/chat/crossfade";
import { VoicePane } from "@/features/chat/voice-pane";
import { useChatDrawer } from "@/features/chat/chat-drawer-provider";
import { MessageBubble } from "@/features/chat/message-bubble";
import { ModelPicker } from "@/features/chat/model-picker";
import { TypingIndicator } from "@/features/chat/typing-indicator";
import { usePageNudge } from "@/features/chat/use-nudge";
import { pageContextFor, subjectOf } from "@/lib/chat-context";
import { draftContextFor } from "@/lib/explain";
import {
  chatWorkspaceHref,
  promptsFor,
  type DrawerPrompt,
  type DrawerPromptIcon,
} from "@/lib/chat-drawer-prompts";
import { isNavItemActive, navItems } from "@/lib/navigation";
import { splitLine } from "@/lib/nudge";
import type { ChatPageContext } from "@/types/chat";
import type { Nudge } from "@/types/nudge";
import { dateToISO } from "@/utils/date";
import { GlispIcon } from "@/components/shared/glisp-icon";
import { avatarState } from "@/lib/glisp-motion";

const FOLLOW_THRESHOLD_PX = 80;
/** The sheet's slide-in (`motion="slide"`), after which heights are final. */
const SHEET_SLIDE_MS = 250;

const PROMPT_ICONS: Record<DrawerPromptIcon, LucideIcon> = {
  revenue: TrendingUp,
  compare: ChartNoAxesCombined,
  products: Package,
  customers: Users,
  inventory: Boxes,
  orders: ShoppingCart,
  discounts: BadgePercent,
  returns: RotateCcw,
  support: Headset,
  warehouse: Warehouse,
  traffic: Footprints,
  search: Search,
  tax: Landmark,
  report: FileText,
  margin: Percent,
  location: MapPin,
};

/** The route's sidebar title, for "Suggested for Inventory Analyst". */
function pageTitle(pathname: string): string | null {
  return (
    navItems.find((item) => isNavItemActive(pathname, item.href))?.title ?? null
  );
}

function PromptRow({
  prompt,
  disabled,
  onPick,
}: {
  prompt: DrawerPrompt;
  disabled: boolean;
  onPick: (label: string) => void;
}) {
  const Icon = PROMPT_ICONS[prompt.icon];
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onPick(prompt.label)}
      className="flex w-full items-center gap-3 rounded-lg border bg-card px-3 py-2.5 text-left text-sm text-card-foreground transition-colors outline-none hover:border-foreground/25 hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
    >
      <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <span className="min-w-0 flex-1">{prompt.label}</span>
    </button>
  );
}

/** Fresh-thread state: what the analyst is, then four prompts for this page —
 * about *this* product / order / store when the page is about one (SPEC-236). */
/** SPEC-246: the page's nudge at the top of the panel, whatever the thread state —
 * the phone's only way to it, and a reminder over a restored thread. */
function DrawerNudgeRow({
  nudge,
  disabled,
  onExplain,
  onDismiss,
}: {
  nudge: Nudge;
  disabled: boolean;
  onExplain: () => void;
  onDismiss: () => void;
}) {
  const [before, figure, after] = splitLine(nudge);
  return (
    <div
      data-nudge-row
      className="flex items-start gap-2 border-b border-ai/20 bg-ai/5 px-4 py-2.5 text-sm"
    >
      <button
        type="button"
        disabled={disabled}
        onClick={onExplain}
        className="flex min-w-0 flex-1 items-start gap-2.5 rounded-md text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
      >
        <GlispIcon className="mt-0.5 size-4 shrink-0 text-ai" aria-hidden />
        <span className="min-w-0 flex-1 leading-snug">
          <span className="block text-[10px] font-bold tracking-widest text-ai uppercase">
            Worth a look · {nudge.page}
          </span>
          {before}
          {figure && <b className="font-semibold">{figure}</b>}
          {after}
          <span className="ml-1.5 text-xs font-medium text-ai">
            {nudge.action} →
          </span>
        </span>
      </button>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={onDismiss}
        className="inline-flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <X className="size-3.5" aria-hidden />
      </button>
    </div>
  );
}

function DrawerEmptyState({
  pathname,
  context,
  disabled,
  onPick,
}: {
  pathname: string;
  context: ChatPageContext | null;
  disabled: boolean;
  onPick: (label: string) => void;
}) {
  const prompts = promptsFor(pathname, subjectOf(context));
  const title = pageTitle(pathname);
  return (
    <div className="space-y-4 p-4">
      <div className="rounded-card border bg-card px-4 py-3 text-sm leading-relaxed text-card-foreground">
        I answer from your store&apos;s records — sales, products, customers,
        inventory, returns, support, warehouse and footfall. Every number comes
        from the analytics engine, never from me.
      </div>
      <p className="px-1 text-[11px] font-medium tracking-widest text-muted-foreground uppercase">
        {title ? `Suggested for ${title}` : "Suggested prompts"}
      </p>
      <div className="space-y-2">
        {prompts.map((prompt) => (
          <PromptRow
            key={prompt.id}
            prompt={prompt}
            disabled={disabled}
            onPick={onPick}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * The Ask Glisp panel (SPEC-235): the analyst in a right-hand sheet on every
 * page. State lives in `ChatDrawerProvider`, so this component is purely the
 * surface — it can unmount on close and remount on open without losing the
 * thread or an in-flight stream.
 */
export function ChatDrawer() {
  const { open, setOpen, session, voiceOpen, openVoice, closeVoice, pendingDraft, clearDraft } =
    useChatDrawer();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const {
    activeConversation,
    input,
    setInput,
    isThinking,
    streamingReply,
    thinkingStatus,
    dynamicPrompts,
    override,
    setOverride,
    streamingModel,
    send: sendMessage,
    rate,
    regenerate,
    newChat,
    pinMessage,
    restoring,
    edit,
  } = session;

  // SPEC-236: every question carries where it was asked from. Read from the URL
  // at send time, so a thread that follows the owner across pages always says
  // where the *current* question came from.
  const pageContext = pageContextFor(
    pathname,
    searchParams,
    dateToISO(new Date()),
  );
  const send = (text: string) => {
    // SPEC-242 Patches: a ✦ draft still sent as written carries the card's focus.
    void sendMessage(text, draftContextFor(pendingDraft, text, pageContext));
    if (pendingDraft) clearDraft();
  };
  const pageNudge = usePageNudge();

  // The sheet mounts its content a tick after `open` flips, so an effect keyed on
  // `open` alone ran before the scroll box existed and a reopened panel sat at the
  // top (SPEC-235 Patches). The callback ref bumps `boxMount` when the box is
  // there, and the snap effect keys on that.
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [boxMount, setBoxMount] = useState(0);
  const attachScrollBox = useCallback((el: HTMLDivElement | null) => {
    scrollRef.current = el;
    if (el) setBoxMount((n) => n + 1);
  }, []);
  const followRef = useRef(true);
  const messages = activeConversation?.messages ?? [];
  const messageCount = messages.length;

  function handleScroll(event: React.UIEvent<HTMLDivElement>) {
    const el = event.currentTarget;
    followRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < FOLLOW_THRESHOLD_PX;
  }

  // Same follow rules as the chat page (SPEC-016): new messages snap to the
  // bottom; stream chunks follow only while the reader is already there. The snap
  // also has to survive what arrives late — the sheet's slide-in, a restored
  // thread's cards, tables and images taking their height — so it re-runs on every
  // content resize while the reader is at the bottom (SPEC-235 Patches).
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    followRef.current = true;
    const toBottom = () => {
      if (followRef.current) el.scrollTop = el.scrollHeight;
    };
    toBottom();
    const frame = window.requestAnimationFrame(toBottom);
    const settled = window.setTimeout(toBottom, SHEET_SLIDE_MS + 50);
    const observer = new ResizeObserver(toBottom);
    observer.observe(el.firstElementChild ?? el);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(settled);
      observer.disconnect();
    };
  }, [boxMount, messageCount, isThinking, open, activeConversation?.id]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el && followRef.current) el.scrollTop = el.scrollHeight;
  }, [streamingReply]);

  const isEmpty = messageCount === 0 && streamingReply === null && !isThinking;
  // SPEC-354: until the last thread is known the panel shows the thread's skeleton, not
  // the starters it may be about to replace.
  const showSkeleton = isEmpty && restoring;
  // Prompts and composer are live from the first paint — `send` itself waits
  // for history if it has not landed yet.
  const composerDisabled = isThinking || streamingReply !== null;

  const lastMessage = messages.at(-1);
  const showFollowUps =
    !isThinking &&
    streamingReply === null &&
    lastMessage?.role === "assistant" &&
    (dynamicPrompts?.length ?? 0) > 0;

  // Hand the thread over only once it exists on the server (first send).
  const workspaceHref = chatWorkspaceHref(
    messageCount > 0 ? (activeConversation?.id ?? null) : null,
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="right"
        showCloseButton={false}
        motion="slide"
        // The composer takes focus (its `autoFocus`), not the first header button.
        onOpenAutoFocus={(event) => event.preventDefault()}
        className="gap-0 bg-background p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-md"
      >
        <header className="flex shrink-0 items-center gap-3 border-b bg-card px-4 py-3">
          <BotAvatar
            state={avatarState(isThinking)}
            className="size-9 rounded-lg"
          />
          <div className="min-w-0 flex-1">
            <SheetTitle className="truncate text-sm font-semibold">
              Glisp · AI Business Analyst
            </SheetTitle>
            <SheetDescription className="flex items-center gap-1.5 text-xs text-success">
              <span className="size-1.5 rounded-full bg-success" aria-hidden />
              Online · reads your store&apos;s records
            </SheetDescription>
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            {messageCount > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="New chat"
                    disabled={isThinking}
                    onClick={() => newChat()}
                  >
                    <SquarePen aria-hidden />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">New chat</TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button asChild variant="ghost" size="icon-sm">
                  <Link
                    href={workspaceHref}
                    aria-label="Open full workspace"
                    onClick={() => setOpen(false)}
                  >
                    <Maximize2 aria-hidden />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Open full workspace</TooltipContent>
            </Tooltip>
            <SheetClose asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Close">
                <X aria-hidden />
              </Button>
            </SheetClose>
          </div>
        </header>

        {/* SPEC-271: the thread and the voice pane share the sheet; the sphere
            button and ✕ crossfade between them, the header never moves. */}
        <Crossfade
          mode={voiceOpen ? "voice" : "text"}
          layers={{
            text: (
              <>
                {pageNudge.nudge && (
                  <DrawerNudgeRow
                    nudge={pageNudge.nudge}
                    disabled={composerDisabled}
                    onExplain={pageNudge.explain}
                    onDismiss={pageNudge.dismiss}
                  />
                )}

                <div
                  ref={attachScrollBox}
                  onScroll={handleScroll}
                  className="scrollbar-subtle min-h-0 flex-1 overflow-y-auto overscroll-contain"
                >
                  {showSkeleton ? (
                    <ThreadSkeleton compact />
                  ) : isEmpty ? (
                    <DrawerEmptyState
                      pathname={pathname}
                      context={pageContext}
                      disabled={composerDisabled}
                      onPick={send}
                    />
                  ) : (
                    <div className="space-y-4 p-4">
                      {messages.map((message) =>
                        message.role === "assistant" ? (
                          // SPEC-240: the same answer card as the chat page, tighter.
                          <AnswerCard
                            key={message.id}
                            message={message}
                            onRate={rate}
                            onRegenerate={(m) =>
                              void regenerate(m, pageContext)
                            }
                            onPin={(m, pinned) => void pinMessage(m, pinned)}
                            onNavigate={() => setOpen(false)}
                            busy={isThinking}
                            compact
                          />
                        ) : (
                          <MessageBubble
                            key={message.id}
                            message={message}
                            maxWidthClassName="max-w-[92%]"
                            onEdit={(text) => void edit(message.id, text, pageContext)}
                            busy={isThinking}
                          />
                        ),
                      )}

                      {isThinking && streamingReply === null && (
                        <div className="flex items-start gap-2">
                          {/* SPEC-252: the avatar carries the thinking motion beside the status. */}
                          <BotAvatar
                            state="thinking"
                            className="mt-0.5 size-7 rounded-md"
                          />
                          <TypingIndicator
                            label={thinkingStatus ?? undefined}
                          />
                        </div>
                      )}

                      {streamingReply !== null && (
                        <AnswerCard
                          streamingContent={streamingReply}
                          streamingModel={streamingModel}
                          compact
                        />
                      )}

                      {showFollowUps && (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] text-muted-foreground">
                            Ask next:
                          </span>
                          {dynamicPrompts?.map((prompt) => (
                            <Button
                              key={prompt.id}
                              variant="outline"
                              size="sm"
                              // The base button is `shrink-0 whitespace-nowrap`; a chip in a
                              // narrow panel must be allowed to shrink so its text can wrap.
                              className="h-auto max-w-full min-w-0 shrink rounded-full py-1 text-left whitespace-normal"
                              onClick={() => send(prompt.label)}
                            >
                              {prompt.label}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="shrink-0 border-t bg-card p-3">
                  {/* The hand-off, spelled out: what the full page has that the panel does not. */}
                  <Link
                    href={workspaceHref}
                    onClick={() => setOpen(false)}
                    data-workspace-link
                    className="mb-2 flex items-center justify-between gap-3 rounded-lg border border-border bg-accent px-2.5 py-1.5 text-xs font-semibold text-foreground underline decoration-muted-foreground/60 underline-offset-2 outline-none transition-colors hover:bg-accent/70 hover:decoration-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span>
                      Open the full workspace — projects, pinned chats, history
                      and model choice
                    </span>
                    <ArrowUpRight className="size-3.5 shrink-0" aria-hidden />
                  </Link>
                  <ChatComposer
                    value={input}
                    disabled={composerDisabled}
                    onChange={setInput}
                    onSend={(text) => send(text)}
                    onTalk={openVoice}
                    talking={voiceOpen}
                    autoFocus
                    inputId="chat-drawer-input"
                    tools={
                      <ModelPicker
                        override={override}
                        onChange={setOverride}
                        disabled={isThinking}
                      />
                    }
                  />
                </div>
              </>
            ),
            voice: voiceOpen ? (
              <VoicePane
                session={session}
                context={pageContext}
                onClose={closeVoice}
                variant="panel"
              />
            ) : null,
          }}
        />
      </SheetContent>
    </Sheet>
  );
}
