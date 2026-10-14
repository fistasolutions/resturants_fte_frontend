# SPEC-071 — Compose History Click-to-View

## Problem

`ComposeHistorySidebar` (SPEC-068) lists past sends but every item is a
static, non-interactive `<article>` — clicking one does nothing. Users
expect clicking a past send to show its actual saved content on the right,
in the same panel that shows "New message" — not a dead list.

Separately, the backend (SPEC-066) now caches the AI-written draft per
target/day so the auto-fire in `ComposePanel` no longer burns a fresh LLM
call on every mount — no frontend change is required for that half; it's
resolved entirely by the backend now returning the same content faster on
repeat calls. This spec only covers the frontend, click-to-view half.

## Goals

- Clicking a history item swaps the right-hand panel from "New message"
  into a **read-only** view of that exact saved send: recipient, subject,
  body, sent time, and attachment (if one was stored) — sourced entirely
  from the `/history` response (SPEC-066 adds `id`/`recipient`/`attachment`
  to it), never re-fetched from `draft()` and never AI-regenerated.
- A clear way back to "New message" (compose mode) that doesn't lose
  whatever draft was already loaded there — toggling the view is a pure UI
  state change, not a remount.

## Non-goals

- No editing/resending from the history view — it's read-only, there's
  nothing to submit.
- No change to `ComposeBulkPanel` — it doesn't render `ComposeHistorySidebar`
  today (bulk "send all" has no single-target history to show) and isn't in
  scope here.
- No change to the AI-auto-draft trigger logic in `ComposePanel` — that
  already fires on mount (prior work); this spec doesn't touch it (the
  backend cache is what makes repeat visits cheap, not a frontend change).

## Design

### `types/compose.ts`

`ComposeHistoryItem` gains:
```ts
export interface ComposeHistoryItem {
  id: number;
  subject: string | null;
  body: string | null;
  sent_at: string;
  location_name?: string;
  recipient: string | null;
  attachment: ComposeAttachment | null;
  [key: string]: unknown;
}
```

### `ComposeHistorySidebar`

- New props: `selectedId: number | null`, `onSelectItem: (item: ComposeHistoryItem) => void`.
- Each history `<article>` becomes a `<button type="button">` (full-width,
  same visual card) with `onClick={() => onSelectItem(item)}`,
  `aria-pressed={item.id === selectedId}`, and a subtle selected state
  (`ring-1 ring-foreground/30` or the existing selected-row treatment used
  elsewhere in these pages) so the active item is visible.
- List `key`/identity switches from the old composite string to `item.id`.

### `ComposePanel`

- New state: `viewingItem: ComposeHistoryItem | null` (default `null`).
- Passes `selectedId={viewingItem?.id ?? null}` and
  `onSelectItem={setViewingItem}` down to `ComposeHistorySidebar`.
- When `viewingItem` is non-null, the right panel renders a read-only
  variant instead of the compose form:
  - Header: "Sent email" (mirrors `ViewSentDialog`'s copy) + a "← New
    message" button that clears `viewingItem` back to `null`.
  - Recipient (read-only text, `viewingItem.recipient ?? "—"`), Subject
    (read-only), Message body (read-only, same typography as the editable
    textarea today), sent timestamp, and — if `viewingItem.attachment` is
    present — the existing `AttachmentChip`/`AttachmentPreviewDialog`
    reused as-is (it already accepts an `attachment` prop).
  - No Send button in this mode — nothing to submit.
- Returning to "New message" does not refetch or re-trigger the AI draft —
  the compose form's existing `subject`/`body`/`recipient`/`attachment`
  state was never touched while `viewingItem` was set, so it reappears
  exactly as it was.

## Acceptance Criteria

1. Clicking a history card shows that item's saved recipient/subject/body/
   sent time/attachment on the right, read-only, with zero additional
   network calls (no `draft()` POST).
2. The clicked card shows a visible selected state; only one at a time.
3. "← New message" returns to the compose form without re-fetching or
   re-drafting — whatever was there before is still there.
4. Works with `attachment: null` (dead-inventory history, or any send with
   no stored CSV) — no broken attachment chip, just omitted.
5. Keyboard-operable (it's a real `<button>`, so Tab/Enter/Space work
   without extra wiring).
6. `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build` all
   green.

## Testing Plan

No new `lib/`/`utils/`/`services/` pure logic is introduced (this is
component wiring), so per this repo's existing convention there's no new
Vitest file — verified instead via a manual checklist (click → view →
back), run through in the browser before calling this done.
