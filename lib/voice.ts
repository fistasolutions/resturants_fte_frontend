/**
 * Ask by voice (SPEC-254): the pure half — how dictated words join what was
 * typed, what a recognition failure says, the Voice replies preference, and the
 * keyboard toggle. The browser APIs live in `features/chat/use-dictation.ts`.
 */

/** Dictated words go after whatever was typed, with exactly one space between. */
export function appendDictation(existing: string, spoken: string): string {
  const words = spoken.replace(/\s+/g, " ").trim();
  if (!words) return existing;
  const base = existing.replace(/\s+$/, "");
  return base ? `${base} ${words}` : words;
}

/** The message for a `SpeechRecognitionErrorEvent.error`; null for the codes
 * that are not the owner's problem (a pause, a cancel). */
export function dictationFailure(code: string): string | null {
  switch (code) {
    case "not-allowed":
    case "service-not-allowed":
      return "Microphone blocked — allow it in the browser's site settings.";
    case "audio-capture":
      return "No microphone found.";
    case "network":
      return "Speech recognition needs a network connection.";
    case "language-not-supported":
      return "This language is not supported for dictation.";
    default:
      return null; // "no-speech", "aborted", and anything else: end quietly
  }
}

// Keeps the pre-rename prefix on purpose (SPEC-337): a new key would reset every saved choice.
export const VOICE_REPLIES_KEY = "ecommerce-fte.chat.voice-replies";

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

/** Off by default; a stored "1" turns it on. */
export function readVoiceReplies(): boolean {
  try {
    return storage()?.getItem(VOICE_REPLIES_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeVoiceReplies(on: boolean): void {
  try {
    const store = storage();
    if (!store) return;
    if (on) store.setItem(VOICE_REPLIES_KEY, "1");
    else store.removeItem(VOICE_REPLIES_KEY);
  } catch {
    // Storage blocked — the toggle still works for this page life.
  }
}

/** `⌥ Space` (Alt+Space) toggles dictation while the message box has focus. */
export function isDictationShortcut(event: {
  key: string;
  altKey: boolean;
  metaKey: boolean;
  ctrlKey: boolean;
}): boolean {
  return event.altKey && !event.metaKey && !event.ctrlKey && (event.key === " " || event.key === "Spacebar");
}
