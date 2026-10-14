"use client";

import { useEffect, useRef, useState } from "react";
import { GlispIcon } from "@/components/shared/glisp-icon";
import { RoleGate } from "@/components/shared/role-gate";
import { BotAvatar } from "@/features/chat/bot-avatar";
import { useChatDrawer } from "@/features/chat/chat-drawer-provider";
import { ChatNudgeCard, NudgeDot } from "@/features/chat/chat-nudge";
import { TalkButton } from "@/features/chat/talk-button";
import { loadChatHistory } from "@/features/chat/use-chat-history";
import { usePageNudge } from "@/features/chat/use-nudge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { shortcutLabel } from "@/lib/chat-drawer-prompts";
import { GLISP_MOTION_MS } from "@/lib/glisp-motion";

/** Client-only: read inside tooltip content, which never renders on the server. */
function ShortcutHint() {
  const label = typeof navigator === "undefined" ? "⌘J" : shortcutLabel(navigator.userAgent);
  return (
    <>
      Ask Glisp, your AI Business Analyst
      <kbd className="ml-2 rounded-sm border border-border bg-background px-1 font-sans text-[10px] font-semibold text-muted-foreground">
        {label}
      </kbd>
    </>
  );
}

/**
 * Desktop launcher for the Ask Glisp panel (SPEC-235): a pill fixed to the
 * bottom-right of the viewport — the one corner no page header, date picker or
 * toast uses. Hidden on `/chat` (the workspace is already open) and while the
 * panel is open (the panel covers this corner). Hover warms the chat history so
 * the rail is in memory by the time the panel slides in.
 */
export function ChatLauncher() {
  const { open, setOpen, suppressed, openVoice, voiceOpen } = useChatDrawer();
  const { nudge, explain, dismiss } = usePageNudge();
  // SPEC-252: the mark nods once when a nudge arrives during the session — never
  // for one already there on load (a page paints still, root Rule 9).
  const [nod, setNod] = useState(false);
  const seenNudge = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const id = nudge?.id ?? null;
    const previous = seenNudge.current;
    seenNudge.current = id;
    if (previous === undefined || id === null || id === previous) return;
    setNod(true);
    const timer = window.setTimeout(() => setNod(false), GLISP_MOTION_MS.nod);
    return () => window.clearTimeout(timer);
  }, [nudge?.id]);
  if (suppressed || open || voiceOpen) return null;

  const warm = () => void loadChatHistory();

  // SPEC-358: a role without chat sees no door to it — the nudge's only action is Explain.
  return (
    <RoleGate need="chat.use">
      {/* SPEC-246: the one thing worth a look on this page, above the pill. */}
      {nudge && (
        <ChatNudgeCard
          nudge={nudge}
          onExplain={explain}
          onDismiss={dismiss}
          className="fixed right-6 bottom-[4.75rem] z-40 hidden md:block"
        />
      )}
      {/* SPEC-268: one pill, two doors — Ask Glisp opens the panel, Talk opens the voice screen. */}
      <div
        data-glisp-launcher
        className="fixed right-6 bottom-6 z-40 hidden h-11 items-center rounded-full bg-foreground text-sm font-semibold text-background shadow-lg md:inline-flex"
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => setOpen(true)}
              onPointerEnter={warm}
              onFocus={warm}
              aria-label={nudge ? "Ask Glisp — something worth a look" : "Ask Glisp"}
              aria-keyshortcuts="Meta+J Control+J"
              className="relative inline-flex h-11 items-center gap-2 rounded-l-full pr-3 pl-2.5 outline-none transition-colors hover:bg-foreground/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {/* The pill is the tile here — the bare mark keeps the red dot readable. */}
              <GlispIcon motion={nod ? "nod" : undefined} className="ml-1.5 size-5" aria-hidden />
              Ask Glisp
              {nudge && <NudgeDot className="-top-0.5 -right-0.5" />}
            </button>
          </TooltipTrigger>
          <TooltipContent side="left" sideOffset={8}>
            <ShortcutHint />
          </TooltipContent>
        </Tooltip>
        <span className="h-5 w-px bg-background/25" aria-hidden />
        <TalkButton onClick={openVoice} withLabel className="h-11 rounded-r-full pr-3.5 pl-2 text-background hover:bg-foreground/90" />
      </div>
    </RoleGate>
  );
}

/**
 * The mobile trigger: an icon at the right end of the mobile header in
 * `app/(app)/layout.tsx` — the only persistent header a phone has.
 */
export function ChatDrawerTrigger() {
  const { setOpen, suppressed } = useChatDrawer();
  const { nudge } = usePageNudge();
  if (suppressed) return null;

  return (
    <RoleGate need="chat.use">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={nudge ? "Ask Glisp — something worth a look" : "Ask Glisp"}
        className="relative ml-auto flex size-8 shrink-0 items-center justify-center rounded-lg outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
      >
        <BotAvatar className="size-7 rounded-md" />
        {/* SPEC-246: the phone gets the dot here and the line as the panel's first row. */}
        {nudge && <NudgeDot className="top-0 right-0 size-2.5" />}
      </button>
    </RoleGate>
  );
}
