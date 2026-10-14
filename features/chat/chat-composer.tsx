"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, SendHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TalkButton } from "@/features/chat/talk-button";
import { SlashMenu } from "@/features/chat/slash-menu";
import { useDictation } from "@/features/chat/use-dictation";
import {
  expandSlash,
  filterSlash,
  findSlash,
  parseSlash,
  type SlashCommand,
} from "@/lib/slash-commands";
import { cn } from "@/lib/utils";
import { appendDictation, isDictationShortcut } from "@/lib/voice";

interface ChatComposerProps {
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
  /** Receives the text to send — a slash shortcut arrives already expanded (SPEC-260). */
  onSend: (text: string) => void;
  /** Focus the textarea on mount — the Ask Glisp panel (SPEC-235) opens ready to type. */
  autoFocus?: boolean;
  /** Distinct id when two composers could share a document. */
  inputId?: string;
  /** Controls rendered in the composer's bottom-left — the model pill (SPEC-238). */
  tools?: React.ReactNode;
  /** SPEC-271: toggle voice mode — the sphere beside the mic. */
  onTalk?: () => void;
  talking?: boolean;
  /** SPEC-293: an employee's own invitation; Glisp's is the default. */
  placeholder?: string;
}

/** Five bars that move only while listening (SPEC-254). */
function SoundBars() {
  return (
    <span className="inline-flex h-3.5 items-end gap-px" aria-hidden>
      {[5, 11, 14, 8, 12].map((height, index) => (
        <i
          key={index}
          className="voice-bar block w-[3px] rounded-sm bg-ai"
          style={{ height: `${height}px`, animationDelay: `${index * 150}ms` }}
        />
      ))}
    </span>
  );
}

/**
 * Message composer: auto-growing textarea, Enter sends, Shift+Enter newline —
 * and, on a browser with a speech engine, a mic that dictates into it plus a
 * Voice replies toggle (SPEC-254). A leading "/" opens the shortcut menu and a
 * shortcut is expanded into its full question on send (SPEC-260).
 */
