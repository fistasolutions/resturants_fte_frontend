"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { GlispSphere } from "@/features/chat/glisp-sphere";
import type { ChatSession } from "@/features/chat/use-chat-session";
import { useVoiceSession } from "@/features/chat/use-voice-session";
import { VoiceConsole, overlapFor } from "@/features/chat/voice-console";
import { useCan } from "@/hooks/use-can";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { CONSOLE_PAGE, CONSOLE_PANEL, fitConsole } from "@/lib/voice-console";
import { voiceStateLabel } from "@/lib/voice-turn";
import type { ChatPageContext } from "@/types/chat";

interface VoicePaneProps {
  /** Whose thread the turns land in. */
  session: ChatSession;
  context: ChatPageContext | null;
  /** Back to the thread (End, the keyboard, Esc). */
  onClose: () => void;
  /** "panel" fits the Ask Glisp sheet; "page" the chat page's conversation area. */
  variant: "panel" | "page";
}

/**
 * Talk to Glisp, inside the surface (SPEC-271 → SPEC-276): the stage edge to
 * edge, the orb, and the console it sits into — the state line, the waveform,
 * the words, the mic in the tab, keyboard and End below. Opens the call and the
 * microphone at once; unmounting (or End) hangs up. Every exchange lands in the
 * session's thread as ordinary cards.
 */
export function VoicePane({ session, context, onClose, variant }: VoicePaneProps) {
  const voice = useVoiceSession(session, context);
  const { start, stop } = voice;
  const mobile = useIsMobile();
  // SPEC-358: a role without chat never opens the line; the pane says why instead.
  const can = useCan();
  const chatGate = can("chat.use");
  const chatAllowed = chatGate.allowed;
  // The microphone is released on a real unmount only. React's development
  // double-invoke unmounts and remounts at once; a deferred stop that the
  // remount cancels keeps it to one capture (a second one would get no audio
  // from a fake device and would double the permission prompt on a real one).
  const pendingStop = useRef<number | null>(null);
  // The console is drawn at its preset width when the stage has the room, and
  // narrowed to the stage (a phone, a slim panel) when it does not.
  const stage = useRef<HTMLElement>(null);
  const [stageWidth, setStageWidth] = useState<number | null>(null);

  useLayoutEffect(() => {
    const el = stage.current;
    if (!el) return;
    const measure = () => setStageWidth(el.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (pendingStop.current !== null) {
      window.clearTimeout(pendingStop.current);
      pendingStop.current = null;
    }
    if (!chatAllowed) return;
    void start();
    return () => {
      pendingStop.current = window.setTimeout(() => {
        pendingStop.current = null;
        stop();
      }, 60);
    };
  }, [start, stop, chatAllowed]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const big = variant === "page" && !mobile;
  const preset = big ? CONSOLE_PAGE : CONSOLE_PANEL;
  const shape = stageWidth === null ? preset : fitConsole(preset, stageWidth - 16);
  const orbSize = big ? 300 : 220;
  const label = voiceStateLabel(voice.state, voice.status, voice.muted);
  const lineHint = !voice.supported
    ? "This browser has no microphone support — Chrome, Edge and Safari do."
    : voice.error
      ? voice.error
      : voice.state === "listening"
        ? "Just talk — Glisp hears you as you speak. Talk over it any time."
        : voice.state === "connecting"
          ? "Glisp is connecting — a second or two."
          : voice.state === "idle"
            ? "The line is closed — tap End and try again."
            : null;
  const hint = chatAllowed ? lineHint : chatGate.reason;

  return (
    <section
      ref={stage}
      aria-label="Talk to Glisp"
      data-voice-pane={variant}
      data-state={voice.state}
      className="voice-stage relative flex min-h-0 flex-1 flex-col items-center overflow-y-auto pt-3 pb-4 text-foreground"
    >
      <span
        className={cn(
          "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-card/70 font-semibold text-foreground backdrop-blur-sm",
          big ? "absolute top-4 right-4 px-2.5 py-1 text-[11px]" : "px-2.5 py-0.5 text-[10.5px] tracking-wide uppercase",
        )}
        data-voice-state-pill
      >
        <span className={cn("size-1.5 rounded-full bg-brand", voice.state !== "idle" && "animate-pulse")} aria-hidden />
        {label}
      </span>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
        {/* the orb sits into the console's scoop: the console starts under it */}
        <GlispSphere state={voice.state} levelRef={voice.levelRef} size={orbSize} label="Glisp" className="relative z-10" />
        <VoiceConsole
          shape={shape}
          state={voice.state}
          status={voice.status}
          levelRef={voice.levelRef}
          muted={voice.muted}
          transcript={voice.transcript}
          reply={voice.replyText}
          hint={hint}
          hintTone={voice.error ? "warning" : "muted"}
          onMute={voice.toggleMute}
          onKeyboard={onClose}
          onEnd={onClose}
          overlap={overlapFor(shape, orbSize)}
        />
      </div>
    </section>
  );
}
