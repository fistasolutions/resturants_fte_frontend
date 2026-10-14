"use client";

import { useEffect, useId, useRef } from "react";
import { Keyboard, Mic, MicOff, X } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { VoiceWave } from "@/features/chat/voice-wave";
import { cn } from "@/lib/utils";
import { consolePath, micCentre, scoopCentreY, type ConsoleShape } from "@/lib/voice-console";
import type { VoiceState } from "@/lib/voice-turn";

interface VoiceConsoleProps {
  shape: ConsoleShape;
  state: VoiceState;
  /** The tool's own status while thinking, when the line names one. */
  status: string | null;
  levelRef: React.RefObject<number>;
  muted: boolean;
  /** The owner's words, as heard; Glisp's words so far; a hint or an error. */
  transcript: string | null;
  reply: string | null;
  hint: string | null;
  hintTone?: "muted" | "warning";
  onMute: () => void;
  onKeyboard: () => void;
  onEnd: () => void;
  /** How far the console rises under the orb so the ball sits in the scoop
   * (negative margin, px) — `overlapFor(shape, orbSize)`. */
  overlap: number;
}

/** The console rises under the orb until the scoop's arc is centred on the
 * ball — the gap around it is then even all the way round. */
export function overlapFor(shape: ConsoleShape, orbSize: number): number {
  return -(orbSize / 2 + scoopCentreY(shape));
}

/** What every control under the orb shares: a round coin that lifts on hover. */
const COIN =
  "inline-flex items-center justify-center rounded-full outline-none transition-[transform,box-shadow,background-color] duration-200 hover:-translate-y-0.5 active:translate-y-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

function stateLine(state: VoiceState, status: string | null): string {
  switch (state) {
    case "listening":
      return "Listening…";
    case "thinking":
      return status ?? "Reading the store…";
    case "speaking":
      return "Speaking…";
    case "connecting":
      return "Opening the line…";
    default:
      return "Line closed";
  }
}

/**
 * The console under the orb (SPEC-276): the glass frame that scoops around the
 * ball and holds the mic in its tab; the state line between two lights; the
 * waveform; the words, scrolling with no scrollbar; the keyboard and End hanging
 * below its foot. Drawn at the size it is given — never stretched.
 */
