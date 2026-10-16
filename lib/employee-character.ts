/**
 * Digital Employees — the characters' pure half (SPEC-291).
 *
 * What a face does is decided here and drawn in `features/employees/
 * employee-character.tsx`; how it moves is CSS keyed on the data attributes this
 * module names. Kept framework-free so Vitest can prove the gaze maths and the
 * status → mood map without a DOM.
 */

import type { EmployeeKey, EmployeeStatus } from "@/types/employees";

/** The face's expression, keyed on `data-mood`. */
export type Mood = "working" | "needs_you" | "attention" | "idle" | "asleep";

export const MOODS: Record<Mood, { label: string; eyes: "open" | "half" | "shut"; hand: boolean }> = {
  working: { label: "working", eyes: "open", hand: false },
  needs_you: { label: "needs you", eyes: "open", hand: true },
  attention: { label: "needs attention", eyes: "open", hand: false },
  idle: { label: "idle", eyes: "half", hand: false },
  asleep: { label: "not started", eyes: "shut", hand: false },
};

/** SPEC-285's status → the face it wears. The backend owns the status. */
export function moodFor(status: EmployeeStatus): Mood {
  switch (status) {
    case "needs_you":
      return "needs_you";
    case "attention":
    case "unread":
      return "attention";
    case "idle":
      return "idle";
    case "not_started":
      return "asleep";
    default:
      return "working";
  }
}

/** Which prop each employee holds — the drawing keys on it. */
export type CharacterKind = "telescope" | "megaphone" | "target" | "ledger" | "clipboard" | "envelope" | "headset" | "stopwatch" | "star" | "menu" | "cloche";

export const CHARACTERS: Record<EmployeeKey, { kind: CharacterKind; does: string }> = {
  spotlight: { kind: "telescope", does: "searching for the pages worth writing" },
  social: { kind: "megaphone", does: "calling out to the store's followers" },
  ads: { kind: "target", does: "aiming spend at the campaigns that pay" },
  finance: { kind: "ledger", does: "keeping the books' unpaid bills in one place" },
  "report-fte": { kind: "clipboard", does: "writing up the figures" },
  email_marketing: { kind: "envelope", does: "writing to the store's customers at the moment they are due" },
  customer_support: { kind: "headset", does: "answering customers with the real order behind every reply" },
  ops_coach: { kind: "stopwatch", does: "timing every branch's day and naming the one thing to fix" },
  reputation: { kind: "star", does: "reading every guest's rating and answering the unhappy ones" },
  menu_engineer: { kind: "menu", does: "weighing every dish's sales and margin to tune the menu" },
  catering: { kind: "cloche", does: "pricing catering quotes from the branch's own menu" },
};

export interface Gaze {
  x: number;
  y: number;
}

export interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

export const GAZE_NEUTRAL: Gaze = { x: 0, y: 0 };

/**
 * Where a character looks, from the pointer's position and the character's own box:
 * a vector in [-1, 1] on each axis, full deflection once the pointer is `reach` boxes
 * away from the centre. Small deflection near the face, so the eyes do not snap.
 */
export function gazeFor(pointer: { x: number; y: number }, box: Box, reach = 4): Gaze {
  if (box.width <= 0 || box.height <= 0) return GAZE_NEUTRAL;
  const cx = box.left + box.width / 2;
  const cy = box.top + box.height / 2;
  const x = (pointer.x - cx) / (box.width * reach);
  const y = (pointer.y - cy) / (box.height * reach);
  return { x: clamp(x), y: clamp(y) };
}

function clamp(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.max(-1, Math.min(1, Math.round(value * 100) / 100));
}

/** The SVG's accessible name — the employee and its mood, nothing the chip does not say. */
export function characterLabel(name: string, mood: Mood): string {
  return `${name} — ${MOODS[mood].label}`;
}
