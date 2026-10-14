# SPEC-146 — Warehouse: backlog supervision UI (detect → email → Results)

Status: implemented
Depends on: backend SPEC-147 (backlog attention + draft/send/history + warehouse outcome),
SPEC-139 (Needs-attention + ComposePanel pattern), SPEC-067 (Results)

## Problem

The Warehouse page only *reported* the fulfillment backlog. Bring it to the full ladder
(stats → AI → **action → result**) the way Discounts did: flag an aging backlog, let the
owner email the warehouse manager, and prove the backlog dropped on the Results page.

## Design

Pure consumer of the new backend (Rule 8).

- **Recipient (Settings)**: `services/store.ts` surfaces `warehouseEmail` from
  `/settings/status`; a new **`WarehouseEmailCard`** on Settings → Manager Notifications
  saves it via `PUT /settings/warehouse-email` (mirrors the location-manager rows,
  `isValidEmail`).
- **Detect + act (Warehouse page)**: `types/warehouse.ts` `WarehouseBacklog` gains
  `attention {needs_attention, severity, aged_count, why}`. A new
  **`BacklogAttentionCard`** (severity-toned, tokens only) renders under the backlog
  panel when `needs_attention`, with the `why` sentence + an **"Email warehouse
  manager"** button → `/warehouse/backlog/send`.
- **Send flow**: `/warehouse/backlog/send` renders the shared **`ComposePanel`**
  (draft `/warehouse/backlog/draft`, send `/warehouse/backlog/send`, history
  `/warehouse/backlog/history`, `requestBody {}`) — review / edit / AI-rewrite / send;
  ComposePanel's own "manager email required" state covers an unset recipient.
- **Result**: `warehouse` threaded through `types/results.ts`, `lib/adapters.ts`
  (`ApiResults` + `adaptResults`), and a new **"Warehouse"** tab in
  `features/results/results-tabs.tsx` (`resolveLink` → `/warehouse`).

HCI/perf: no new client fetch on the Warehouse page (attention rides the existing
overview); semantic tokens; no entrance animation (Rule 9); keyboard-navigable.

## Manual verification checklist

- Settings → Manager Notifications shows a **Warehouse Manager** email field; save/remove works.
- Warehouse page: when the backlog has aged orders, a severity-toned card appears with a
  reason + "Email warehouse manager" → compose page → send. No card when the backlog is clean.
- After sending, **Results → Warehouse** lists it (Too early < 24h, then Worked/No change).
- Light + dark; mobile; empty-recipient state.

## Acceptance Criteria

- [x] Warehouse attention card (reason + email action) driven by `backlog.attention`.
- [x] Compose send page via shared ComposePanel; Settings warehouse-email field.
- [x] Results "Warehouse" tab wired (types → adapter → tabs → link).
- [x] `npm run lint`, `npx tsc --noEmit`, `npm test` (631), `npm run build` green.
