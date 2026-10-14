"use client";

import { useEffect, type RefObject } from "react";

import { gazeFor } from "@/lib/employee-character";

const REDUCE_MOTION = "(prefers-reduced-motion: reduce)";

/**
 * Every character inside `root` looks at the pointer (SPEC-291). One `pointermove`
 * listener on the window, throttled to a frame, writing `--gx` / `--gy` straight onto
 * each `[data-character]` element — React never re-renders for a mouse move. Stands
 * down entirely under `prefers-reduced-motion: reduce`, and resets to centre when the
 * pointer leaves the window.
 */
export function useGaze(root: RefObject<HTMLElement | null>, ready: boolean): void {
  useEffect(() => {
    // `ready` flips when the cards mount (the view renders a skeleton first, so the
    // ref is empty on the first effect); without it this would attach to nothing.
    const element = root.current;
    if (!ready || !element || typeof window === "undefined") return;
    if (window.matchMedia?.(REDUCE_MOTION).matches) return;

    let frame = 0;
    let last: { x: number; y: number } | null = null;

    const paint = () => {
      frame = 0;
      const characters = element.querySelectorAll<HTMLElement>("[data-character]");
      for (const character of characters) {
        const gaze = last ? gazeFor(last, character.getBoundingClientRect()) : { x: 0, y: 0 };
        character.style.setProperty("--gx", String(gaze.x));
        character.style.setProperty("--gy", String(gaze.y));
      }
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(paint);
    };
    const onMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      last = { x: event.clientX, y: event.clientY };
      schedule();
    };
    const onLeave = () => {
      last = null;
      schedule();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [root, ready]);
}
