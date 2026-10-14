# SPEC-304 — Our own confirm, and a reply rendered in full

**Status:** done
**Date:** 2026-09-24
**Repo:** frontend

## Why

Two things the owner saw on the Finance employee's chat, 2026-09-24:

1. **A browser alert.** Deleting a thread opens *"localhost:3000 says — Delete "hey!"? Its
   messages go with it."* — the operating system's own box, in the wrong typeface, with no
   theme, saying the hostname out loud. Eight places in the app still call
   `window.confirm`.
2. **A reply rendered flat.** `ChatMarkdown` styles `h3`, `p`, `strong`, lists, tables and
   inline `code` — and nothing else. A reply that opens with `## Where you stand`, quotes a
   figure, links a bill or shows a fenced block renders with the browser's defaults inside
   a `text-sm` card: a 32-pixel heading, an unstyled link, a code block with no box.

## What ships

### 1. `useConfirm()` — one dialog, eight call sites

`components/shared/confirm-provider.tsx`, mounted once in `app/(app)/layout.tsx`:

```tsx
const confirm = useConfirm();
if (!(await confirm({ title: "Delete “hey!”?", body: "Its messages go with it.",
                      confirmLabel: "Delete", destructive: true }))) return;
```

- A shadcn `AlertDialog` — themed, keyboard-navigable, Esc cancels, the destructive action
  in `--destructive`, focus returning to the trigger.
- The hook resolves a promise, so every existing `if (window.confirm(...))` becomes
  `if (await confirm({...}))` with the same shape and no other change.
- `lib/confirm.ts` holds the pure half: `confirmCopy(kind, subject, count?)` builds the
  title and body for the recurring cases (delete a thread, a fact, a source, a run, a bulk
  selection, pause every schedule) so the wording is written once.

Replaces `window.confirm` in: the employee chat panel, Report FTE history and delivered
views, and the Brand Brain source, fact, fact-page and bulk-facts views.

### 2. A reply rendered in full

`ChatMarkdown` gains the elements it was missing, all on the existing token scale:
`h1`, `h2`, `h4` (matching `h3`'s weight, one step apart), `em`, `a` (underlined,
`target="_blank" rel="noreferrer"`), `blockquote` (left rule, muted), `hr`, `pre` (a
bordered `bg-secondary` block that scrolls rather than stretching the card), and `code`
inside `pre` rendered plain so it is not double-boxed.

The map is exported as `CHAT_MARKDOWN_COMPONENTS` and `tests/chat-markdown.test.ts` fails
if a required element loses its style — the same mechanical gate the docs test uses.

## Non-goals

- No raw HTML: `react-markdown` ignores it and that stays true.
- `StreamingMarkdown` keeps its own lighter path for a half-written token stream; it
  reuses the same map once the stream settles.

## Acceptance criteria

1. No `window.confirm` anywhere in `features/`, `components/` or `app/` — a test greps.
2. The dialog cancels on Esc, confirms on the primary action, and returns a promise that
   resolves false when dismissed.
3. `CHAT_MARKDOWN_COMPONENTS` covers h1–h4, p, strong, em, a, ul, ol, li, blockquote, hr,
   pre, code, table and its parts.
4. `lib/confirm.ts` is pure and unit-tested.
5. `npm test`, `tsc`, `lint`, `build` green; verified in the browser on the finance chat.

## Verification

2026-09-24, production build on :3100 against a reload-free backend.

**The dialog — verified in the browser.** Deleting the finance thread now opens the app's
own box: title *"Delete “HEY”?"*, the body underneath, Delete in `--destructive`, Cancel
beside it. Playwright listened for a native dialog throughout and saw **0**. Esc closed it
and the thread was still there — a dismissal answers `false`, it does not delete.

**No `window.confirm` remains** — the test greps `features/`, `components/` and `app/`, and
the only match left is the sentence in `confirm-provider.tsx` explaining why it is gone.

**The renderer — verified mechanically, not by eye.** `CHAT_MARKDOWN_COMPONENTS` is
asserted to style all 21 elements a reply can contain (h1–h4, p, strong, em, a,
ul/ol/li, blockquote, hr, pre, code, table and its five parts), and the link is asserted
to carry `target="_blank"` and `rel="noreferrer"`. I could not open a stored thread in the
harness to photograph a heading, so this half rests on the test and on the change being a
pure addition to a components map — said plainly rather than claimed as a screenshot.

**Gates:** `npm test` **1,973 passed (173 files)**, `tsc` clean, `lint` 0 errors (3
pre-existing warnings), `npm run build` compiled.

### Acceptance criteria

| # | Criterion | Status |
| --- | --- | --- |
| 1 | No `window.confirm` anywhere; a test greps for it | done |
| 2 | Esc cancels, the action confirms, a dismissal resolves false | done (browser) |
| 3 | The element map covers h1–h4, p, strong, em, a, lists, quote, rule, pre, code, table | done |
| 4 | `lib/confirm.ts` pure and unit-tested | done |
| 5 | Suite, types, lint, build green | done |
