# SPEC-148 — Returns: backlog supervision UI (detect → email → Results)

Status: implemented
Depends on: backend SPEC-149 (returns attention + backlog draft/send/history + returns outcome),
SPEC-146 (warehouse supervision UI pattern), SPEC-067 (Results)

## Problem

Returns Analytics only *reported* the returns queue. Bring it to the full ladder like
Warehouse/Support: flag an aging returns queue, let the owner email the returns lead to
clear it, and prove the queue dropped on Results.

## Design

Pure consumer of the new backend (Rule 8).

- **Recipient (Settings)**: `services/store.ts` surfaces `returnsEmail`; a new
  **`ReturnsEmailCard`** on Settings → Manager Notifications saves it via
  `PUT /settings/returns-email` (mirrors the warehouse/support cards).
- **Detect + act (Returns Overview)**: `types/returns.ts` gains `ReturnsAttention`. A new
  **`ReturnsAttentionCard`** (self-fetching client, like `ActionPlanCard`, so it never
  blocks the KPIs) hits `/loop/returns/backlog/attention` and — when the queue is aging —
  renders a severity-toned card with the `why` + an **"Email returns lead"** button →
  `/returns/backlog/send`. Renders nothing when clean or on error.
- **Send flow**: `/returns/backlog/send` renders the shared **`ComposePanel`**
  (draft/send/history at `/loop/returns/backlog/*`, `requestBody {}`).
- **Result**: `returns` threaded through `types/results.ts`, `lib/adapters.ts`, and a new
  **"Returns"** tab in `features/results/results-tabs.tsx` (`resolveLink` → `/returns`).

HCI/perf: self-fetching card (no blocking); semantic tokens; no entrance animation (Rule 9).

## Manual verification checklist

- Settings → Manager Notifications shows a **Returns Lead** email field; save/remove works.
- Returns → Overview: when returns are aging past 3 days, a severity-toned card appears with
  a reason + "Email returns lead" → compose → send. No card when the queue is clear.
- After sending, **Results → Returns** lists it (Too early < 24h, then Worked/No change).
- Light + dark; mobile; empty-recipient state.

## Acceptance Criteria

- [x] Returns attention card (reason + email action) from `/loop/returns/backlog/attention`.
- [x] Compose send page via shared ComposePanel; Settings returns-email field.
- [x] Results "Returns" tab wired (types → adapter → tabs → link).
- [x] `npm run lint`, `npx tsc --noEmit`, `npm test` (631), `npm run build` green.
