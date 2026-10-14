# SPEC-234 — "Open Settings" deep-links to the missing recipient

**Date:** 2026-09-12 · **Repo:** frontend · **Status:** implemented
**Backend counterpart:** `SPEC-242-draft-location-id.md` (adds `location_id` to
bulk `locations[]` and to the discount-review draft)

## Problem (HCI)

Every send page shows a "Manager email required → Open Settings" warning when the
recipient is not configured. The button goes to `/settings`, which is the
**General** tab. The field actually lives on the **fourth** tab (Manager
Notifications), in one of many location rows — or in the Warehouse / Support /
Returns card below them. The owner lands somewhere unrelated, has to find the
tab and the row, and after saving has no way back to the message they were
sending except retracing the navigation by hand.

## Behaviour

1. **The button goes to the exact field.** Both compose panels link to
   `/settings/manager-notifications?focus=<target>&return=<path>` where
   `focus` is `location-<id>` for a per-location manager, or `warehouse`,
   `support`, `returns` for the store-level contacts, and `return` is the page
   the owner is on (path + query, so order filters survive).
2. **The URL says where you are.** The Settings tab bar shows Manager
   Notifications active because the route *is* `/settings/manager-notifications`
   — nothing is faked client-side; reload/bookmark/share all land on the same
   tab.
3. **The field is highlighted.** The targeted row/card scrolls into view
   (centred), gets a `ring-2 ring-primary` highlight, and its input receives
   keyboard focus so the owner can type immediately. The highlight clears the
   moment the owner edits or saves.
4. **Save takes you back.** When `return` is present, a successful save
   navigates (`router.push`) to that page — the compose panel remounts and
   refetches its draft, so the recipient is now filled in. A "Back to …" button
   in the highlighted card offers the same route without saving.
5. **Browser Back still works.** Every hop is a normal `<Link>` / `push` — no
   `replace` — so Back from Settings returns to the send page, and Back from the
   send page returns to Settings, exactly as the history was built.
6. **Only safe return paths are honoured.** `return` must be a same-origin
   relative path (`/…`, not `//…`, no scheme); anything else is ignored and the
   save behaves as today.

### Which flow points where

| Compose page | `recipientSetting` |
| --- | --- |
| `/orders/review/send/[locationKey]` | `location` · id from route |
| `/brief/overdue/send/[locationKey]` | `location` · id from route (`null` when unattributed) |
| `/brief/traffic/send/[locationId]` | `location` · id from route |
| `/inventory/transfers/review/send/[locationId]` | `location` · id from route |
| `/inventory/dead-inventory-alerts/[productId]/[locationId]/send` | `location` · id from route |
| `/discounts/attention/send/[orderId]` | `location` · id from the draft (`location_id`, SPEC-242) |
| `/warehouse/backlog/send` | `warehouse` |
| `/team-performance/agents/[id]/review` | `support` |
| `/returns/backlog/send` | `returns` |
| Bulk send-all (orders / overdue / transfers) | per row, `location` · id from `locations[i].location_id` |

## Implementation

- `lib/recipient-settings.ts` (new, pure, Vitest-covered):
  `RecipientSetting` union, `MANAGER_NOTIFICATIONS_PATH`,
  `recipientFocus(setting)` → `"location-12" | "warehouse" | …`,
  `recipientSettingsHref(setting, returnTo)`, `parseFocus(raw)`,
  `parseReturnPath(raw)`, `withLocationId(setting, id)`.
- `types/compose.ts`: `ComposeLocation.location_id: number | null`;
  `ComposeDraft.location_id?: number | null`.
- `components/shared/compose-panel.tsx`: new required prop `recipientSetting`;
  the warning's link is `recipientSettingsHref(withLocationId(setting,
  draft.location_id), currentPath)` where `currentPath` comes from
  `usePathname()` + `useSearchParams()`. Message text names the actual
  setting ("Add a manager email for this location" / "Add the warehouse
  manager's email" …).
- `components/shared/compose-bulk-panel.tsx`: per-row link from
  `location.location_id`; rows keyed by id.
- `features/settings/settings-tab-views.tsx` `SettingsManagerNotificationsTab`
  reads `focus`/`return` from `useSearchParams()` and passes
  `{ focused: boolean, returnTo: string | null }` to the four cards.
- `features/settings/location-managers-card.tsx` + the three store-level cards:
  accept `focused` / `returnTo`; scroll + ring + input focus on mount when
  focused; on a successful save with `returnTo`, `router.push(returnTo)`; the
  focused card shows a "Back to sending" link to `returnTo`.
- The nine compose pages/views pass `recipientSetting`.

## Acceptance criteria

- [x] From `/orders/review/send/75397202150` (no manager email) → Open Settings
  → URL is `/settings/manager-notifications?focus=location-75397202150&return=…`,
  the Manager Notifications tab is active, that location's row is highlighted
  and its input focused.
- [x] Saving the email navigates back to the send page; the recipient is filled.
- [x] Browser Back from Settings returns to the send page with its filters.
- [x] Bulk send-all pages link each skipped row to its own location.
- [x] Warehouse / support / returns pages link to their own card.
- [x] `return=https://evil.example` and `return=//evil` are ignored.
- [x] `npm test`, `npx tsc --noEmit`, `npm run build` green.

## Tests

`tests/recipient-settings.test.ts` — href building for each kind, focus
round-trip, return-path validation (relative only), `withLocationId` upgrade.

## Manual checklist (no component runner)

- Light + dark: the highlight ring is visible on the row and on each card.
- Keyboard: after landing, typing goes straight into the highlighted input.
- Reload on the deep-linked URL keeps tab + highlight.
- Saving then Back returns to Settings (history intact).
