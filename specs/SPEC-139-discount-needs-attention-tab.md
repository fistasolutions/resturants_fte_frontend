# SPEC-139 — Discounts: "Needs attention" supervision tab (State · Reason · Action)

Status: implemented
Depends on: backend SPEC-142 (attention engine), SPEC-098/136 (discount workspace)

## Problem

The Discounts workspace only *reported* — it flagged discounts but gave the owner
nothing to *do*. Client wants a supervision layer: surface what needs attention, say
**why** and **where**, and give a one-click way to **email the person in charge** at that
location.

## Design

New **"Needs attention"** tab (right after Overview), binding to backend SPEC-142.

- `lib/discount-tabs.ts`: `DiscountTab` gains `"attention"`; tab + route; shell
  `TAB_DESCRIPTION` entry (exhaustive record, tsc-checked).
- `types/discounts.ts` + `services/discounts.ts`: `DiscountAttention[Item]` +
  `getDiscountAttention`.
- **`AttentionQueue`** (client, paginated 8/page) — each flagged discount is a card:
  - **Reason (WHY):** the backend's plain-English sentence ("Pomona Staff applied an
    unusually large discount — $13,410.40 (100% off)").
  - **Where:** location + staff + store-time timestamp.
  - **$ impact + %.**
  - **Action:** **"Email {location} manager"** → a prefilled `mailto:` to the location's
    `manager_email` with the backend-drafted subject/body (the owner's own mail client
    sends it). When no manager email is set → a button linking to Settings → Manager
    Notifications. Plus "View order" drill.
- **Skeleton** `loading.tsx` (summary + cards); **empty state** = "All clear" (green).

HCI/perf: severity-toned cards (destructive/warning tokens only), pagination keeps the
DOM light, keyboard-navigable, no entrance animation (Rule 9).

## Manual verification checklist

- Tab bar shows Overview · Needs attention · Staff · Reasons · Alerts.
- Needs attention: red items first, each with a why sentence, location + staff, $/%,
  and an "Email manager" button that opens a prefilled email (or the Settings link when
  no manager email); "All clear" green state when nothing is flagged.
- Its own skeleton on tab switch; light + dark; mobile.

## Acceptance Criteria

- [x] Attention tab added; cards show State (severity) · Reason (why) · Action (email).
- [x] One-click prefilled `mailto:` to the location manager; Settings fallback when unset.
- [x] Skeleton + pagination + empty state.
- [x] `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` green.

## Patches

- **Phase 2 — in-app send (backend SPEC-143).** The action moved from `mailto:` to an
  in-app compose flow: the card's "Email {manager}" now links to
  `/discounts/attention/send/[orderId]`, which renders the shared **`ComposePanel`**
  (draft `/discounts/attention/draft`, send `/discounts/attention/send`, history
  `/discounts/attention/history`) — review, edit, AI-rewrite, and send without leaving
  the app. `DiscountAttentionItem` gains `sent_at`; a sent item shows an "Emailed {date}"
  badge and the button reads "Email … again". Reuses ComposePanel + the manager-email
  send infra — no new UI component.

- **Removed the duplicate "Alerts" tab (client-directed).** The Alerts tab
  (`/discounts/alerts`) rendered the same flagged discounts as Needs attention — both
  bind to the backend's one `_classify` engine — so it was a strict subset of Needs
  attention (which adds the WHY sentence + the email action). Removed the tab entry
  (`lib/discount-tabs.ts`), its `DiscountTab` union member, its `TAB_DESCRIPTION` entry,
  and the `/discounts/alerts` route (`page.tsx` + `loading.tsx`). The Overview tab keeps
  its top-10 alerts summary (still uses `AlertsList` + `getDiscountAlerts`, so both are
  retained); the backend `/discounts/alerts` endpoint is untouched. Tab bar is now
  Overview · Needs attention · Staff · Reasons.

- **Filters (client-reported).** The Needs-attention queue now filters by **severity**
  (All / Urgent / Review segmented control) and **location** (a `Select` populated from
  the items' distinct locations) — client-side over the already-loaded items, resetting
  pagination on change, with a "No discounts match these filters" empty state and a
  "N of M shown" header when filtered. Added a **timeframe** filter (Any time / Last 24h / 7d / 30d, over each item's `created_at`) and a **sort** (Most urgent / Newest / Largest discount); "now" is snapshotted at mount to keep render pure.
