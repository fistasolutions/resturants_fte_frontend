"use client";

import { useState } from "react";
import { ChevronDown, Pin, PinOff } from "lucide-react";

import { answerExcerpt } from "@/lib/chat-rail";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types/chat";

interface PinnedAnswersProps {
  answers: ChatMessage[];
  /** Scroll the thread to this message. */
  onJump: (message: ChatMessage) => void;
  onUnpin: (message: ChatMessage) => void;
}

/**
 * The pinned answers of the open thread (SPEC-249): a collapsible strip under
 * the header, one row per pin — its first sentence, a jump, its own unpin.
 * Hidden when nothing is pinned.
 */
export function PinnedAnswers({ answers, onJump, onUnpin }: PinnedAnswersProps) {
  const [open, setOpen] = useState(true);
  if (answers.length === 0) return null;
  return (
    <section
      aria-label="Pinned answers"
      data-pinned-answers
      className="shrink-0 border-b bg-ai/5"
    >
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-4 py-2 text-left text-[11px] font-bold tracking-widest text-ai uppercase outline-none focus-visible:ring-2 focus-visible:ring-ring md:px-8"
      >
        <Pin className="size-3.5" aria-hidden />
        Pinned answers
        <span className="rounded-full bg-ai/10 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums">
          {answers.length}
        </span>
        <ChevronDown
          className={cn("ml-auto size-3.5 transition-transform", !open && "-rotate-90")}
          aria-hidden
        />
      </button>
      {open && (
        <ol className="scrollbar-subtle max-h-36 space-y-0.5 overflow-y-auto px-2 pb-2 md:px-6">
          {answers.map((message) => (
            <li key={message.id} className="group flex items-center gap-1">
              <button
                type="button"
                onClick={() => onJump(message)}
                className="min-w-0 flex-1 truncate rounded-md px-2 py-1.5 text-left text-sm text-foreground outline-none transition-colors hover:bg-ai/10 focus-visible:ring-2 focus-visible:ring-ring"
                title={answerExcerpt(message.content, 300)}
              >
                {answerExcerpt(message.content)}
              </button>
              <button
                type="button"
                onClick={() => onUnpin(message)}
                aria-label="Unpin this answer"
                title="Unpin"
                className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring"
              >
                <PinOff className="size-3.5" aria-hidden />
              </button>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
