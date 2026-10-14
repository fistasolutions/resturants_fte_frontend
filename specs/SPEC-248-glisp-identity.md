# SPEC-248 — Glisp: the analyst's name and icon, everywhere it speaks

**Date:** 2026-09-16 · **Repo:** frontend · **Status:** implemented
Backend counterpart: wording only — `prompts/business_analyst.md`, `services/ai/page_context.py`
(SPEC-243 Patches).
Depends on: SPEC-235 (Ask AI drawer), SPEC-242 (✦ Explain this), SPEC-243 (select anything),
SPEC-246 (nudge), SPEC-007 (brand tokens)

## Problem

The analyst was decided to be **Glisp** on 2026-09-14 (`ref/icon/glisp-icon-dark-v2.svg`,
`glisp-icon-light-v2.svg`), but the app still says "Ask AI" on the pill, the bubble, the
labels and the docs, the avatar is the old robot badge PNG, and every AI marker in the
product is Lucide's generic `Sparkles` — the same glyph every other AI product uses.
Owner instruction (2026-09-16): "everywhere we mention Ask AI say **Ask Glisp**, use my
icon, and do not use the sparkles icon for AI anywhere any more."

## What this builds

1. **`components/shared/glisp-icon.tsx` — `GlispIcon`.** Two variants of the same
   drawing. `tile` is the icon file itself, theme-driven with tokens (root Rule 9):
   the rounded tile `--foreground`, the five strokes `--background`, the focal dot
   `--brand` — exactly the dark file in light theme and the light file in dark theme;
   used for the avatar only. `mark` (the default) is the five rays and the red dot
   with **no background**, drawn as round-capped strokes in `currentColor` heavy
   enough to read at 12–20 px — the glyph for buttons, pills and labels, exactly where
   a Lucide icon sat. (The first cut used the tile everywhere; at 14 px it was a grey
   blob with a red speck — owner: "remove its background" — fixed the same morning.)
   Accepts `className` and any SVG prop (`<GlispIcon className="size-4" aria-hidden />`).
2. **`BotAvatar` renders `GlispIcon`.** The robot badge PNG is no longer referenced by
   the app (the files stay in `public/` for the docs captures that still show them
   until they are retaken). Every place the avatar appeared — launcher pill, phone
   header, drawer header, chat page header, chat view — now shows Glisp.
3. **`Sparkles` → `GlispIcon` in every AI marker**: Explain this (✦ button), the selection
   bubble, the nudge card and the drawer's nudge row, the chat empty-state prompts,
   the model picker, AI commentary, the report generator and viewers, the returns
   action plan, Foresight, Spotlight, Social and the AI providers card — 36 files. No
   Lucide `Sparkles` import remains in the app.
4. **"Ask AI" → "Ask Glisp"** in every user-facing string: the pill, its aria-labels and
   tooltip ("Ask Glisp, your AI Business Analyst"), the selection bubble and its
   labels, the drawer title ("Glisp" · "AI Business Analyst · Online · reads your
   store's records"), the chat page status line, and the in-app docs (chat, dashboard,
   customers, discounts, overview). Code comments follow. The sidebar entry stays
   "Chat with AI" — the page title is the sidebar title verbatim (Rule 11) and was not
   part of the instruction.

## Not changed

The favicon and the login/OG branding (Ecommerce FTE, not the analyst); the `--ai`
accent token (still used for AI-tinted surfaces); backend behaviour.

## Acceptance criteria

1. `grep -rn "Sparkles" app components features lib` is empty; `grep -rn "Ask AI"` in
   app/components/features/lib (docs included) is empty.
2. The launcher, drawer, chat page, Explain button, selection bubble and nudge show the
   Glisp icon in both themes; the pill reads "Ask Glisp".
3. `npm test`, `npx tsc --noEmit`, ESLint, `npm run build` pass.

## Manual verification (no jsdom runner — root Rule 4)

Done 2026-09-16 on the live store (Playwright, `ref/screens/glisp-2026-09-16/`):

- [x] Dashboard light + dark: pill "Ask Glisp" with the tile; the tile-corner buttons
      show the mark (muted, AI accent on hover — `06-mark-tiles`, `07-mark-hover`); the
      nudge card's marker and the "AI analysis" pill (`08-mark-pill-corner`; captured
      on Inventory — the Dashboard had no nudge that morning).
- [x] Panel open in both themes: header "Glisp · AI Business Analyst", the icon as
      the avatar; chat page header and composer likewise; model picker.
- [x] The six chat docs screens recaptured (`chat-2026-09-16/`, `explain-`, `select-ask-`,
      `resume-`, `nudge-2026-09-16/`) and the pipeline re-run — no doc shows "Ask AI".
- [x] `npm test` 1573 passed, `tsc` clean, ESLint 0 errors, `npm run build` green;
      `grep Sparkles` and `grep "Ask AI"` over app/components/features/lib both empty.
