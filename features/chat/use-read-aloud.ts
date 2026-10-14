"use client";

import { useSyncExternalStore } from "react";

import {
  getSpeakingId,
  readAloudSupported,
  speakReadAloud,
  stopReadAloud,
  subscribeReadAloud,
} from "@/features/chat/read-aloud-store";

function subscribeNever(): () => void {
  return () => {};
}

/**
 * Browser speech synthesis for one answer (SPEC-240), on the shared speaker
 * (SPEC-254). `speak(text)` starts this message, `stop()` cancels; `speaking`
 * is true only while THIS message is the one being read. Leaving the thread
 * (select / new / delete, in `useChatSession`) stops the voice — a card's own
 * unmount does not, so React's dev-mode double effects cannot cut a reply short.
 */
export function useReadAloud(messageId: string | null) {
  const supported = useSyncExternalStore(subscribeNever, readAloudSupported, () => false);
  const speakingId = useSyncExternalStore(subscribeReadAloud, getSpeakingId, () => null);
  const speaking = messageId !== null && speakingId === messageId;

  function speak(text: string) {
    if (messageId === null) return;
    speakReadAloud(messageId, text);
  }

  return { supported, speaking, speak, stop: stopReadAloud };
}