export function ChatComposer({
  value,
  disabled,
  onChange,
  onSend,
  autoFocus = false,
  inputId = "chat-composer-input",
  tools,
  onTalk,
  talking = false,
  placeholder = "Ask anything about your store — or type / for shortcuts",
}: ChatComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dictation = useDictation();
  // The text as it stood when dictation started, so each confirmed phrase is
  // appended to the latest value rather than to a stale render.
  const latest = useRef(value);
  useEffect(() => {
    latest.current = value;
  }, [value]);

  function toggleDictation() {
    if (dictation.listening) {
      dictation.stop();
      textareaRef.current?.focus();
      return;
    }
    dictation.start((words) => {
      const next = appendDictation(latest.current, words);
      latest.current = next;
      onChange(next);
      const el = textareaRef.current;
      if (el) {
        el.style.height = "auto";
        el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
      }
    });
  }

  const listening = dictation.listening;
  const stripText = dictation.error ?? (listening ? dictation.interim : null);

  // SPEC-260: the shortcut menu. `active` is the highlighted row; `closed` is
  // set by Esc and cleared by the next keystroke.
  const [active, setActive] = useState(0);
  const [closed, setClosed] = useState(false);
  const parsed = parseSlash(value);
  const items = parsed && parsed.typing ? filterSlash(parsed.command) : [];
  const pending =
    parsed && !parsed.typing && parsed.arg === ""
      ? (findSlash(parsed.command) ?? null)
      : null;
  const menuOpen =
    !closed &&
    parsed !== null &&
    (parsed.typing || (pending !== null && pending.arg !== "none"));
  const highlighted =
    items.length > 0 ? items[Math.min(active, items.length - 1)] : null;
  const menuId = `${inputId}-slash`;

  function setText(next: string) {
    onChange(next);
    setActive(0);
    setClosed(false);
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    }
  }

  /** Fill the command word (and keep typing) — Tab, click, or Enter on a partial word. */
  function pick(command: SlashCommand) {
    setText(command.arg === "none" ? `/${command.name}` : `/${command.name} `);
    textareaRef.current?.focus();
  }

  function submit() {
    if (listening) dictation.stop();
    const expansion = expandSlash(value);
    if (expansion.kind === "help") {
      setText("/");
      return;
    }
    if (expansion.kind === "needs-name") {
      setClosed(false);
      return;
    }
    onSend(expansion.kind === "send" ? expansion.question : value);
    textareaRef.current?.focus();
  }

  return (
    <form
      className="relative space-y-1.5"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      {menuOpen && (
        <SlashMenu
          items={items}
          active={Math.min(active, Math.max(items.length - 1, 0))}
          onHover={setActive}
          onPick={pick}
          pending={pending && pending.arg !== "none" ? pending : null}
          onPeriod={(period) => {
            setText(`/${pending?.name} ${period}`);
            textareaRef.current?.focus();
          }}
          menuId={menuId}
        />
      )}
      {/* Two rows (SPEC-238 Patch): the text on top, a quiet toolbar underneath —
          the model pill on the left, Send on the right — so the input reads as one
          surface, the way the reference does. */}
      <div
        className={cn(
          "rounded-card border bg-background px-3 pt-2 pb-2 transition-colors focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/40 dark:bg-card",
          listening && "border-ai/60 ring-2 ring-ai/25",
        )}
      >
        {(listening || dictation.error) && (
          <div
            data-listening
            role="status"
            className="flex flex-wrap items-center gap-x-2 gap-y-0.5 pb-1 text-xs"
          >
            {dictation.error ? (
              <span className="font-medium text-destructive">
                {dictation.error}
              </span>
            ) : (
              <>
                <SoundBars />
                <span className="font-semibold text-ai">Listening</span>
                {stripText ? (
                  <span className="min-w-0 flex-1 truncate text-muted-foreground">
                    {stripText}
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    · pause to finish
                  </span>
                )}
                <span className="ml-auto text-muted-foreground">
                  tap the mic to stop ·{" "}
                  <kbd className="rounded-sm border px-1 text-[10px]">Esc</kbd>{" "}
                  cancels
                </span>
              </>
            )}
          </div>
        )}
        <label htmlFor={inputId} className="sr-only">
          Ask Glisp about your store
        </label>
        <textarea
          ref={textareaRef}
          id={inputId}
          value={value}
          rows={1}
          autoFocus={autoFocus}
          placeholder={placeholder}
          autoComplete="off"
          role={menuOpen && items.length > 0 ? "combobox" : undefined}
          aria-expanded={menuOpen && items.length > 0 ? true : undefined}
          aria-controls={menuOpen && items.length > 0 ? menuId : undefined}
          aria-activedescendant={
            menuOpen && highlighted
              ? `${menuId}-${highlighted.name}`
              : undefined
          }
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (menuOpen && items.length > 0) {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setActive((index) => (index + 1) % items.length);
                return;
              }
              if (event.key === "ArrowUp") {
                event.preventDefault();
                setActive((index) => (index - 1 + items.length) % items.length);
                return;
              }
              if (event.key === "Tab" && highlighted) {
                event.preventDefault();
                pick(highlighted);
                return;
              }
              // Enter on a partial word fills it; on the full word it sends.
              if (
                event.key === "Enter" &&
                !event.shiftKey &&
                highlighted &&
                highlighted.name !== parsed?.command
              ) {
                event.preventDefault();
                pick(highlighted);
                return;
              }
            }
            if (event.key === "Escape" && menuOpen) {
              event.preventDefault();
              setClosed(true);
              return;
            }
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submit();
              return;
            }
            if (event.key === "Escape" && listening) {
              event.preventDefault();
              dictation.cancel();
              return;
            }
            if (dictation.supported && isDictationShortcut(event)) {
              event.preventDefault();
              toggleDictation();
            }
          }}
          className="max-h-40 min-h-9 w-full resize-none bg-transparent px-0 py-1.5 text-sm outline-none placeholder:text-muted-foreground"
        />
        <div className="mt-1 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-3">{tools}</div>
          <div className="flex items-center gap-1.5">
            {dictation.supported && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={toggleDictation}
                    disabled={disabled}
                    aria-pressed={listening}
                    aria-label={listening ? "Stop listening" : "Ask by voice"}
                    data-mic
                    className={cn(
                      "relative inline-flex size-8 items-center justify-center rounded-lg outline-none transition-colors",
                      "focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40",
                      listening
                        ? "voice-live bg-ai text-ai-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                  >
                    <Mic className="size-4" aria-hidden />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {listening ? "Stop listening" : "Ask by voice"}
                  <kbd className="ml-2 rounded-sm border border-border bg-background px-1 font-sans text-[10px] font-semibold text-muted-foreground">
                    ⌥ Space
                  </kbd>
                </TooltipContent>
              </Tooltip>
            )}
            {onTalk && (
              <TalkButton
                onClick={onTalk}
                disabled={disabled && !talking}
                active={talking}
              />
            )}
            <Button
              type="submit"
              size="icon-sm"
              aria-label="Send message"
              disabled={!value.trim() || disabled}
              className="rounded-lg"
            >
              <SendHorizontal className="size-4" aria-hidden />
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
