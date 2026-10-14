# SPEC-364 — Email Marketing and Customer Support screens, SaaS finish

**Status:** implemented 2026-10-09 · **Repo:** frontend · **Backend:**
`SPEC-372-email-marketing-saas-finish.md`, `SPEC-373-customer-support-saas-quick-wins.md`

## What FOC sees after this change

Unchanged. Its handling time reads 2 days, as today. Its store is apparel, so the advice block keeps
its ruler. The owner holds every permission, so no button changes.

## Changes

1. **Handling time in Settings.** Customer Support → Settings → Hours gains "Handling time
   (days)", a number from 1 to 30 bound to `hours.handlingDays`; it shows 2 when the backend sends
   none. It saves with the hours card through the existing `saveSettings`, and the view-only role
   state applies to it as to the rest of the card.
2. **Rule 13 polish.**
   - Customer Support: "Retry send" and "Mark done" in the conversation pane say why they are
     disabled for a role (the role's reason beside them).
   - Customer Support: "Connect Gorgias" on the settings connection card is a `RoleButton` with
     `integrations.manage`.
   - Email Marketing: "New campaign" is in a `RoleGate` for `email_marketing.manage`.
3. **No clothing icon for other trades.** The email preview's advice block shows a ruler only
   for an apparel store (the backend's `content.adviceBlock` already says which); otherwise a
   neutral info icon.
4. **Docs say what the code does (Rule 11).** `lib/docs/content/customer-support.ts`:
   - remove the claims the code does not do (iPacky, incoming transfers);
   - describe the handling-time setting;
   - say returns come from Loop when connected, else from Shopify refunds;
   - say size and fit apply to clothing stores;
   - say the agent pauses when it is switched off.
   `lib/docs/content/email-marketing.ts`: a changed Klaviyo account starts its helpers fresh.
   Bump `updated`.

## Acceptance criteria

1. Handling time is shown, validated (1–30) and saved with the hours card; missing reads 2.
2. The three Rule 13 items are gated as described; `tests/role-gate-coverage.test.ts` is green.
3. A general store's preview shows no ruler.
4. The docs match the code; `tests/docs.test.ts` is green.
5. `npm test`, `npx tsc --noEmit`, lint on touched files, `npm run build` green.

## Verification (2026-10-09)

| # | Criterion | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Handling time shown, validated, saved | done | `features/customer-support/settings/hours-card.tsx` over the pure `lib/support-handling.ts`; `tests/support-handling.test.ts` (missing reads 2, 1–30 whole numbers only) |
| 2 | Rule 13 items | done | `inbox/conversation-pane.tsx` (Retry and Mark done show the role's reason), `settings/connection-card.tsx` (`RoleButton` with `integrations.manage`), `campaigns/campaigns-tab.tsx` (`RoleGate` with `email_marketing.manage`; the empty state no longer points a read-only role at it); `tests/role-gate-coverage.test.ts` green |
| 3 | No ruler for other trades | done | `lib/email-blocks.ts` `adviceIcon` (the backend's advice label decides); `EmailPreview` takes `advice` everywhere it is drawn; `tests/email-marketing-store-type.test.ts` |
| 4 | Docs match the code | done | `lib/docs/content/customer-support.ts` (iPacky and incoming-transfer claims removed; handling time, returns without Loop, size and fit for clothing stores only, the switch); `lib/docs/content/email-marketing.ts` (a new account starts fresh; the subscribe permission); both `updated` 2026-10-09; `tests/docs.test.ts` green |
| 5 | test / tsc / lint / build | done | `npm test` **2,570 passed** (231 files); `npx tsc --noEmit` clean; `npm run lint` 0 errors (3 old warnings); `npm run build` compiled |

Also: the Topics tab opens no sheet for a topic the store does not have (size and fit on a store
that sells no clothing, backend SPEC-373), so a hand-typed `?topic=size_fit` link cannot crash it.
