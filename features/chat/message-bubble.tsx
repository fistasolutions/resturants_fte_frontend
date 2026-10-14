"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, Pencil, X } from "lucide-react";

import { isStoredMessageId } from "@/lib/chat-edit";
import { QUESTION_BUBBLE_WIDTH } from "@/lib/chat-layout";
import type { ChatMessage } from "@/types/chat";
import { formatTime } from "@/utils/format";

interface MessageBubbleProps {
  message: ChatMessage;
  /** Max width utility for the bubble, e.g. "max-w-[85%]". */
  maxWidthClassName?: string;
  /** When set, the message renders an initials avatar beside the bubble. */
  userInitials?: string;
  /**
   * Edit and resend (SPEC-355, replacing SPEC-223's re-ask): the edited question
   * replaces this one and every turn after it, the way ChatGPT and Claude edit. Shown
   * only on a question the server has stored — an edit names it by its id.
   */
  onEdit?: (text: string) => void;
  /** Disables the edit action while an answer is streaming. */
  busy?: boolean;
}

function CopyButton({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
    };
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      resetTimer.current = window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable (permissions/insecure context) — leave state as is.
    }
  }

  const Icon = copied ? Check : Copy;
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "Copied" : "Copy question"}
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        copied
          ? "text-success"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      }`}
    >
      <Icon className="size-3" aria-hidden />
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

/** Small hover/focus action beside a message. Always rendered — a touch device
 *  has no hover state, so opacity is the only thing that changes. */
function MessageAction({
  label,
  icon: Icon,
  onClick,
  disabled,
}: {
  label: string;
  icon: typeof Copy;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40"
    >
      <Icon className="size-3" aria-hidden />
      {label}
    </button>
  );
}

/** The reader's turn (SPEC-240: assistant turns render as `AnswerCard`). */
export function MessageBubble({
  message,
  maxWidthClassName = QUESTION_BUBBLE_WIDTH,
  userInitials,
  onEdit,
  busy,
}: MessageBubbleProps) {
  return (
    <UserMessage
      message={message}
      maxWidthClassName={maxWidthClassName}
      userInitials={userInitials}
      onEdit={isStoredMessageId(message.id) ? onEdit : undefined}
      busy={busy}
    />
  );
}

/** A question the reader asked: copyable, and correctable without retyping. */
function UserMessage({
  message,
  maxWidthClassName,
  userInitials,
  onEdit,
  busy,
}: {
  message: ChatMessage;
  maxWidthClassName: string;
  userInitials?: string;
  onEdit?: (text: string) => void;
  busy?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.content);

  function save() {
    const trimmed = draft.trim();
    setEditing(false);
    if (trimmed && trimmed !== message.content) onEdit?.(trimmed);
    else setDraft(message.content);
  }

  function cancel() {
    setDraft(message.content);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="flex flex-col items-end gap-2">
        <div className={`${maxWidthClassName} w-full`}>
          <label className="sr-only" htmlFor={`edit-${message.id}`}>
            Edit your question
          </label>
          <textarea
            id={`edit-${message.id}`}
            value={draft}
            autoFocus
            rows={Math.min(6, draft.split("\n").length + 1)}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") cancel();
              if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) save();
            }}
            className="w-full resize-y rounded-card border bg-card px-4 py-2.5 text-sm leading-relaxed text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <div className="mt-1.5 flex items-center justify-end gap-2">
            <span className="mr-auto text-[11px] text-muted-foreground">
              Replaces this question and the answers after it.
            </span>
            <MessageAction label="Cancel" icon={X} onClick={cancel} />
            <button
              type="button"
              onClick={save}
              disabled={!draft.trim()}
              className="rounded-md bg-primary px-2.5 py-1 text-[11px] font-medium text-primary-foreground outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex flex-col items-end">
      <div className="flex items-end justify-end gap-2.5">
        <div
          className={`${maxWidthClassName} rounded-card rounded-br-md bg-primary px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line text-primary-foreground`}
        >
          {message.content}
        </div>
        {userInitials && (
          <span
            className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] font-semibold text-secondary-foreground"
            aria-hidden
          >
            {userInitials}
          </span>
        )}
      </div>
      <div
        className={`mt-1 flex items-center gap-1.5 ${userInitials ? "pr-10" : "px-1"}`}
      >
        <span className="text-[10px] text-muted-foreground">
          {formatTime(message.createdAt)}
        </span>
        {/* Visible on hover/focus, but focusable always — a touch device never
            hovers, so opacity is the only thing gated. */}
        <span className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <CopyButton content={message.content} />
          {onEdit && (
            <MessageAction
              label="Edit"
              icon={Pencil}
              onClick={() => setEditing(true)}
              disabled={busy}
            />
          )}
        </span>
      </div>
    </div>
  );
}
