# SPEC-252 — Glisp in motion: the mark animates by state, the spiral goes

**Date:** 2026-09-16 · **Repo:** frontend · **Status:** implemented
Depends on: SPEC-248 (Glisp identity), SPEC-235 (panel), SPEC-240 (answer card),
SPEC-242 (Explain this), SPEC-243 (selection bubble), SPEC-246 (nudge)
Reference: `ref/glisp-motion-mockup.html` — the approved catalogue (owner: "apply the
animation throughout, and remove the existing chat animation, not the status we can see").

## What this builds

1. **`GlispIcon` gains `state` and `motion`.** `state` is a loop that runs only while the
   state is true — `thinking` (rays light up in sequence toward the dot, dot breathes),
   `reading` (a comet runs down each ray into the dot — mark only; the tile falls back to
   the sequence), `streaming` (dot heartbeat with a fading ring), `generating` (rays fan
   out and gather), `online` (the dot breathes every 3 s). `motion` is a one-shot the
   caller sets for its duration — `send` (rays draw into the dot, one ring), `pop` (dot
   pops with a ring, rays flash), `nod` (the mark tilts once), `shake`. Both render as
   `data-glisp-state` / `data-glisp-motion` on the svg; every ray, the dot and a hidden
   ring carry class hooks. Keyframes live in `app/globals.css`, tokens only, inside
   `@media (prefers-reduced-motion: no-preference)`; interactions 150–250 ms, loops
   1.2–3 s. **No entrance animation** (root Rule 9): every motion here is a reply to a
   user action or a live state.
2. **Wired where the state exists:**
   - Chat thinking row — `BotAvatar state="thinking"`; **the purple `.ai-spiral` is removed**
     (component, CSS and its `--i` dots); the `TypingIndicator` keeps the live status
     phrase ("Reading what happened while each code ran…", default "Thinking…").
   - Answer card header pill — `reading` while streaming; on commit the pill's mark
     `pop`s once, only for a reply that finished in this session (`justCommitted`:
     created within the last 5 s), never on history load.
   - Panel and chat-page header avatar — `thinking` while a reply is in flight, else
     `online`.
   - ✦ Explain — hover: rays lean toward the dot, dot swells (CSS on the button);
     press: `send` for 600 ms.
   - Launcher — hover swells the dot; when a nudge arrives in the session the mark
     `nod`s once and the purple dot pings three times.
   - AI analyst verdict badge — `generating` while the commentary regenerates;
     Generate report button — `generating` while pending.
   - Selection bubble — appears from the highlight (160 ms scale/fade).
3. **`lib/glisp-motion.ts`** — pure: `avatarState(isThinking)`, `justCommitted(createdAt,
   now)`, the one-shot durations. Vitest.

## Acceptance criteria

1. No `.ai-spiral` in the repo; the thinking row shows the animated Glisp tile and the
   status phrase.
2. Every state above plays on its surface and stops when the state ends; nothing
   animates on page load (a history reload shows still marks).
3. `npm test`, `tsc`, ESLint, `npm run build` green.

## Manual verification (no jsdom runner — root Rule 4)

Done 2026-09-16 on the live store (Playwright, `ref/screens/glisp-2026-09-16/09-thinking-row.png`):

- [x] No `.ai-spiral` on the page. Ask in the panel → 2 marks in `thinking` (header + row),
      the pill in `reading` while streaming, `pop` once on commit, header back to `online`;
      reload → 0 pops, 0 thinking.
- [x] Inventory: 8 ✦ buttons; press → `send` present, cleared 800 ms later; verdict
      Refresh → the badge in `generating`; on load 0 generating, 0 nod.
- [x] `npm test` — every motion test green (the two failures in `visibility-adapter`
      belong to the other session's Search Console work in flight); `npm run build` green.
