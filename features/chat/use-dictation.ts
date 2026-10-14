"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

import { dictationFailure } from "@/lib/voice";

// The DOM lib does not type the Web Speech recogniser; this is the slice used here.
interface RecognitionAlternative {
  transcript: string;
}
interface RecognitionResult {
  isFinal: boolean;
  readonly length: number;
  [index: number]: RecognitionAlternative | undefined;
}
interface RecognitionResultEvent {
  resultIndex: number;
  results: { readonly length: number; [index: number]: RecognitionResult };
}
interface RecognitionErrorEvent {
  error: string;
}
interface Recognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: RecognitionResultEvent) => void) | null;
  onerror: ((event: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

/** The browser's recogniser, under either name; null where there is none. */
type RecognitionCtor = new () => Recognition;

function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function subscribeNever(): () => void {
  return () => {};
}

/** How long a failure message stays in the strip. */
const FAILURE_MS = 4000;

export interface Dictation {
  /** The browser has a speech engine — the mic renders only then. */
  supported: boolean;
  listening: boolean;
  /** The phrase still being recognised, shown in grey. */
  interim: string;
  /** A failure the owner can act on, for a moment. */
  error: string | null;
  /** Start; `onWords` fires with each confirmed phrase. */
  start: (onWords: (words: string) => void) => void;
  /** End now; confirmed words stay. */
  stop: () => void;
  /** End now and drop the phrase in progress. */
  cancel: () => void;
}

/**
 * Dictation into the composer (SPEC-254): the browser's `SpeechRecognition`,
 * continuous, with interim results. Nothing leaves the browser through this
 * hook; what the engine itself does with audio is the browser's own contract.
 */
export function useDictation(): Dictation {
  const supported = useSyncExternalStore(subscribeNever, () => recognitionCtor() !== null, () => false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recogniser = useRef<Recognition | null>(null);
  const failureTimer = useRef<number | null>(null);

  const teardown = useCallback(() => {
    recogniser.current = null;
    setListening(false);
    setInterim("");
  }, []);

  useEffect(() => {
    return () => {
      recogniser.current?.abort();
      if (failureTimer.current !== null) window.clearTimeout(failureTimer.current);
    };
  }, []);

  const showFailure = useCallback((message: string) => {
    setError(message);
    if (failureTimer.current !== null) window.clearTimeout(failureTimer.current);
    failureTimer.current = window.setTimeout(() => setError(null), FAILURE_MS);
  }, []);

  const start = useCallback(
    (onWords: (words: string) => void) => {
      const Ctor = recognitionCtor();
      if (!Ctor || recogniser.current) return;
      const rec = new Ctor();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = typeof navigator !== "undefined" && navigator.language ? navigator.language : "en-US";
      rec.onresult = (event: RecognitionResultEvent) => {
        let pending = "";
        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          const result = event.results[index];
          const text = result[0]?.transcript ?? "";
          if (result.isFinal) onWords(text);
          else pending += text;
        }
        setInterim(pending.trim());
      };
      rec.onerror = (event: RecognitionErrorEvent) => {
        const message = dictationFailure(event.error);
        if (message) showFailure(message);
      };
      rec.onend = teardown;
      recogniser.current = rec;
      setError(null);
      setInterim("");
      setListening(true);
      try {
        rec.start();
      } catch {
        teardown();
      }
    },
    [showFailure, teardown],
  );

  const stop = useCallback(() => {
    recogniser.current?.stop();
  }, []);

  const cancel = useCallback(() => {
    recogniser.current?.abort();
    teardown();
  }, [teardown]);

  return { supported, listening, interim, error, start, stop, cancel };
}
