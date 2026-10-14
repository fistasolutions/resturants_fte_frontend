# SPEC-298 — The prompt panel edits

**Status:** done
**Date:** 2026-09-23
**Repo:** frontend
**Depends on:** backend SPEC-293, frontend SPEC-297

## Why

The panel shows the exact instruction the image model gets. The owner asked to be able to
change it (2026-09-23: *"MAKE SURE IT'S EDITABLE!!"*). Reading a rule and being unable to
re-word it is exactly the friction the Style Guide was built to remove.

## What ships

`features/brand-brain/style-prompt.tsx` becomes an editor:

- The block renders in a monospace **textarea** (same type, same wrap, no layout jump).
  Typing marks it dirty; **Save** and **Revert** appear; ⌘↵ saves, Esc reverts.
- A **Custom** chip appears when an override is in force, with who last changed it and
  when, and a **Reset to the rules** action that puts the compiled block back.
- When the text in force drops a safety rule, a line says which ones and that pictures
  will be generated without them — a warning in the owner's words, never a block.
- The stats line keeps counting the text in force; while dirty it counts what is typed
  and says "unsaved".
- The rules cards below carry one line when an override is in force: they no longer
  compose the prompt until it is reset. Rows still edit — they are what Reset returns to.
- Saving refetches the preview and the rules, so the bench renders with the new text.

`lib/style-bench.ts` gains the pure half: `promptStats` learns the dirty/unsaved case,
`isDirty(typed, inForce)`, `missingSafetyLine(labels)`, and `promptSourceLabel(preview)`.

## Acceptance criteria

1. Editing, saving and reverting work; ⌘↵ saves; Esc reverts.
2. A saved override shows the Custom chip, the stamp and Reset; Reset restores the
   compiled block.
3. Dropping a safety rule shows the warning naming it.
4. The new helpers are pure and unit-tested.
5. `npm test`, `tsc`, `lint`, `build` green; verified in the browser, light and dark.

## Verification

Driven live on 2026-09-23 against the production build on :3100
(`tools/capture_style_prompt_edit_0923.mjs`, captures in
`ref/screens/style-prompt-2026-09-23/`).

- Typing in the panel showed **"122 characters · unsaved"** and revealed Save/Revert.
- **Save** → the header read **"Custom by mr@examplestore.com · just now"**, the chip
  state `data-style-source="custom"`, and the amber line named the four safety rules the
  text dropped. The rules heading gained *"not composing the blog hero prompt while it is
  edited — reset it above to use them again."*
- Switching to **Social** showed that surface still composing from the rows.
- **Reset to the rules** restored the compiled block **byte-for-byte**.
- Light and dark captured; tokens only (the warning uses `--warning`, never a literal).
- **Gates:** `npm test` **1,901 passed (167 files)**, `tsc` clean, `lint` 0 errors (3
  pre-existing warnings), `npm run build` compiled.

### Acceptance criteria

| # | Criterion | Status |
| --- | --- | --- |
| 1 | Edit, save, revert; ⌘↵ saves; Esc reverts | done |
| 2 | Custom chip + stamp + Reset; Reset restores the compiled block | done |
| 3 | Dropping a safety rule shows the warning naming it | done |
| 4 | The new helpers are pure and unit-tested (15 cases in the file) | done |
| 5 | Suite, types, lint, build green; verified in the browser, both themes | done |

## Patches

- **2026-09-23 — the draft resets during render, not in an effect.** `setState` inside
  `useEffect` trips the repo's React lint (cascading renders); the panel now adjusts the
  draft when the text in force changes, the React 19 way, so there is no second paint.
