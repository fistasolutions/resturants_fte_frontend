# SPEC-291 — Digital Employees: characters that look at you and do their job

**Date:** 2026-09-22 · **Repo:** frontend · **Status:** implemented
**Builds on:** SPEC-290 (the hub and its cards), SPEC-275 (the Glisp orb — the one
precedent for an identity element with states drawn in CSS/canvas, tokens only)
**Owner ask (2026-09-22, on the first hub screenshot):** "These are too generic. I want
an interactive icon — a human icon, something that shows exactly what they work on —
interactiveness: the icon moves their faces as we move, as we activate them, and other
animation. I want something great here."

## Problem

The SPEC-290 card is a monogram tile, a chip and three boxes. It says nothing about
what the employee *does*, and nothing on it responds to the owner. The four employees
are the platform's most human idea and the page presenting them is its least human.

## Design

### A character per employee

`features/employees/employee-character.tsx` draws one SVG character (viewBox
128 × 128) from a shared body — shoulders, neck, a rounded head, two eyes with lids,
brows, a mouth, cheeks, the brand dot on the collar — plus what makes each one
itself:

| employee | hair / face | prop | what it does when active |
| --- | --- | --- | --- |
| Spotlight | swept fringe | a telescope on a tripod | a beam of light opens from the lens and sweeps; stars twinkle in it |
| Social Growth | a top bun | a megaphone | hearts float out of the megaphone; the mouth opens as if calling out |
| Performance Ads | a cap with a visor | an archery target | an arrow flies in and hits the bullseye; the target wobbles |
| Report FTE | round glasses, side part | a clipboard and a pen | the lines on the clipboard write themselves; the pen scribbles |

Every fill and stroke is a token (`--card`, `--foreground`, `--background`, `--ai` for
the one accent, `--brand` for the collar dot only). No status colour is used
decoratively; no fixed palette.

### The face follows the owner

`lib/employee-character.ts` `gazeFor(pointer, rect)` turns the pointer's position
relative to a character's box into a clamped gaze vector; `useGaze` (in the view) keeps
one `pointermove` listener on the window, rAF-throttled, and writes `--gx` / `--gy`
onto each `[data-character]` element — no React re-render per move. CSS moves the
pupils (±3.5 px) and turns the head (±4°) with a 120 ms transition, so all four look
at the cursor wherever it is on the page, and back to centre when it leaves the window.
Touch devices have no pointer to follow; the faces look straight ahead.

### Mood from status, wake on hover

`moodFor(status)` maps SPEC-285's statuses (the sixth, `unread`, wears the attention face) to a mood the CSS keys on
(`data-mood`): **working** — eyes open, a smile, a blink every five seconds;
**needs you** — brows up, a raised hand that waves when active; **attention** —
worried brows, flat mouth; **idle** — half-lidded eyes; **not started** — eyes shut,
"z z" drifting up (asleep). Hovering or keyboard-focusing the card (`:hover`,
`:focus-within` on `[data-employee-card]`) is "active": the stage brightens, eyes open
wide, a sleeping employee wakes, and the prop does its job (table above).

### Rule 9

No entrance animation — nothing moves on load or scroll; every character renders
instantly in its final state. The only ambient motion is a five-second blink and the
sleeper's drifting "z" (the same class as the skeleton pulse). Everything else is
pointer-, hover- or focus-driven. CSS only — keyframes in `globals.css` under
`@media (prefers-reduced-motion: no-preference)`, the pattern the Glisp orb uses — and
the gaze hook stands down under `prefers-reduced-motion: reduce`. No library.

### The card, redesigned around the character

Stage left (a `size-32` rounded tile, `size-24` on phones, a soft muted → card
gradient that tints toward `--ai` when active), then name · role · department, the
job description, and the Needs-you / Set-up row. Below, the three figures as one
hairline-divided strip instead of three boxes. The footer keeps the last thing it did
and Open. The stretched name link and the raised inner links are unchanged.

### Accessibility

The SVG is `role="img"` with an `aria-label` naming the employee and its mood
("Spotlight — needs you"); the decorative motion carries no information the chip and
the Needs-you row do not already carry in text.

### Files

- `lib/employee-character.ts` (pure: `gazeFor`, `moodFor`, `MOODS`, `characterLabel`,
  `CHARACTERS`) — `tests/employee-character.test.ts`
- `features/employees/employee-character.tsx`, `use-gaze.ts`
- `features/employees/employee-card.tsx`, `employees-view.tsx`
- `app/globals.css` — the `emp-*` block
- `lib/docs/content/employees.ts` (how it works · good to know), the hero recaptured

## Acceptance criteria

1. Each of the four cards shows its own character with its own prop; moving the pointer
   anywhere on the page turns all four faces toward it; leaving the window returns
   them to centre.
2. Hovering or focusing a card wakes its character and runs its prop animation; the
   sleeping (Not started) character opens its eyes.
3. Moods match statuses on the live store (needs you → raised hand; not started →
   asleep; working → smile).
4. Nothing animates on page load beyond the blink; `prefers-reduced-motion: reduce`
   stills every keyframe and stops the gaze.
5. Tokens only — the characters read correctly in both themes.
6. `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` green; doc updated
   and recaptured.

## Verification

- `npm test` — 164 files, **1858 passed** (`tests/employee-character.test.ts` 7: gaze
  maths incl. NaN and zero-size boxes, the status → mood map, one hand / one sleeper,
  labels, four distinct props). `npx tsc --noEmit` 0 errors, `npm run lint` 0 errors,
  `npm run build` green (`/employees` among the 71 routes).
- Verified on a reload-free pair (`:8102` backend, `:3102` production frontend — `:3000`
  had been taken over by another project's server) against the live store, with
  Playwright: `--gx/--gy` on the first character read `-0.69,-0.4` with the pointer at
  the top-left of the window and `1,1` at the bottom-right; hover captures
  (`ref/screens/employees-2026-09-22/05-hover-*.png`) show the beam + stars, the hearts
  + open mouth + wave, the arrow in the bullseye with the sleeper awake, and the
  clipboard lines written with the pen moving; `06-gaze-social.png` shows the head
  turned and pupils up-left. Light and dark (`01`/`03`), phone (`04`), no console or
  page errors, no horizontal scroll, Tab order name → Needs-you row → next card.
- Live moods: Spotlight and Social Growth **needs you** (raised hand, "o" mouth),
  Performance Ads **asleep** (eyes shut, drifting z), Report FTE **working** (smile).
  Earlier in the day, with another session's migration pending, Spotlight rendered the
  **attention** face under the "Could not read" chip — the degradation path in use.
- Defects found in the captures and fixed before shipping: the first gaze hook never
  attached (its effect ran while the skeleton was up); the raised hand overlapped the
  telescope / target (now mirrored to the free side); the sleeper's "z" showed through
  on hover; the telescope was buried behind the head; the target crowded the ear; the
  clipboard was blank at rest.
- Acceptance: 1 done · 2 done · 3 done · 4 done (every keyframe inside
  `prefers-reduced-motion: no-preference`; `useGaze` returns early under `reduce`) ·
  5 done · 6 done.
