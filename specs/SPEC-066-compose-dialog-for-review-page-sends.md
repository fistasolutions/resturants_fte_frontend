# SPEC-066 — Shared compose dialog for the 4 review-page send actions

## Why (V3-Proposal-Revised.docx item 6; backend contract SPEC-062)

Today, 4 of the app's "send" buttons — overdue orders, warehouse transfers,
dead-inventory alerts, orders-to-manager — fire an email the instant they're
clicked, with no preview and no way to edit the wording. This spec adds one
shared `ComposeDialog` that all 4 open instead of sending directly: it shows
an AI-drafted subject + intro (editable), a read-only preview of exactly
what will be attached, and sends only on explicit confirm. Backend contract
(4 draft endpoints + optional `subject`/`body` on the 4 send endpoints) is
already implemented and tested (backend SPEC-062).

Winback is out of scope here too — its backend send doesn't email at all
(see SPEC-062's rationale), so there's no button to convert on that page.

## Existing precedent, reused rather than reinvented

`features/customers/draft-email-panel.tsx` already renders an AI draft in a
`Dialog` (editable `Input` subject + `Textarea` body, loading/error/retry
states) — but its only footer action is **Copy**, never send. `ComposeDialog`
reuses that exact draft-editing UI shape and adds the missing send step.

## Component: `components/shared/compose-dialog.tsx`

Deliberately **domain-agnostic** — it knows nothing about overdue vs.
transfer vs. orders content shapes. It only knows: fetch a draft, let the
user edit two strings, show a read-only attachment table if one exists,
POST a send with those (possibly edited) strings, and report the raw send
response back to the caller. Each page keeps its own result-handling logic
(marking rows sent, showing partial-success banners) exactly as it does
today — only the "fire immediately" moment moves into this dialog.

```tsx
interface ComposeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draftUrl: string;                    // proxy path, POSTed to fetch the draft
  sendUrl: string;                     // proxy path, POSTed to actually send
  requestBody: Record<string, unknown>; // the action's own selector (location_key, product_id, etc.)
  title: string;                        // dialog heading, e.g. "Send overdue-order list"
  onSent: (result: unknown) => void;    // raw send response — caller applies its own state update
}
```

Behavior:
- On open (first time only per open-cycle — mirrors `draft-email-panel`'s
  `if (nextOpen && !draft)`): `POST draftUrl` with `requestBody`, expecting
  `{subject, body, generated_by, attachment: {columns, rows} | null,
  summary}` (SPEC-062 shape).
- Draft state resets to `null` on close, so reopening always re-fetches —
  content (order counts, stock levels) can change between opens, and a
  stale preview would misrepresent what's about to send.
- Body states: `loading` (skeleton), `error` (message + Try again button,
  same pattern as `draft-email-panel`), and the loaded form — editable
  `Input` (subject) and `Textarea rows={6}` (body), each a controlled
  field patched via `setDraft({...draft, subject: e.target.value})`.
- If `attachment` is non-null: a read-only `Table` below the body textarea,
  capped at 20 preview rows with a "+N more in the attachment" caption if
  truncated (the CSV actually attached always has every row — this is
  preview-only truncation, purely for dialog height).
- If `attachment` is null (dead-inventory's single-item case): no table,
  just the `summary` rendered as a small stat line above the body.
- Footer: one **Send** button — `POST sendUrl` with
  `{...requestBody, subject: draft.subject, body: draft.body}`. On success,
  calls `onSent(json)` and closes the dialog. On failure, shows an inline
  error and keeps the dialog open (so the user doesn't lose their edited
  text and can retry).
- Generated-by-fallback banner (mirrors `draft-email-panel` lines 136-141):
  if `generated_by === "fallback"`, a small muted note that AI drafting
  was unavailable and this is the default wording — never hidden, per root
  Rule 6 (no silent degraded behavior).

## Wiring into the 4 existing pages

Each page's Send button's `onClick` changes from "POST send directly" to
"open ComposeDialog with this row's `requestBody`." Each page's existing
post-success state-update logic (already written, already tested manually)
moves unchanged into its `onSent` callback:

| Page | `draftUrl` / `sendUrl` | `requestBody` | `onSent` reuses |
| --- | --- | --- | --- |
| `features/brief/overdue-review.tsx` | `/api/proxy/brief/overdue/draft` / `.../send` | `{location_key}` | existing `sheets`/`email_recipients` merge logic |
| `features/brief/transfer-review.tsx` | `/api/proxy/brief/transfers/draft` / `.../send` | `{location_id}` | same pattern, `location_id` |
| `features/inventory/dead-inventory-review.tsx` | `/api/proxy/analysis/inventory/dead-inventory-alerts/draft` / `.../send` | `{product_id, location_id}` | existing `handleSent(key, isoNow)` per-row map |
| `features/orders/orders-review.tsx` | `` `/api/proxy/orders/draft-to-manager?${apiQuery}` `` / `` `.../send-to-manager?${apiQuery}` `` | `{filter_summary, location_key}` | existing `sent_location_keys` union logic |

The "send all remaining" bulk actions on each page keep firing directly
(no per-item preview makes sense for "every remaining location at once") —
only the **single-location/single-item** Send buttons open the compose
dialog. This is a deliberate scope line: bulk send stays a one-click
action, individual send gets the preview-before-send treatment.

## Patches

- **Correction (same day): a real navigable page, not a modal — and AI
  drafting is an explicit action, not automatic.** The first build (a
  `ComposeDialog` opened in-place over the review page, auto-fetching an
  AI draft the instant it opened) didn't match the intended UX. The
  corrected design:
  - **Real navigation, not a popup.** Each "Send" click is a `<Link>` to
    a dedicated compose route with its own URL and its own 3-level
    breadcrumb (e.g. `Morning Brief > Overdue Orders > Jackson`),
    following the exact hand-rolled breadcrumb pattern already used by
    `app/(app)/brief/overdue/page.tsx` and the dead-inventory detail page
    (`app/(app)/inventory/dead-inventory-alerts/[productId]/[locationId]/page.tsx`)
    — `Link` + `ChevronRight` from `lucide-react`, last crumb a plain
    `<span>`. New routes:
    - `/brief/overdue/send/[locationKey]`
    - `/brief/transfers/send/[locationId]`
    - `/inventory/dead-inventory-alerts/[productId]/[locationId]/send`
    - `/orders/review/send/[locationKey]` (carries the same filter query
      params `/orders/review` already uses)
  - **Recipient pre-filled, read-only.** The page shows a "To:" line
    populated from the new `recipient` field on the draft response
    (backend SPEC-062 patch) — the location's saved `manager_email`. If
    unset, a clear inline prompt links to Settings instead of a blank field.
  - **AI is an explicit button, not automatic.** On page load, the
    client component calls the draft endpoint with `include_ai_draft:
    false` — this returns the recipient, the attachment, and the summary
    stats immediately, with an empty, directly-typeable subject/body. A
    "Write with AI" button (Sparkles icon, mirrors `draft-email-panel.tsx`'s
    button styling) calls the same endpoint again with `include_ai_draft:
    true`, filling the subject/body fields in place — no dialog, no
    separate fetch cycle the user didn't ask for.
  - **Attachment visible immediately.** The CSV/table preview renders as
    soon as the page's initial (non-AI) fetch resolves — it never waits
    on the AI step, since it's real data that doesn't depend on drafted
    text.
  - **Send navigates back.** On success, the page `router.push()`s back
    to the parent review page (a server component that re-fetches fresh
    data on navigation) rather than calling a callback — there's no
    shared component instance to call back into across a real page
    navigation, unlike the modal.
  - `components/shared/compose-dialog.tsx` is deleted; replaced by
    `components/shared/compose-panel.tsx` (page content, no `Dialog`
    wrapper, no auto-fetch-on-open).

## Patches (second correction, same day)

Three more corrections after seeing the first build live:

1. **"To" renders as an actual input field**, not plain text — an `Input`
   with `readOnly` (visually a normal field, matches Gmail's own To: box)
   instead of a `<p>`.
2. **The attachment is a file chip, not an inline table.** Dumping the
   full row-by-row table onto the page was never the ask — it should look
   like a real Gmail attachment: a compact card with a file icon,
   filename, and row count. The actual CSV sent is unaffected (still
   built server-side at send time with every row); only the on-page
   *preview* changes from "full table" to "file chip."
3. **"Send All Remaining" gets the same review treatment, scaled up.**
   It was left as an instant no-preview send — wrong for the same reason
   the individual send was. Backend SPEC-062's second patch adds a
   `locations: [{name, recipient, row_count}]` field to the 3 multi-location
   draft responses (overdue, transfer, orders). The frontend adds a new
   `ComposeBulkPanel` (`components/shared/compose-bulk-panel.tsx`): one
   shared, AI-writable Subject/Message at the top (applies to every
   location's email, mirroring how `send()` already applies one override
   string to every location in the loop), followed by one row per
   location — its recipient (read-only input) and its own attachment chip
   — so sending 3 locations shows 3 recipients and 3 attachments before
   anything goes out. New no-dynamic-segment routes: `/brief/overdue/send-all`,
   `/brief/transfers/send-all`, `/orders/review/send-all` (dead-inventory
   has no bulk action — always exactly one alert). The 3 review pages'
   "Send All Remaining" buttons become `<Link>`s to these routes; the
   direct-fire `handleSendAll`/`applyResult`/inline fetch helpers they
   used are removed since sending no longer happens on the review page
   itself for either the single or bulk case — it becomes a pure
   display+navigation component.

## Manual verification checklist (no jsdom/component runner yet)

- [ ] Overdue: click one location's Send → navigates to
  `/brief/overdue/send/[locationKey]` with a correct 3-level breadcrumb →
  "To:" renders as a real (read-only) input field, pre-filled → attachment
  shows as a single file chip (icon + filename + row count), never an
  inline table → subject/body start empty and directly typeable → click
  "Write with AI" → subject/body fill in → edit → Send → navigates back to
  `/brief/overdue` → row shows sent.
- [ ] Transfer: same flow, its own attachment chip.
- [ ] Dead-inventory: page shows no attachment chip at all (single alert,
  nothing to attach), just the style/location summary line → "Write with
  AI" → Send → back on the parent page, row shows sent.
- [ ] Orders: attachment chip scoped to the clicked location → Send →
  back on `/orders/review`, only that location's row shows sent.
- [ ] A location with no manager email shows a clear "add one in
  Settings" prompt instead of a blank "To:" field.
- [ ] Overdue/Transfer/Orders: click "Send All Remaining" with 2+
  locations pending → navigates to the `*/send-all` page → one shared
  Subject/Message with "Write with AI" → below it, one row per remaining
  location showing that location's recipient (read-only input) and its
  own attachment chip → Send → back on the review page, every location
  that had a manager email shows sent, any without one still shows
  skipped (not silently dropped).
- [ ] AI drafting failure (backend LLM down) still fills in a usable
  deterministic draft with the fallback notice visible, on "Write with AI"
  click — never on page load.
- [ ] Loading the compose page does NOT trigger an LLM call — only
  clicking "Write with AI" does (verify via backend logs if needed).
- [ ] Both themes (light default, dark toggle) — the page and table read
  correctly in each.
- [ ] No entrance animation on page load (root Rule 9).

## Acceptance criteria

- [ ] `components/shared/compose-panel.tsx` is the only new shared
  component; it is imported by all 4 new compose page routes, none of
  which duplicate its fetch/edit/send logic. `compose-dialog.tsx` no
  longer exists.
- [ ] Compose pages never call the draft endpoint with AI drafting on
  page load — only in response to the "Write with AI" click.
- [ ] No page's existing "send all remaining" bulk path changes.
- [ ] `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` all
  green.
- [ ] Manual checklist above completed.

## Patch — professional compose UI and resilient states (2026-07-31)

The owner requested a production-quality visual and interaction pass after reviewing
the first live compose page. The underlying draft/send contract and navigation remain
unchanged; this patch upgrades the shared single-message compose experience:

- Use a clear card hierarchy (compose header, recipient/subject/message content,
  attachment section, and persistent action footer) within the existing two-column
  layout. The page remains restrained and token-driven in both themes.
- Replace the generic loading sentence with a layout-mirroring skeleton. Draft-load
  failures render a descriptive alert with **Try again** and **Back to review** actions.
- Treat subject and message as required at the UI boundary. Empty fields receive
  `aria-invalid`, linked inline errors, and focus moves to the first invalid field.
  Whitespace-only values are never submitted.
- AI writing and sending expose explicit busy labels, spinner icons, disabled
  conflicting controls, and polite live-region status. API errors remain inline and
  recoverable without discarding the merchant's edits.
- A missing manager email becomes a purposeful warning panel linking to Settings.
  The attachment preview communicates that its row count is ready for delivery.
- The send footer includes a safe cancel/back action and a short delivery explanation;
  successful sending continues to navigate to the review page.
- Initial and AI requests are abortable on unmount. Repeated action clicks cannot
  produce concurrent AI or send requests.

### Additional acceptance criteria

- [ ] Draft loading, initial-load error, missing-recipient, field-validation,
  AI-loading/error/fallback, and send-loading/error states are visually complete.
- [ ] Validation is keyboard and screen-reader accessible and preserves typed content.
- [ ] The layout remains usable at 375px, standard laptop widths, and in both themes.
- [ ] The page adds no entrance animation and uses semantic theme tokens only.

## Patch — composer owns remaining width (2026-07-31)

The compose page is no longer constrained to a centered content column. After the
full-height history sidebar takes its expanded or collapsed width, the **New message**
card fills all remaining horizontal space. Its header also provides the mobile History
trigger; the form, states, and send contract are unchanged.

## Patch — animated attachment data preview (2026-07-31)

The compact attachment chip becomes a preview trigger whenever the draft response
contains the real attachment `columns` and `rows`:

- The entire chip is a semantic button with hover, focus, and "Preview attachment"
  affordances. Filename and row count remain visible before opening it.
- Activation opens the existing Radix/shadcn Dialog, using its short interaction-only
  fade/scale motion. The dialog traps focus, closes via Escape, overlay, header close,
  or footer Close, and restores focus to the attachment trigger.
- The dialog header shows the CSV filename and total row/column metadata. A bordered,
  responsive table renders the real column headings and every row already returned by
  the draft endpoint; opening the preview makes no API request.
- The table header remains visible while rows scroll. Wide data scrolls horizontally
  inside the dialog rather than widening the page, and the dialog uses a near-fullscreen
  presentation on mobile.
- Empty attachment data gets a purposeful empty state. Cell content wraps safely and
  blank values remain visibly identifiable.
- Bulk compose chips remain non-interactive for now because their API contract exposes
  only `row_count`, not the actual columns/rows; no data is invented in the UI.

### Additional acceptance criteria

- [ ] Clicking or keyboard-activating the single-message attachment opens the preview.
- [ ] Preview columns, rows, filename, and counts match the loaded draft response.
- [ ] Large/wide tables scroll within the modal; desktop and 375px mobile remain usable.
- [ ] Modal open/close animation is interaction-triggered only and respects the shared
  Dialog primitive.
- [ ] Opening and closing the preview performs no network request and does not change
  the compose fields.

## Patch — professional bulk compose panels and per-location previews (2026-07-31)

The bulk "Send All Remaining" view receives the same production-quality state and
card system as the single-message composer:

- Replace the centered `Loading…` sentence with a layout-mirroring skeleton: message
  header, subject, message editor, summary, multiple location panels, and footer.
  The history rail continues loading independently.
- Initial-load failure becomes a focused error state with **Try again** and **Back to
  review** actions. Requests are abortable, and retries never duplicate in-flight work.
- The right side is a full-height, full-remaining-width compose shell with a clear
  "New bulk message" header, shared subject/message section, location summary, stacked
  per-location delivery panels, and an action footer.
- Each location has a distinct panel with its delivery status, read-only recipient or
  purposeful skipped warning, and its own attachment. A recipient-less location is
  visually marked as skipped without presenting it as an application error.
- Backend SPEC-062 now provides each `locations[]` item with its exact attachment
  `columns` and `rows`. Every bulk attachment chip opens the same animated, accessible
  data-preview dialog as single compose. The frontend never slices the aggregate rows
  or guesses location membership.
- Subject/message validation, AI busy/error/fallback handling, send busy/error handling,
  live-region announcements, safe cancel navigation, and control locking match the
  single-message composer.
- Mobile keeps the compose shell full width, opens History from the header, stacks
  panel content without horizontal page overflow, and gives attachment previews the
  same near-fullscreen table behavior.

### Additional acceptance criteria

- [ ] Bulk initial loading has no plain `Loading…` placeholder and mirrors final layout.
- [ ] Every location renders a separate professional delivery panel with correct status.
- [ ] Every bulk attachment opens a preview containing only that location's real rows.
- [ ] Empty subject/body cannot be submitted; first invalid field receives focus.
- [ ] Loading, error, retry, AI, fallback, skipped, send, desktop, mobile, and dark-theme
  states use semantic tokens and remain keyboard/screen-reader accessible.
