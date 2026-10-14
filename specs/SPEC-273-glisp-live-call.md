# SPEC-273 — Glisp live call: the pane is a phone line; Read aloud in Glisp's voice

**Date:** 2026-09-18 · **Repo:** frontend · **Status:** implemented
**Backend twin:** `SPEC-272-glisp-live-call.md`. Replaces SPEC-268's turn
(`sendVoiceTurn` / `useChatSession.speak`); keeps SPEC-271's pane, sphere and
crossfade.

## Behaviour

- **One open line.** Opening the voice pane opens a call (`POST /chat/live`, an
  SSE that stays open) and starts the microphone. The microphone streams
  continuously — every ~120 ms of audio goes up as it is captured — and the
  server decides when the owner has finished a sentence. No pause detection in
  the browser, no upload, no "sent" moment.
- **What you say appears the moment the line has heard it.** The `you` frames
  write the owner's words into the caption (Gemini delivers them at the end of
  the sentence; a vendor that transcribes incrementally updates the same line);
  the `delta` frames write Glisp's words as they are spoken; the `audio` frames
  play the moment they arrive, scheduled back to back. The state pill reads *Listening* → *Speaking*
  (first audio) → *Listening* (playback drained); a `status` frame ("Reading the
  store…") shows as *Thinking* while a tool runs.
- **Talk over Glisp to interrupt.** Sustained voice while Glisp speaks stops the
  playback at once and tells the server (`/interrupt`); the server's own
  interruption (`interrupted` frame) does the same from the other side.
- **Every exchange lands in the thread as cards** the moment the server stores it
  (the `turn` frame): the owner's words as the user bubble, Glisp's as an answer
  card with provenance and the trust footer — exactly as a typed turn.
- **Hanging up** (✕, the keyboard, Esc, a send from the box, unmount) aborts the
  SSE, which ends the call; the microphone is released.
- **Read aloud (the speaker on every answer card) is Glisp's voice.** The click
  unlocks the page's `AudioContext` inside the gesture (so iOS allows it), opens
  `POST /chat/speech` for the card's text and plays the PCM as it streams —
  scheduled chunk by chunk, so the first words play within a few seconds of the
  click rather than after the whole reading. The stop square, the "one speaker"
  rule and the Voice replies switch are unchanged — `read-aloud-store` just
  speaks differently. No `speechSynthesis` anywhere.
- **Uplink policy.** One audio POST in flight at a time; chunks captured while it
  is away are joined into the next POST (`LiveUplink`, pure) — a slow link makes
  bigger chunks, never a queue that grows without bound (a cap drops the oldest),
  and a joined chunk is sent in ≤ 1.5 s pieces, in order. Never `keepalive` on the
  audio POST: Chrome refuses a keepalive body over 64 KB, which is what silently
  cut the first live question to "How did".

## Implementation

- `services/chat.ts` — `openLiveCall(handlers, options)` (the SSE reader; resolves
  when the line closes), `sendLiveAudio`, `interruptLiveCall`, `endLiveCall`,
  `streamSpeech(text, onChunk)`; `sendVoiceTurn` removed.
- `lib/voice-turn.ts` — `LiveUplink` (coalescing queue with a cap), the level and
  PCM helpers kept; `TurnDetector` removed (the server detects turns).
- `features/chat/use-voice-session.ts` — the call: mic → uplink, SSE → captions /
  playback / thread; barge-in; `stop` hangs up.
- `features/chat/use-chat-session.ts` — `speak` replaced by `liveTurn(turn)`, which
  adds the two cards for a stored exchange (and starts the thread on the first).
- `features/chat/read-aloud-store.ts` — schedules the streamed `POST /chat/speech`
  PCM through a shared `AudioContext` unlocked on the click; `use-read-aloud.ts`
  unchanged in shape. `readAloudSupported` is now "has AudioContext".
- `features/chat/voice-pane.tsx` — copy for the line ("On the line", the live
  caption), `connecting` state.
- `lib/docs/content/chat.ts` — Talk to Glisp and Read aloud sections.

## Acceptance criteria

- [x] Opening the pane opens one `POST /chat/live` stream and audio POSTs begin at once; the pill shows *Listening* on the `listening` frame.
- [x] The owner's words appear in the caption the moment the line has heard them; Glisp's first audio plays within ~1 s of the end of the sentence (live measure in Verification).
- [x] Talking over Glisp stops playback within 350 ms and sends `/interrupt`.
- [x] A `turn` frame adds the user bubble and the answer card (with sources) to the open thread; the panel and the chat page both show them.
- [x] Closing the pane aborts the stream and releases the microphone; no POST is sent after.
- [x] Read aloud on a card streams `/chat/speech` and plays it as it arrives; the stop square stops it; the Voice replies switch reads a fresh answer the same way; no `speechSynthesis` call remains (`grep` in the acceptance run — one comment names it).
- [x] `LiveUplink` unit-tested (coalescing, cap, one in flight); `npm test`, `tsc`, lint and build green.

## Verification

`tools/capture_talk_to_glisp.mjs` (2026-09-18, production build on :3100 against a
reload-free backend on :8100, the store's Gemini card, `CAPTURE_BASE=…`): the fake
microphone (`mic.wav%noloop`, 9 s lead-in) speaks "How did we do this week?" into
the page pane. Line open 7.4 s after the tap; the owner's words on screen the
moment the line has heard them; **first audio ~0.8 s after the owner's last word**
(30 audio POSTs by then, ~6 a second); the reply — "Let me check the numbers for
this week." then net revenue ≈ $911k, −14.5 %, 3,400 orders — plays through, the
pane returns to *Listening*; End hangs up (`DELETE`), the thread shows the
question, the answer card and its trust footer; Read aloud on that card streams
`audio/L16` (200 after 3.6 s) and the speaker returns to rest after the 19 s
reading, `speechSynthesis` untouched; the pill on the Dashboard opens the panel
straight into the line and the keyboard button hangs it up. Captures in
`ref/screens/voice-2026-09-18/`; `chat-voice-sphere` re-built from `02-speaking.png`.
`npm test` 1756 · `tsc` · lint · `npm run build` green.

## Patches

- **2026-09-18 — the microphone and the line open together.** `open()` starts
  `openLine()` first and then asks for the microphone, instead of one after the
  other; `onListening` remembers the line is ready (`lineReady`) so whichever
  finishes second flips the pane to *Listening*. A microphone failure hangs up the
  line that was opening beside it. The hook's own unmount stop is deferred 60 ms
  and cancelled on remount (React's development double-invoke would otherwise
  abort the line the moment it started). With backend SPEC-272 Patches, measured
  on the dev box (remote database): tap → *Listening* **1.2 s**, from 7 s.
