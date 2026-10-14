"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

interface VoiceWaveProps {
  /** The live level 0..1 — the microphone while listening, the reply while speaking. */
  levelRef: React.RefObject<number>;
  /** "small" under the orb while listening (18 bars); "wide" while speaking (44). */
  size: "small" | "wide";
  className?: string;
}

/** Each bar's share of the level, so the strip reads as a voice and not a meter. */
function pattern(i: number, bars: number): number {
  const t = i / (bars - 1);
  const envelope = Math.sin(t * Math.PI) * 0.6 + 0.4;
  return envelope * (0.45 + 0.55 * Math.abs(Math.sin(i * 0.9) * Math.cos(i * 0.37)));
}

/**
 * The waveform under the orb (SPEC-275): bars that follow the signal, one
 * animation frame, heights written straight to the DOM — nothing re-renders
 * while a voice is live. Quiet when the signal is quiet: no idle wiggle.
 */
export function VoiceWave({ levelRef, size, className }: VoiceWaveProps) {
  const bars = size === "wide" ? 44 : 18;
  const refs = useRef<Array<HTMLSpanElement | null>>([]);
  const smooth = useRef(0);

  useEffect(() => {
    let frame = 0;
    const tick = () => {
      smooth.current += (levelRef.current - smooth.current) * 0.3;
      const level = Math.min(1, smooth.current * 1.4);
      const max = size === "wide" ? 26 : 20;
      refs.current.forEach((bar, i) => {
        if (!bar) return;
        const h = 3 + max * level * pattern(i, bars);
        bar.style.height = `${h.toFixed(1)}px`;
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [levelRef, bars, size]);

  return (
    <div
      className={cn("flex items-center", size === "wide" ? "h-7 gap-0.5" : "h-5 gap-[3px]", className)}
      aria-hidden
      data-voice-wave={size}
    >
      {Array.from({ length: bars }, (_, i) => (
        <span
          key={i}
          ref={(node) => {
            refs.current[i] = node;
          }}
          className={cn("block rounded-full bg-ai/80 shadow-[0_0_6px_var(--ai)]", size === "wide" ? "w-[2.5px]" : "w-[3px]")}
          style={{ height: 3 }}
        />
      ))}
    </div>
  );
}
