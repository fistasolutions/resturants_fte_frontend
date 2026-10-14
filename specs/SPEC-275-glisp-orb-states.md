# SPEC-275 — The Glisp orb: one glass sphere, four states, on the light stage

**Date:** 2026-09-18 · **Repo:** frontend · **Status:** implemented
Mockups (approved — "I love this"): `ref/mockups/orb-states.html` (the four states,
after the owner's reference), `ref/mockups/orb-3d.html` (the sphere). Supersedes the
ribbon sphere of SPEC-271 / SPEC-271 Patches; keeps the pane, the crossfade, the
stage tokens (light lavender in the light theme, deep violet in the dark — the
owner: "make sure the background remains light as I mentioned").

## Behaviour

The orb is **a dark glass marble on the light stage** — a deep-violet interior lit
from within, so the reference's additive light (filaments, fog, the red core)
reads exactly as in the mockup while the panel around it stays light. On the dark
stage the same marble sits on deep violet. Glass on top: a Fresnel rim, the
top-left reflection, a dark limb where the ball turns away, a thin violet rim; on
the light stage a soft violet shadow beneath it, so it sits on something.

**One sphere, four states.** The insides change with the line; every change is a
crossfade — the weights of the four layers ease toward the state over ~450 ms, so
nothing pops:

| state | inside the glass | under the orb |
| --- | --- | --- |
| **idle** (and connecting) | one slow ribbon of six thin filaments drifting through the core; the core's bloom wide and calm; dust; the orbital rings turning slowly | the pill (Tap to talk / Connecting…) |
| **listening** | three braids of fine violet-to-blue filaments (≈30, 28, 20) flowing around the core, two dimmer braids behind it seen through the glass, a white spark travelling each braid; sway follows the microphone | a small **waveform** of 18 bars that follows the microphone level |
| **thinking** | the light spiralling into the core — ≈40 filaments on logarithmic spirals turning inward, a slower counter-spiral behind, a constellation of nodes and lines turning the other way; the core beats faster | a **ring** (indeterminate) beside the tool status ("Reading the store…") |
| **speaking** | the filaments fan out from the core to the left and right (≈30 each) and breathe with the voice — the fan's height follows the playback level; the core at its brightest | a wider **waveform** (44 bars) following the playback, then the words as they are said |

Always: the fog (violet and blue clouds drifting behind everything), the dust
twinkling, the rings turning, the red core breathing at the state's pace, the halo.

**Motion is the signal** (root Rule 9): the sway, the fan, the waveforms follow the
live level; at rest only the slow drift, the fog and the rings move. No entrance
animation; the crossfade is the only transition. Canvas, one `requestAnimationFrame`,
no SVG filters or blend-mode layers — the mockup's ~150 blurred SVG paths would not
hold 60 fps on a phone; the canvas draws ≈120–250 plain strokes a frame with
`lighter` compositing inside the marble and a `shadowBlur` only on the core.

## Implementation

- `lib/glisp-sphere.ts` — rewritten: `drawSphere(ctx, size, clock, weights, level,
  tone)`; the pure pieces are exported and unit-tested — `stateWeights` /
  `easeWeights` (the crossfade), `filaments(seed, base, count, spread)`
  (deterministic offsets), `spiralPoints`, `fanPath`, `pointOnCubic`, `motionFor`.
  `paletteFor(tone)` keeps only what the stage changes: the shadow, the halo and
  the rim's strength.
- `features/chat/glisp-sphere.tsx` — the clock and the weights live here; the
  level is read through the ref every frame as before. `state="idle"` at 26 px is
  the composer's coin.
- `features/chat/voice-wave.tsx` — the bars, `levelRef`-driven (one rAF, heights
  through CSS variables, no React state per frame); `size="small" | "wide"`.
- `features/chat/voice-pane.tsx` — the under-orb row per state: pill · waveform ·
  ring + status · wide waveform; captions unchanged.
- `lib/docs/content/chat.ts` — the sphere's paragraph.

## Acceptance criteria

- [x] The orb is the mockup's: dark glass interior, fog, dust, rings, filaments, red core, glass — on the **light** lavender stage in the light theme (and deep violet in the dark theme); stage tokens unchanged.
- [x] Four states render distinctly (idle ribbon · listening braids · thinking spiral · speaking fan) and every change between them crossfades — no pop.
- [x] The listening waveform follows the microphone; the speaking fan and waveform follow the playback; idle only drifts.
- [x] The composer's talk button shows the idle orb at 26 px.
- [x] Pure helpers unit-tested; `npm test`, `tsc`, lint and build green; captures of the states in both themes.

## Verification

`tools/capture_talk_to_glisp.mjs` (live call on the store, production build on
:3100) plus `ref/screens/voice-stage-2026-09-18/`: the pane at listening, thinking
and speaking; the composer coin; light and dark.
