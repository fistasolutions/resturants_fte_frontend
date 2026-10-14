# SPEC-254 — Ask by voice

**Date:** 2026-09-16 · **Repo:** frontend (no backend change) · **Status:** implemented
**Builds on:** `SPEC-240-chat-answer-card.md` (Read aloud), `SPEC-235-ask-ai-drawer.md`,
`SPEC-238` Patches (the two-row composer). Ideas document item 08; mockup approved
2026-09-16 — `ref/mockups/ask-by-voice.html`.

## Problem

Typing is the slow part of asking — on a phone especially. The browser already has a
speech engine (it powers Read aloud); dictation is the other half of it, and together
they make a question-and-answer loop with no keyboard.

## Behaviour

1. **A mic beside Send** in every composer (the `/chat` page and the Ask Glisp panel).
   Rendered only when the browser has `SpeechRecognition` (Chrome, Edge, Safari);
   absent — never greyed — elsewhere. Tooltip *Ask by voice*; `⌥ Space` toggles it
   while the message box has focus (Alt+Space on Windows).

2. **Listening.** Pressing the mic starts continuous recognition in the browser's
   language. The mic turns `--ai` with a soft pulsing ring (CSS only, only while
   listening — allowed motion, Rule 9); a *Listening* strip appears above the text with
   sound bars, the phrase still being recognised in grey, and the hints "pause to
   finish · tap the mic to stop · Esc cancels". Confirmed words are appended to the box
   (after whatever was typed, separated by a space); Send lights up as soon as there is
   text. A pause, the mic, or `Esc` ends it: the text stays to edit or send. Nothing
   leaves the browser.

3. **Failures say why.** Microphone blocked → *"Microphone blocked — allow it in the
   browser's site settings."*; no microphone → *"No microphone found."*; both shown in
   the strip for a moment, never a toast, never a crash. A "no speech" end is silent.

4. **Voice replies.** A toggle next to the model pill (`Switch`, label *Voice replies*)
   — when on, every reply is read aloud the moment it finishes, through the same
   Read aloud the answer card already has (its speaker shows the stop state, one
   click stops). Remembered per browser (`localStorage`). Off by default. Sending a new
   question stops any reading.

5. **One voice at a time.** Read aloud becomes a shared store so a card started by the
   toggle and a card started by its own button never talk over each other.

## Implementation

- `lib/voice.ts` — pure: `appendDictation(existing, spoken)`, `dictationFailure(code)`,
  `readVoiceReplies / writeVoiceReplies` (guarded storage), `isDictationShortcut(event)`.
- `features/chat/read-aloud-store.ts` — the one speaker (`speak(id, text)`, `stop()`,
  `speakingId`); `use-read-aloud.ts` reads it (same hook API as before, keyed by id).
- `features/chat/use-dictation.ts` — the `SpeechRecognition` wrapper: `supported`,
  `listening`, `interim`, `error`, `start`, `stop`, `cancel`.
- `features/chat/use-voice-replies.ts` — the toggle's shared state.
- `features/chat/chat-composer.tsx` — the mic, the strip, the toggle.
- `features/chat/use-chat-session.ts` — reads the reply aloud when the toggle is on.
- Docs: `lib/docs/content/chat.ts` "Ask by voice" section; overview conventions.

## Acceptance criteria

- [x] Mic present in both composers on a speech-capable browser; absent otherwise.
- [x] Press → listening state; words land in the box; pause / mic / Esc end it; Send is live.
- [x] Blocked mic shows the message; nothing breaks.
- [x] Voice replies on → the next reply is read aloud, card shows the stop state; off → silent; survives reload.
- [x] `lib/voice.ts` unit-tested; `npm test`, `tsc`, lint, `npm run build` green; docs updated.

## Manual verification checklist

1. Chrome, `/chat` → mic → speak "how is revenue this week" → words appear → pause → Send lit → Enter.
2. Same in the Ask Glisp panel on the Dashboard.
3. Block the mic in site settings → press mic → the message shows.
4. Voice replies on → ask → the answer is read; press the card's speaker → stops.
5. Safari on iPhone → mic present; Firefox → no mic.