export function VoiceConsole({
  shape,
  state,
  status,
  levelRef,
  muted,
  transcript,
  reply,
  hint,
  hintTone = "muted",
  onMute,
  onKeyboard,
  onEnd,
  overlap,
}: VoiceConsoleProps) {
  const shadowId = useId();
  const path = consolePath(shape);
  const words = useRef<HTMLDivElement>(null);
  const follow = useRef(true);
  const mic = micCentre(shape);
  const foot = shape.height - shape.inset - shape.tabDepth;

  // Keep the newest line in view while a reply streams — unless the owner has
  // scrolled up to re-read, in which case the box stays where they put it.
  useEffect(() => {
    const el = words.current;
    if (el && follow.current) el.scrollTop = el.scrollHeight;
  }, [reply, transcript, hint]);

  function onScroll() {
    const el = words.current;
    if (!el) return;
    follow.current = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
  }

  const live = state === "listening" || state === "speaking" || state === "thinking";

  return (
    <div
      className="relative shrink-0"
      style={{ width: shape.width, height: shape.height, marginTop: overlap }}
      data-voice-console
      data-state={state}
    >
      {/* the frame is glass: its shadow, the stage blurred through it, a hairline edge */}
      <svg
        viewBox={`0 0 ${shape.width} ${shape.height}`}
        width={shape.width}
        height={shape.height}
        className="absolute inset-0 overflow-visible"
        aria-hidden
      >
        <defs>
          <filter id={shadowId} x="-15%" y="-15%" width="130%" height="140%">
            <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="var(--foreground)" floodOpacity={0.08} />
          </filter>
        </defs>
        <path d={path} fill="var(--card)" fillOpacity={0.3} filter={`url(#${shadowId})`} />
      </svg>
      <div className="absolute inset-0 bg-card/45 backdrop-blur-xl" style={{ clipPath: `path("${path}")` }} aria-hidden />
      <svg
        viewBox={`0 0 ${shape.width} ${shape.height}`}
        width={shape.width}
        height={shape.height}
        className="absolute inset-0 overflow-visible"
        aria-hidden
      >
        <path d={path} fill="none" stroke="var(--border)" strokeOpacity={0.9} strokeWidth={1} />
      </svg>

      {/* inside the frame: the state line, the waveform, the words */}
      <div
        className="absolute flex flex-col items-center text-center"
        style={{
          left: shape.inset + 14,
          right: shape.inset + 14,
          top: scoopCentreY(shape) + shape.scoop + 16,
          bottom: shape.tabDepth + shape.inset + 12,
        }}
      >
        <div className="inline-flex items-center gap-4 text-base font-semibold text-foreground" data-voice-state-line>
          <span className={cn("size-[7px] rounded-full bg-brand shadow-[0_0_8px_var(--brand)]", live && "animate-pulse")} aria-hidden />
          {stateLine(state, status)}
          <span
            className={cn("size-[7px] rounded-full bg-brand shadow-[0_0_8px_var(--brand)]", live && "animate-pulse [animation-delay:-.7s]")}
            aria-hidden
          />
        </div>
        <div className="mt-2 flex h-6 items-center justify-center">
          {state === "listening" && <VoiceWave levelRef={levelRef} size="small" />}
          {state === "speaking" && <VoiceWave levelRef={levelRef} size="wide" />}
          {state === "thinking" && (
            <span
              className="size-5 animate-spin rounded-full border-2 border-ai/20 border-t-ai [animation-duration:1.4s]"
              aria-hidden
            />
          )}
        </div>
        <div
          ref={words}
          onScroll={onScroll}
          className="scrollbar-none mt-2 min-h-0 w-full flex-1 overflow-y-auto overscroll-contain px-1 [mask-image:linear-gradient(180deg,#000_0,#000_78%,transparent_100%)]"
          aria-live="polite"
          data-voice-captions
        >
          {transcript && (
            <p className="mb-1 text-xs text-muted-foreground" data-voice-you>
              You: <span className="text-foreground">“{transcript}”</span>
            </p>
          )}
          {reply ? (
            <p className="text-[14px] leading-[1.45] font-medium text-foreground" data-voice-reply>
              {reply}
            </p>
          ) : hint ? (
            <p className={cn("text-[13px]", hintTone === "warning" ? "text-warning" : "text-muted-foreground")} data-voice-hint>
              {hint}
            </p>
          ) : null}
        </div>
      </div>

      {/* the mic coin in the tab — the primary control, filled while live */}
      <div className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: mic.x, top: mic.y }}>
        {!muted && (
          <span
            className="pointer-events-none absolute -inset-1 animate-pulse rounded-full bg-ai/15 [animation-duration:2.4s]"
            aria-hidden
          />
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onMute}
              aria-label={muted ? "Unmute" : "Mute"}
              aria-pressed={muted}
              data-voice-mic
              className={cn(
                COIN,
                "relative size-19",
                muted
                  ? "border border-border bg-muted text-muted-foreground shadow-xs"
                  : "bg-linear-to-b from-ai to-ai/85 text-background shadow-sm shadow-ai/30",
              )}
            >
              {muted ? <MicOff className="size-8" aria-hidden /> : <Mic className="size-8" aria-hidden />}
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">{muted ? "Unmute" : "Mute"}</TooltipContent>
        </Tooltip>
      </div>

      {/* the keyboard and End coins, hanging below the frame's foot corners */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={onKeyboard}
            aria-label="Type instead"
            className={cn(
              COIN,
              "absolute size-11 border border-border/70 bg-card/70 text-ai shadow-sm backdrop-blur-md hover:bg-card",
            )}
            style={{ left: shape.inset + 20, top: foot + 10 }}
          >
            <Keyboard className="size-[18px]" aria-hidden />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top">Type instead</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={onEnd}
            aria-label="End"
            className={cn(
              COIN,
              "absolute size-11 bg-foreground text-background shadow-md shadow-foreground/20 hover:bg-foreground/90",
            )}
            style={{ right: shape.inset + 20, top: foot + 10 }}
          >
            <X className="size-[18px]" aria-hidden />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top">End</TooltipContent>
      </Tooltip>
    </div>
  );
}
