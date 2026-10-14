"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  AlignLeft,
  ArrowRight,
  BarChart3,
  Check,
  Copy,
  Eye,
  MessageCircle,
  Pin,
  PinOff,
  RefreshCw,
  Square,
  ThumbsDown,
  ThumbsUp,
  Volume2,
} from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AnswerChart } from "@/features/chat/answer-chart";
import { ChatMarkdown } from "@/features/chat/chat-markdown";
import { useAnswerView } from "@/features/chat/use-answer-view";
import { takeaway } from "@/lib/answer-visual";
import { StreamingMarkdown } from "@/features/chat/streaming-markdown";
import { TrustFooter } from "@/features/chat/trust-footer";
import { useReadAloud } from "@/features/chat/use-read-aloud";
import { useApiQuery } from "@/hooks/use-api-query";
import { GlispIcon } from "@/components/shared/glisp-icon";
import { answerLinks, chipPrefix, groundedPill, runtimeLabel, type PillTone } from "@/lib/answer-card";
import { justCommitted } from "@/lib/glisp-motion";
import { markdownToPlainText } from "@/lib/markdown-plain";
import { chatQueries } from "@/lib/queries/chat";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types/chat";

const PILL_TONE: Record<PillTone, string> = {
  ok: "border-success/30 bg-success/10 text-success",
  muted: "border-border bg-muted text-muted-foreground",
  working: "border-ai/30 bg-ai/10 text-ai",
};

/** A quiet icon button for the card's footer. */
function FooterAction({
  label,
  icon: Icon,
  onClick,
  disabled,
  active,
  activeLabel,
}: {
  label: string;
  icon: typeof Copy;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  activeLabel?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          aria-label={active && activeLabel ? activeLabel : label}
          aria-pressed={active === undefined ? undefined : active}
          className={cn(
            "inline-flex size-7 items-center justify-center rounded-md transition-colors outline-none",
            "hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring",
            "disabled:pointer-events-none disabled:opacity-40",
            active ? "text-foreground" : "text-muted-foreground",
          )}
        >
          <Icon className="size-3.5" aria-hidden />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{active && activeLabel ? activeLabel : label}</TooltipContent>
    </Tooltip>
  );
}

interface AnswerCardProps {
  /** The stored reply. Omit while a reply is still streaming. */
  message?: ChatMessage;
  /** The live text while streaming (SPEC-016); when set the card has no footer yet. */
  streamingContent?: string;
  /** What is answering the live stream, when overridden (SPEC-238). */
  streamingModel?: { model: string; temperature: number | null; overridden: boolean } | null;
  onRegenerate?: (message: ChatMessage) => void;
  onRate?: (message: ChatMessage, value: 1 | -1) => void;
  /** Pin / unpin this answer to the top of its thread (SPEC-249). */
  onPin?: (message: ChatMessage, pinned: boolean) => void;
  /** Fires when an action button navigates (SPEC-259) — the panel closes itself. */
  onNavigate?: () => void;
  /** Regenerate and rating are disabled while another reply is in flight. */
  busy?: boolean;
  /** Tighter paddings for the Ask Glisp panel. */
  compact?: boolean;
  /**
   * Who is answering, drawn in the grounded pill (SPEC-352): Glisp's mark by default, an
   * employee's own icon in that employee's chat.
   */
  mark?: ReactNode;
  /** What this turn carries beyond the shared blocks — an employee's own card. */
  children?: ReactNode;
}

/**
 * The answer card (SPEC-240): one bordered card per assistant turn — a runtime
 * strip and a grounded pill on top, the Markdown reply, source chips that open
 * real routes, and a footer with copy · read aloud · regenerate on the left and
 * 👍 👎 on the right. Rendered by the chat page and the Ask Glisp panel alike.
 *
 * SPEC-352: it is every chat's assistant turn — Glisp and each digital employee render
 * through it, so a table, a chart, the acting page and the receipt look the same wherever
 * an answer appears. Regenerate, rating and pinning show only when their handler is given.
 */
