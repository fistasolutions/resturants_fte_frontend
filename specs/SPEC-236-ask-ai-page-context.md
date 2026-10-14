# SPEC-236 — Ask AI knows the page it was opened on

**Date:** 2026-09-14 · **Repo:** frontend · **Status:** implemented
**Backend counterpart:** `SPEC-243-chat-page-context.md` (`POST /chat` accepts
`context`; ids are resolved to names there; the analyst prompt carries the platform map)

## Problem

The Ask AI drawer (SPEC-235) opens on every page but every question starts from
zero: "why is this down?" has no *this*, "what changed?" has no period, and on a
product page the owner has to type the product's name the page is already showing.

## Behaviour

1. **Every drawer message carries where it was asked from.** With the message, the
   drawer sends `context`: the route, the sidebar title of the page, the tab (from
   `?tab=` or the second path segment, humanised), the date range the URL names, and
   the product / order / location id the URL names. The `/chat` page sends nothing —
   it is its own page.
2. **Only what the URL actually says.** The range is sent only when the URL carries
   `range`, `period`, `from`+`to` or `date` (resolved with the same `resolveDateRange`
   the pickers use); a page on its silent default sends no range, and the analyst then
   behaves as before rather than being told a period the page did not name. Ids come
   from the known dynamic segments and the orders `location` filter; only numeric ids
   are sent (`online` and other keys are not ids).
3. **Prompts become subject-aware.** On a page about one product, order or store the
   four suggested prompts are about *this* product / order / store ("How is this
   product selling this month?", "Has this order shipped?", "How is this store
   converting?"); the context tells the analyst what "this" is. Everywhere else the
   route sets from SPEC-235 apply.
4. **Nothing else changes.** Same endpoint, same stream, same history; the stored
   message is what was typed.

## Implementation

- `types/chat.ts`: `ChatPageContext`, `ChatPageRange`.
- `lib/chat-context.ts` (new, pure, Vitest-covered): `pageContextFor(pathname,
  searchParams, todayISO)` → `ChatPageContext | null`; `humaniseSegment`;
  `SUBJECT_ROUTES` (the dynamic-segment table); `subjectOf(context)`.
- `lib/chat-drawer-prompts.ts`: `DRAWER_PROMPTS_BY_SUBJECT` + `promptsFor(pathname,
  context)` (subject set first, then route set, then the starters).
- `services/chat.ts`: `getAssistantReply(…, context?)` sends `context` in the body.
- `features/chat/use-chat-session.ts`: `send(text, context?)`.
- `features/chat/chat-drawer.tsx`: builds the context from `usePathname()` +
  `useSearchParams()` on every send and for the prompt rows.
- Docs (Rule 11): the chat doc's "Ask AI from any page" section and the overview
  convention describe the page-aware behaviour.

## Acceptance criteria

- [x] On `/inventory/dead-stock?range=7d` the drawer sends `page: "Inventory Analyst"`,
  `tab: "Dead stock"`, `range: {label: "Last 7 days", start, end}`.
- [x] On `/products/<id>` it sends `product_id` and the prompts are about this product;
  the live answer names the product without it being typed.
- [x] On `/dashboard` with no range in the URL, no `range` is sent.
- [x] On `/orders?location=online` no `location_id` is sent; with `location=<id>` it is.
- [x] On `/chat` nothing is sent (the drawer is suppressed there anyway).
- [x] `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` green.

## Tests

`tests/chat-context.test.ts` — page title from the sidebar, tab from `?tab=` and
from the path, range only when the URL names one, each subject route, non-numeric
ids ignored, orders `location` filter, unknown route → null, `subjectOf`;
`tests/chat-drawer-prompts.test.ts` — subject sets win over route sets.

## Manual checklist (no component runner)

- Product page → open drawer → prompts name "this product"; ask "why is this
  slipping?" → the reply names the product.
- Inventory with a 7-day range → ask "what changed?" → the reply's period is 7 days.

## Verification (2026-09-14)

`npm test` 120 files / 1469 tests (new `tests/chat-context.test.ts`, 22 cases), `npx tsc --noEmit`, `npm run lint` (0 errors), `npm run build` green. Live (Playwright): on `/products/5641121169571` the four prompts were the product set, the request carried `{route, page: "Product Analyst", product_id}` and the answer named the product; on `/inventory?range=7d` the request carried `range: {label: "Last 7 days", start, end}` and the answer covered seven days; no range was sent on a default-range page. Zero page errors.
