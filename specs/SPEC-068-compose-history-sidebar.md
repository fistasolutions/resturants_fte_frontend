# SPEC-068 — Compose page history sidebar + layout swap

## Why

Backend SPEC-064 now persists the literal subject/body of every
compose-driven send. This spec surfaces it: a fixed, vertically
scrollable sidebar on the **left** of every compose page, listing past
sends for that context (location, or location+item for dead-inventory) —
subject, sent time, and the message itself. The compose box (To/Subject/
Message/Attachment/Send) moves to the **right**, unchanged in every other
respect.

Distinct from SPEC-067 (`/results`, being built in parallel): that page
answers "did the send work" (outcome verdicts). This sidebar answers "what
did we actually say" (literal content), scoped to the one page a user is
already on, not a standalone page of its own.

## Layout change

Both `ComposePanel` and `ComposeBulkPanel` change from a single centered
card to a two-column grid: `grid gap-6 md:grid-cols-[280px_1fr]` — the new
`ComposeHistorySidebar` first (left), the existing compose card second
(right). Below `md`, it stacks (history above compose), same as every
other two-panel layout already in this app (`overdue-review.tsx` etc. use
the same breakpoint convention).

## `ComposeHistorySidebar` (`components/shared/compose-history-sidebar.tsx`)

Fetched independently of the draft (parallel, not blocking — a slow or
failing history fetch must never delay the compose box appearing).
Fixed width, `max-h-[70vh] overflow-y-auto` (mirrors the existing
scrollable-panel pattern used elsewhere, e.g. `overdue-review.tsx`'s
sidebar). Each item: subject (bold), a relative/formatted sent time,
location name (only shown when the sidebar covers more than one location
— the bulk pages' sidebars aggregate history across all locations sent
today, so distinguishing rows matters there; the single-location pages'
sidebars are already scoped to one location, so it's redundant there), and
the full message body in a small scrollable block (bodies are short — no
need for a truncate/expand toggle). Empty state: "No sends yet for this
location." Loading state: a short skeleton line, not a layout-shifting
spinner.

## Data wiring

`historyUrl` prop added to `ComposePanel`/`ComposeBulkPanel`, a `GET`
(no body) to the matching backend history endpoint:

| Page | `historyUrl` |
| --- | --- |
| `/brief/overdue/send/[locationKey]` | `/api/proxy/brief/overdue/history?location_key=...` |
| `/brief/overdue/send-all` | `/api/proxy/brief/overdue/history` (no filter — all locations) |
| `/brief/transfers/send/[locationId]` | `/api/proxy/brief/transfers/history?location_id=...` |
| `/brief/transfers/send-all` | `/api/proxy/brief/transfers/history` |
| `/inventory/.../[productId]/[locationId]/send` | `/api/proxy/analysis/inventory/dead-inventory-alerts/history?product_id=...&location_id=...` |
| `/orders/review/send/[locationKey]` | `/api/proxy/orders/history?location_key=...` |
| `/orders/review/send-all` | `/api/proxy/orders/history` |

## Acceptance criteria

- [ ] Compose box renders on the right, history sidebar on the left, on
  all 7 compose pages.
- [ ] Sidebar fetch runs in parallel with the draft fetch — never blocks
  the compose box from rendering.
- [ ] A location/pair with no prior sends shows the empty state, not an
  error or a blank space.
- [ ] `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` all
  green.

## Patch — history panel state polish (2026-07-31)

The history rail now matches the professional compose shell: a labeled header with
send count, layout-stable skeleton rows, a purposeful empty state, and a recoverable
error state with an inline retry action. Requests are aborted on unmount, timestamps
use semantic `<time>` markup, and long content wraps safely without widening the page.
The rail still fetches independently and never blocks the compose form.

## Patch — full-height collapsible history sidebar (2026-07-31)

Owner clarification: history is a true secondary sidebar, not a short card or a
stacked panel.

- On desktop it stays on the left at the full available viewport height and remains
  sticky while the message content scrolls. Expanded width is 280px.
- Its header owns an explicit collapse control. Collapsing reduces it to an icon rail;
  the History icon remains visible and is the control for reopening it.
- The composer on the right uses every remaining pixel of the content area and grows
  immediately when the history rail collapses.
- Below the desktop breakpoint, the history rail does not consume vertical page space.
  A History control in the compose header opens a full-height left Sheet with a clear
  close control, focus management, Escape dismissal, and the same live history states.
- The history request remains mounted once and shared by both responsive presentations;
  changing sidebar visibility never refetches or loses loaded history.

### Additional acceptance criteria

- [ ] Desktop expanded, desktop collapsed, and reopened states are keyboard accessible.
- [ ] The collapsed rail always exposes a visible History icon with an accessible label.
- [ ] At 375px, the composer stays full width and history opens off-canvas from the left.
- [ ] The desktop rail and composer both fill at least the available viewport height.