export function AnswerCard({
  message,
  streamingContent,
  streamingModel,
  onRegenerate,
  onRate,
  onPin,
  onNavigate,
  busy = false,
  compact = false,
  mark,
  children,
}: AnswerCardProps) {
  const models = useApiQuery(chatQueries.models());
  const defaultModel = models.data?.default ?? null;
  const streaming = message === undefined;
  const model = streaming
    ? streamingModel?.overridden
      ? streamingModel.model
      : null
    : (message.model ?? null);
  const temperature = streaming
    ? streamingModel?.overridden
      ? streamingModel.temperature
      : null
    : (message.temperature ?? null);
  const pill = groundedPill(message?.sources, streaming);
  // SPEC-252: the pill's mark pops once for a reply that finished in this session —
  // computed on mount, so a history load shows still marks (root Rule 9).
  const [pop] = useState(() => !streaming && justCommitted(message?.createdAt, Date.now()));
  const content = message?.content ?? streamingContent ?? "";
  const chips = message?.sources?.chips ?? [];
  // SPEC-257: a chart when the tools' numbers allow one; the owner's choice is shared.
  const visual = message?.sources?.visual ?? null;
  // SPEC-352: the acting pages and the screens an answer points to, as one row.
  const actions = answerLinks(message?.sources);
  const watch = message?.sources?.watch ?? null;
  const [view, setView] = useAnswerView();
  const showChart = visual !== null && !streaming && view === "chart";

  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<number | null>(null);
  const readAloud = useReadAloud(message?.id ?? null);

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
      // Clipboard unavailable (permissions / insecure context) — leave state as is.
    }
  }

  const pad = compact ? "px-3" : "px-4";

  return (
    <article
      id={message ? `message-${message.id}` : undefined}
      className={cn(
        "rounded-card border bg-card text-card-foreground scroll-mt-24 transition-shadow",
        message?.pinnedAt && "border-ai/40",
      )}
      aria-live={streaming ? "polite" : undefined}
      data-answer-card
      data-pinned={message?.pinnedAt ? "true" : undefined}
    >
      <header
        className={cn(
          "flex flex-wrap items-center justify-between gap-2 border-b py-2 text-[11px]",
          pad,
        )}
      >
        <span className="truncate text-muted-foreground">
          {runtimeLabel(model, temperature, defaultModel)}
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1 rounded-md border px-1.5 py-0.5 font-medium",
              PILL_TONE[pill.tone],
            )}
          >
            {mark ?? (
              <GlispIcon
                className="size-3"
                state={streaming ? "reading" : undefined}
                motion={pop ? "pop" : undefined}
                aria-hidden
              />
            )}
            {pill.label}
          </span>
          {visual && !streaming && (
            <span
              role="group"
              aria-label="Answer view"
              data-answer-view-toggle
              className="inline-flex overflow-hidden rounded-md border"
            >
              <button
                type="button"
                aria-label="Show as text"
                aria-pressed={view === "text"}
                onClick={() => setView("text")}
                className={cn(
                  "inline-flex size-6 items-center justify-center outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                  view === "text" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <AlignLeft className="size-3.5" aria-hidden />
              </button>
              <button
                type="button"
                aria-label="Show as chart"
                aria-pressed={view === "chart"}
                onClick={() => setView("chart")}
                className={cn(
                  "inline-flex size-6 items-center justify-center border-l outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                  view === "chart" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <BarChart3 className="size-3.5" aria-hidden />
              </button>
            </span>
          )}
        </span>
      </header>

      <div className={cn("py-3", pad)}>
        {streaming ? (
          <StreamingMarkdown content={content} />
        ) : showChart && visual ? (
          // The takeaway stays on screen; the chart replaces the rest of the prose.
          <div className="space-y-3">
            {takeaway(content) && <ChatMarkdown content={takeaway(content)} lead />}
            <AnswerChart visual={visual} compact={compact} />
          </div>
        ) : (
          <ChatMarkdown content={content} lead />
        )}
      </div>

      {children ? <div className={cn("pb-3", pad)}>{children}</div> : null}

      {chips.length > 0 && (
        <div className={cn("flex flex-wrap gap-1.5 pb-3", pad)}>
          {chips.map((chip) => (
            <Link
              key={chip.href}
              href={chip.href}
              className="inline-flex max-w-full items-center gap-1 rounded-md border bg-background px-2 py-1 text-[11px] transition-colors hover:border-foreground/25 hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring outline-none"
            >
              <span className="text-muted-foreground">{chipPrefix(chip.kind)}</span>
              <span className="truncate font-medium">{chip.label}</span>
            </Link>
          ))}
        </div>
      )}

      {!streaming && watch && (
        // SPEC-262: the watch this answer set — the rule, when it is checked, who is told.
        <div className={cn("pb-3", pad)} data-answer-watch>
          <div className="rounded-lg border border-ai/35 bg-ai/5 px-3 py-2.5 text-xs">
            <div className="mb-1.5 flex items-center gap-1.5 font-semibold text-ai">
              <Eye className="size-3.5" aria-hidden />
              Watching
            </div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
              <dt className="text-muted-foreground">Rule</dt>
              <dd className="font-medium">{watch.rule}</dd>
              <dt className="text-muted-foreground">Now</dt>
              <dd className="font-medium">{watch.current}</dd>
              <dt className="text-muted-foreground">Checked</dt>
              <dd>Every sync, about every 15 minutes</dd>
              <dt className="text-muted-foreground">Tell</dt>
              <dd>
                {[watch.notify_nudge ? "Nudge on the button" : null, watch.notify_email ? `Email: ${watch.notify_email}` : null]
                  .filter(Boolean)
                  .join(" · ") || "Nobody"}
              </dd>
            </dl>
            <Link
              href="/settings/watching"
              onClick={onNavigate}
              className="mt-2 inline-flex items-center gap-1 font-medium text-foreground underline-offset-2 hover:underline"
            >
              Manage in Settings → Watching
              <ArrowRight className="size-3" aria-hidden />
            </Link>
          </div>
        </div>
      )}

      {!streaming && actions.length > 0 && (
        // SPEC-259: the answer ends with the page that acts on it.
        <div className={cn("flex flex-wrap items-center gap-2 pb-3", pad)} data-answer-actions>
          {actions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              prefetch={false}
              onClick={onNavigate}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                action.kind === "send"
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "border bg-background text-foreground hover:bg-accent",
              )}
            >
              {action.label}
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          ))}
        </div>
      )}

      {!streaming && message.sources && (
        // SPEC-264: the receipt — freshness and the tools' own figures.
        <TrustFooter sources={message.sources} compact={compact} />
      )}

      {!streaming && (
        <footer className={cn("flex items-center justify-between gap-2 border-t py-1.5", pad)}>
          <div className="flex items-center gap-0.5">
            <FooterAction
              label={copied ? "Copied" : "Copy"}
              icon={copied ? Check : Copy}
              onClick={() => void copy()}
            />
            <FooterAction
              label={readAloud.supported ? "Read aloud" : "Read aloud is not available in this browser"}
              activeLabel="Stop reading"
              icon={readAloud.speaking ? Square : Volume2}
              active={readAloud.speaking}
              disabled={!readAloud.supported}
              onClick={() =>
                readAloud.speaking ? readAloud.stop() : readAloud.speak(markdownToPlainText(content))
              }
            />
            {onRegenerate && (
              <FooterAction
                label="Regenerate"
                icon={RefreshCw}
                disabled={busy}
                onClick={() => onRegenerate(message)}
              />
            )}
            {onPin && (
              <FooterAction
                label="Pin this answer"
                activeLabel="Unpin this answer"
                icon={message.pinnedAt ? PinOff : Pin}
                active={Boolean(message.pinnedAt)}
                onClick={() => onPin(message, !message.pinnedAt)}
              />
            )}
          </div>
          {onRate && (
            <div className="flex items-center gap-0.5">
              <FooterAction
                label="Good answer"
                activeLabel="Rated good — click to clear"
                icon={ThumbsUp}
                active={message.feedback === 1}
                onClick={() => onRate(message, 1)}
              />
              <FooterAction
                label="Poor answer"
                activeLabel="Rated poor — click to clear"
                icon={ThumbsDown}
                active={message.feedback === -1}
                onClick={() => onRate(message, -1)}
              />
            </div>
          )}
        </footer>
      )}
      {streaming && (
        <div className={cn("flex items-center gap-1.5 border-t py-1.5 text-[11px] text-muted-foreground", pad)}>
          <MessageCircle className="size-3" aria-hidden />
          Writing…
        </div>
      )}
    </article>
  );
}
