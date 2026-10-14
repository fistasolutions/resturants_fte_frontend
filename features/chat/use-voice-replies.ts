"use client";

import { useSyncExternalStore } from "react";

import { readVoiceReplies, writeVoiceReplies } from "@/lib/voice";

/** SPEC-254: the Voice replies toggle, shared by every composer and the send
 * path that reads a fresh answer aloud. Remembered per browser. */
let on: boolean | null = null;
const listeners = new Set<() => void>();

function current(): boolean {
  if (on === null) on = readVoiceReplies();
  return on;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Read outside React (the send path). */
export function voiceRepliesOn(): boolean {
  return current();
}

export function setVoiceReplies(next: boolean): void {
  on = next;
  writeVoiceReplies(next);
  listeners.forEach((listener) => listener());
}

export function useVoiceReplies(): [boolean, (next: boolean) => void] {
  const value = useSyncExternalStore(subscribe, current, () => false);
  return [value, setVoiceReplies];
}
