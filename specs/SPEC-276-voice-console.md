# SPEC-276 — The voice console: the frame under the orb, edge to edge

**Date:** 2026-09-18 · **Repo:** frontend · **Status:** implemented
Mockup (approved after four rounds — "great, implement this"):
`ref/mockups/voice-frame.html` / `voice-frame-panel.png`. Builds on SPEC-275
(the orb) and SPEC-273 (the line); replaces the loose captions and the three
round controls of SPEC-271's pane.

## Behaviour

- **Edge to edge.** The voice stage fills the panel below its header and the
  chat page's conversation area — no margin, no white band at the sides. The
  state pill stays at the top.
- **The console.** Under the orb sits a frosted frame drawn as one path
  (`lib/voice-console.ts` `consolePath`): its **top edge scoops around the orb**
  (the ball sits into it), its **bottom bulges into a tab that holds the mic**,
  soft corners, and a thin violet‑to‑cyan edge with a soft glow — never a neon
  band. Inside, top to bottom:
  1. the **state line** between two small red lights — *Listening…* /
     *Reading the store…* (or the tool's own status) / *Speaking…*; the lights
     are Glisp's identity dot, the same as the pill's;
  2. the **waveform** (SPEC-275's `VoiceWave`) — the microphone while listening,
     the voice while speaking, the tools' ring while thinking;
  3. the **words** — *You: "…"* and Glisp's words as they are said, in a box that
     **scrolls after a few lines with no scrollbar**, fading at its foot; while a
     reply streams it keeps the newest line in view unless the owner has scrolled
     up; nothing ever crosses the border.
- **The controls.** The **mic in the tab** is Mute (struck through and dimmed
  when muted); **keyboard** (Type instead) hangs below the frame's bottom‑left in
  a white coin with the violet icon, **End** below its bottom‑right in a black
  coin with the white ✕ — the mockup's placement and colours. Esc still ends.
- **Sizes.** Panel: orb 220, console 360 wide, scoop for the 220 orb. Chat page:
  orb 300, console 560 wide (narrower screens fall back to the panel sizes), the
  same path scaled by its parameters, never stretched.
- Errors and the microphone hint show in the words box; nothing else changes
  about the line (SPEC-273).

## Implementation

- `lib/voice-console.ts` — `consolePath({ width, height, scoop, tab })` (pure): the
  path string for a given size; `CONSOLE_PANEL` / `CONSOLE_PAGE` presets. Tested.
- `features/chat/voice-console.tsx` — the SVG frame (tokens: `--card` fill,
  `--ai` → `--voice-edge-2` gradient stroke, `--brand` lights), the state line,
  the waveform slot, the scrolling words (`scrollbar-none`, mask fade, follow‑to‑bottom),
  the mic tab, the two coins.
- `features/chat/voice-pane.tsx` — composes orb + console; margins gone.
- `app/globals.css` — `--voice-edge-2` (cyan) in both themes; `scrollbar-none` utility.
- `lib/docs/content/chat.ts` — the Talk to Glisp section.

## Acceptance criteria

- [x] The stage fills the panel and the page area with no side band; the pill stays.
- [x] The console has the scooped top around the orb, the mic tab at the foot, the thin gradient edge; the state line with two lights, the waveform, the words.
- [x] The words scroll after a few lines with no visible scrollbar and never cross the frame; a streaming reply keeps its newest line in view.
- [x] Mic (mute) in the tab; keyboard bottom‑left white/violet; End bottom‑right black/white; Esc ends.
- [x] `consolePath` unit‑tested; `npm test`, `tsc`, lint, build green; captures in both themes, panel and page, live call re‑run.

## Patches

### 2026-09-18 — taller frame, the controls as coins (owner: "increase the height of the frame and make the buttons a bit beautiful")

- **Height.** Panel console 372 → 456; page console 400 → 470 (the orb and width
  unchanged). The words box gains the room — six or seven lines before it scrolls.
  The tab grows with it (panel 54/56 half‑width/depth, page 62/62) to hold the mic coin.
- **The mic is a coin.** A filled violet disc (`--ai` gradient, white icon, soft
  violet shadow, a breathing halo) in the tab — the primary control reads as one.
  Muted: a dimmed `--muted` disc with the struck‑through icon, no halo.
- **Keyboard and End are coins too.** 44 px: keyboard white with a violet icon, a
  thin violet edge and a violet‑tinted shadow; End black with the white ✕ and its
  own shadow. Both lift on hover (CSS, 200 ms). Placement unchanged — hanging
  under the frame's foot corners.
- **The frame** gains a soft drop shadow so it sits on the stage, and its fill
  is a touch more opaque for the words. State line 16 px, lights 7 px.
- `tests/voice-console.test.ts` pins the new presets; docs prose unchanged
  (no sizes in it); `docs/MEMORY.md` Feature entry amended.

### 2026-09-18 — glass, not a lit edge (owner: "the button shadow is going over the border; the border is too vibrant — remove it, I want a glassy look")

- **The frame is glass.** The violet‑to‑cyan stroke and its glow are gone, and so is
  the `--voice-edge-2` token. The frame is a frosted pane: the stage blurred through
  it (`backdrop-blur`, clipped to `consolePath` with `clip-path: path()`), a `--card`
  wash, a hairline `--border` edge, and a soft shadow beneath — nothing lit.
- **Nothing crosses the edge.** The mic coin keeps its violet fill but its shadow
  is small (`shadow-sm`) and its halo stays inside the tab; the keyboard coin is
  glass too (`--card` wash, `--border` hairline, `shadow-sm`); End keeps its own
  shadow below the frame.
- Docs prose and `docs/MEMORY.md` say "glass frame" instead of the lit edge.

### 2026-09-18 — Mute did nothing (owner: "why am I unable to mute?")

- Since the coin patch the halo was a positioned sibling drawn *before* the button,
  and the button itself was no longer positioned — so the halo painted over the
  coin and took every click. The button is `relative` again and the halo is
  `pointer-events-none`. Mute/Unmute works on the tab coin as before.

### 2026-09-18 — the tab hugs the mic (owner: "the frame curve equal width to the button")

- The tab is now a **cradle around the coin**: an arc concentric with the mic coin
  at an even gap (`tabHalf` is that radius — coin 26 + gap 8 = 34), joined to the
  frame's bottom edge by two small concave fillets (radius 12) that are tangent to
  both, so the neck is smooth. `tabDepth` (60) is how far the cradle hangs below
  the edge; the coin's centre sits `tabDepth − tabHalf` below it. Same on both presets.
- `tests/voice-console.test.ts` pins the arc and the mic inside it.

### 2026-09-18 — a bigger mic, the cradle with it (owner: "make this button bigger and the frame curve equal as well")

- The mic coin is 64 px (was 52), its icon 28 px; the cradle follows — radius
  `tabHalf` 40 (coin 32 + gap 8), `tabDepth` 72 — on both presets. Nothing else moves.

### 2026-09-18 — bigger mic, the cup concentric with the orb, a wider frame (owner: three fixes)

1. The mic coin is 76 px, icon 32 px; cradle radius 46, depth 84.
2. **The scoop is concentric with the ball.** `scoop` is now the ball's drawn
   radius plus an even 8 px gap (panel 98 for the 220 orb, page 131 for the 300
   orb — the canvas draws the ball at 0.82 of its half-size), and `overlapFor`
   places the console so the arc's centre *is* the orb's centre
   (`scoopCentreY` in `lib/voice-console.ts`), so the gap is the same all the
   way round instead of widening at the bottom.
3. **Wider.** Panel console 360 → 416 (the sheet's width less a margin), page
   560 → 600. The pane measures its own width (`ResizeObserver`) and narrows the
   preset to fit — a phone never clips the frame.
