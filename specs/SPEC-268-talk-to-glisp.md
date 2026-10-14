# SPEC-268 — Talk to Glisp: the glass sphere

**Date:** 2026-09-17 · **Repo:** frontend · **Status:** implemented
**Backend twin:** `SPEC-268-glisp-voice.md` (`POST /chat/voice`, `GET /chat/voice/status`).
Mockup (approved): `ref/mockups/talk-to-glisp.html`.

## Behaviour

- **Entry points**: the sphere beside the mic in the message box (chat page and
  panel — mic = dictate into the box, sphere = talk live) and **Talk** on the Ask
  Glisp pill on every page. Disabled with a tooltip when `voice/status` says an
  OpenAI key is missing.
- **The voice screen** — a full-viewport dark stage over the app: the glass sphere
  (Glisp's five rays as ribbons of light around the red core), a live level meter,
  captions (what you said · what Glisp says, lit as it is spoken · the grounded
  chip), controls: **Type instead** (closes, focus back to the box) · **Mute** ·
  **End** · **Show the chat** (closes, keeps the thread) · the state pill.
- **Hands-free turns**: the screen opens listening. Speech is detected from the
  microphone level (`TurnDetector`: ≥150 ms above the floor starts a turn, 900 ms of
  quiet ends it, 60 s caps it); the turn is sent as PCM16 24 kHz to `POST /chat/voice`
  through the proxy; the transcript, the text and the speech stream back. The
  sphere follows the real signal — the microphone while listening, the reply's
  audio while speaking. When Glisp finishes, it listens again.
- **Interrupt by talking**: while Glisp speaks, sustained voice cuts playback, drops
  the request and starts the next turn.
- **The thread**: the transcript lands as the user message and the reply as an
  ordinary answer card (sources, chart toggle, actions, trust footer) in the same
  conversation the owner had open — on the chat page, the page's thread; from the
  pill, the panel's.
- Errors (no key, nothing heard, a provider wall) show in the caption area and the
  screen keeps listening; the microphone is released on End / close / navigation.

## Implementation

- `lib/voice-turn.ts` — pure: `floatToPcm16`, `pcm16ToFloat`, `base64ToPcm16`,
  `rms`, `TurnDetector`, `VOICE_SAMPLE_RATE`. Tests in `tests/voice-turn.test.ts`.
- `services/chat.ts` — `getVoiceStatus`, `sendVoiceTurn` (SSE reader, handlers per frame).
- `features/chat/use-chat-session.ts` — `speak(audio, context, handlers)`: the voice
  twin of `send` — same thread rules, adds both messages to the shared store.
- `features/chat/glisp-sphere.tsx` — the canvas sphere (`state`, `level`).
- `features/chat/use-voice-session.ts` — microphone (AudioWorklet, 24 kHz, echo
  cancellation), the detector, playback scheduling + analyser, barge-in, state.
- `features/chat/voice-screen.tsx` — the overlay. Rendered by `chat-page.tsx` (page
  session) and `chat-drawer-provider.tsx` (panel session, `openVoice`).
- `chat-composer.tsx` `onTalk`, `chat-launcher.tsx` Talk segment; `lib/queries/chat.ts`
  `voiceStatus`.
- Docs: `lib/docs/content/chat.ts` "Talk to Glisp"; capture `chat-voice-sphere`.

## Acceptance criteria

- [x] `TurnDetector` and the PCM helpers unit-tested.
- [x] With the microphone and the voice endpoint driven by the test harness (a spoken WAV + a scripted SSE with real PCM), the screen goes listening → thinking → speaking → listening, the captions show the transcript and the reply, and both messages appear in the thread.
- [x] Without an OpenAI key the sphere is disabled with the reason.
- [x] `npm test`, `tsc`, lint, `npm run build` green; docs updated.

## Patches

- **2026-09-17 — SPEC-271 replaces the full-viewport `VoiceScreen`** with the inline
  `VoicePane` (inside the panel, inside the chat page's conversation area) and the
  `Crossfade` switch; the sphere is redrawn as the owner's orb (`lib/glisp-sphere.ts`).
  The turn contract, `use-voice-session.ts` and `useChatSession.speak` are unchanged.
