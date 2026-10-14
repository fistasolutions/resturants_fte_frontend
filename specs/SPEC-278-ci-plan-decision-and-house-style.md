# SPEC-278 — A plan in the house style; Yes with a note; a decision you can edit

**Date:** 2026-09-18 · **Repo:** frontend · **Status:** implemented
Backend: SPEC-276 (`accept_note`, revisable decisions). Builds on SPEC-272.

## Why

The owner, opening `/ci/plans/3`: (1) "the UI of it must be like the whole system —
it looks different"; (2) "if someone says OK it also has the input here — any
suggestion — and Submit, like we have for Cancel, so it is for both"; (3) "once
submitted he may also edit it".

## Behaviour

- **House style.** The plan page is built from the platform's own vocabulary —
  `PageHeader` (heading font, muted description, actions on the right) and the
  `Panel` / `PanelRow` sections every compact page uses (SPEC-231/233): uppercase
  panel titles in a hairline‑divided card, `--border` hairlines, the status pill.
  The paper's black underlines, the black double‑ruled decision box and the
  tinted tiles are gone. Sections: **The plan** (in one line · why now · what you
  get), **Effort · where it lives · the value** (three rows), **What it looks like**
  (when there is an image), **Your decision**; the rail is **About this plan**
  with the same rows.
- **Yes has words too.** *Yes — build it* opens a box — "Any suggestions or
  conditions? (optional)" — and **Submit**; *No — not like this* opens the two
  required boxes and **Submit**. Both forms have **Back**. The note is saved with
  the plan (`acceptNote`), shown under the verdict and on the card.
- **Edit the decision.** A decided plan shows its verdict with **Edit decision**:
  the choice comes back with the current answer's words already in the boxes;
  the owner may keep the verdict and change the words, or flip it. Submit
  replaces the decision (backend SPEC-276); **Cancel** returns to the verdict.
- Edit / Remove of the plan itself stay awaiting‑only (unchanged).

## Implementation

- `types/ci-plans.ts` `acceptNote`; `lib/ci-plans.ts` `accept_note` → `acceptNote`,
  `ACCEPT_NOTE_MAX`, `noteProblem` (pure; tested).
- `services/ci-plans-actions.ts` `acceptPlan(id, note)`.
- `features/ci/plan-decision.tsx` — the choose / accept / reject / verdict states
  in a `Panel`; `features/ci/plan-reader.tsx` — the house‑style page;
  `features/ci/plan-card.tsx` — the note on an accepted card.
- `lib/docs/content/ci.ts` — the plan‑and‑decision section; `updated` bumped.

## Acceptance criteria

- [x] The page uses `PageHeader` + `Panel`/`PanelRow`; no `border-foreground` rules, no black decision box.
- [x] Yes opens an optional note box + Submit; No opens the two required boxes + Submit; both have Back.
- [x] A decided plan shows Edit decision; the form opens prefilled; submitting replaces the decision; Cancel keeps it.
- [x] The note shows under the verdict and on the card.
- [x] `npm test`, `tsc`, lint, build green; the docs section updated.

## Patches

### 2026-09-18 — revert the decision (owner: "we can revert the whole decision as well")

- In the edit state a decided plan also offers **Revert decision**: a confirm
  ("The plan goes back to awaiting and the notes are cleared"), then
  `DELETE /ci/plans/{id}/decision` (backend SPEC-276 Patches) —
  `services/ci-plans-actions.ts` `revertDecision`. The plan is awaiting again,
  Edit / Remove of the plan return, and the buttons are back where they were.

### 2026-09-18 — the plan form, simplified (owner: "simplify this modal — do what I said, nothing else")

- **Three boxes:** Title · Why now · What you get (one per line). That is the form.
- **Two optional lines under them:** In one line (empty ⇒ the first bullet is
  used — backend SPEC-276 Patches) and The value — single‑line inputs, not textareas.
- **Details, collapsed:** Where it lives · Effort (days) · What it looks like
  (image) behind one "Details" toggle, closed by default; open by default when
  editing a plan that already has any of them.
- `lib/ci-plans.ts` `draftProblems` no longer requires memo or value;
  `hasDetails(draft, plan)` (pure) decides the toggle's initial state.
- The card and the page show The value only when there is one.
