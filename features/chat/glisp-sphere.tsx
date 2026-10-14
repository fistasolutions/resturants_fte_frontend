"use client";

import { useEffect, useRef } from "react";

import { useTheme } from "@/components/theme-provider";
import {
  drawSphere,
  easeWeights,
  motionFor,
  targetWeights,
  type SphereTone,
  type Weights,
} from "@/lib/glisp-sphere";
import { cn } from "@/lib/utils";
import type { VoiceState } from "@/lib/voice-turn";

interface GlispSphereProps {
  state: VoiceState;
  /** The live signal 0..1 — read every frame through the ref so the sphere
   * follows the sound without re-rendering React. */
  levelRef: React.RefObject<number>;
  size: number;
  className?: string;
  onClick?: () => void;
  label?: string;
}

/**
 * The Glisp orb (SPEC-275): the canvas, its clock and the crossfade of its four
 * states. Motion here is the signal itself — the microphone or the reply's
 * audio — never a decoration that plays on load (root Rule 9); at rest the
 * insides only drift. The marble draws itself for the stage it is on.
 */
export function GlispSphere({ state, levelRef, size, className, onClick, label }: GlispSphereProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef(state);
  const { resolvedTheme } = useTheme();
  const tone: SphereTone = resolvedTheme === "dark" ? "dark" : "light";
  const toneRef = useRef(tone);
  useEffect(() => {
    stateRef.current = state;
    toneRef.current = tone;
  }, [state, tone]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    let frame = 0;
    let last = performance.now();
    let clock = 0;
    let smoothed = 0;
    let weights: Weights = targetWeights(stateRef.current);
    const tick = (now: number) => {
      // a frame's timestamp can precede the effect's clock — never step backwards
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
      last = now;
      // ease the level so a single loud chunk does not jerk the insides, integrate
      // the pace so a change of state never makes the flow jump, and cross-fade
      // the layers so the state itself never pops
      smoothed += (levelRef.current - smoothed) * 0.25;
      clock += dt * motionFor(stateRef.current, smoothed).speed;
      weights = easeWeights(weights, targetWeights(stateRef.current), dt);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawSphere(ctx, size, clock, weights, smoothed, toneRef.current, stateRef.current);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [size, levelRef]);

  const inner = (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size }}
      className="block"
      role={onClick ? undefined : "img"}
      aria-label={onClick ? undefined : (label ?? "Glisp")}
    />
  );
  if (!onClick) return <div className={cn("shrink-0", className)}>{inner}</div>;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label ?? "Glisp"}
      className={cn("shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring", className)}
      data-glisp-sphere
      data-state={state}
    >
      {inner}
    </button>
  );
}
