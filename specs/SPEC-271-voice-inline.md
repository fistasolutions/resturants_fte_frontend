# SPEC-271 — Talk to Glisp, inside the surface: the panel and the conversation area

**Date:** 2026-09-17 · **Repo:** frontend · **Status:** implemented
**Supersedes** SPEC-268's full-viewport `VoiceScreen`. Mockup (approved):
`ref/mockups/talk-to-glisp-inline.html`.

## Behaviour

- **No full-page takeover.** Voice mode replaces only the surface it was opened
  from: in the Ask Glisp panel, the thread + composer become the voice pane (same
  sheet, same header, same width); on the chat page, the conversation area becomes
  the voice stage while the history rail, the header and the message box stay.
- **Smooth both ways.** The sphere button in the message box switches text → voice;
  ✕, the keyboard button or Esc switch voice → text. Each switch is a 200 ms
  crossfade (`Crossfade` — the outgoing view fades while the incoming one fades in;
  motion is interaction-driven only, root Rule 9). The thread underneath already
  carries every spoken turn as cards. On the chat page, typing in the box and
  sending ends voice and sends the text.
- **The pill's Talk** opens the panel straight into voice mode.
- **The sphere** is the owner's Siri-style orb redrawn on the AI violet scheme
  (`lib/glisp-sphere.ts`): broad ribbons flowing through the glass, three fine
  strands, two travelling lights, a breathing halo and rim, Glisp's small red core
  where the ribbons cross. It moves to the signal — the sway, pace and brightness
  follow the microphone while listening and the reply's audio while speaking; the
  flow clock is integrated so a change of pace never jumps.

## Implementation

- `features/chat/voice-pane.tsx` — the pane (state pill, sphere, captions, level
  meter, keyboard · mute · end), `variant="panel" | "page"`. Replaces `voice-screen.tsx`.
- `features/chat/crossfade.tsx` — the 200 ms two-layer switch.
- `chat-drawer.tsx` — `voiceOpen` from the provider; the pane inside the sheet.
- `chat-drawer-provider.tsx` — `openVoice()` opens the sheet in voice mode; no overlay.
- `chat-page.tsx` / `chat-view.tsx` — `voice` slot over the thread area; the composer's
  sphere toggles it; a send closes it.
- `lib/glisp-sphere.ts` — the new orb; `tests/glisp-sphere.test.ts`.

## Acceptance criteria

- [x] On /chat the sphere button turns the conversation area into the voice stage; rail, header and composer stay; ✕ brings the thread back with the spoken cards.
- [x] From the pill on /dashboard the panel opens in voice mode; the keyboard button returns to the thread inside the same panel.
- [x] `npm test`, `tsc`, lint, `npm run build` green; docs updated.

## Patches

- **2026-09-18 — the stage is light; the orb stays.** The owner: "I love what I
  have, just change the background colour — it's not visible properly." The voice
  stage was one near-black surface in both themes (`--voice-stage #16121f` →
  `#050308`), so in the light app the sheet turned black, the glass body sank into
  it and the pane's white-on-black controls sat inside a white panel. Now the stage
  follows the theme: **light** — a lavender-to-cream radial (`--voice-stage
  #fbfaff`, `--voice-stage-deep #e6dffc`) inside the panel and the conversation
  area; **dark** — deep violet (`#2a1f5e` → `#120c30`), never black. The sphere
  keeps every ribbon, light, the red core and its motion, and draws itself for the
  stage it is on (`lib/glisp-sphere.ts` `paletteFor(tone)`: a white-to-lavender
  glass body with a violet rim and shadow, violet/blue ribbons, white lights with a
  violet glow on the light stage; the original dark palette on the dark one).
  `GlispSphere` reads the theme (`useTheme().resolvedTheme`) and passes the tone;
  the pane, the pill and the controls use the ordinary tokens (`text-foreground`,
  `bg-card/70`, `border-border`, End = `bg-foreground text-background`) so both
  themes read. The composer's talk button sits on `bg-voice-stage-deep` with a
  `ring-border`, so on the light composer it is a lavender coin with the orb, not a
  black dot. `chat-voice-sphere` and the Talk to Glisp doc are re-captured.
  Verified: screenshots of the panel and the chat page in both themes.
