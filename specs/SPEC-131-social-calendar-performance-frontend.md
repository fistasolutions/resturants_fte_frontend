# SPEC-131 — Social Growth: live Calendar & Performance tabs

Status: implemented
Repo: `ecommerce-fte-frontend`
Depends on: SPEC-110 (Social Growth MVP), SPEC-123 (Social Growth live), backend Social
Calendar/Performance/Schedule endpoints (already built).
Governs: `docs/prd.md` (Social Growth), `docs/Design.md` (design system, Rule 9), root
Rules 3/4/6/7/8/9.

## Problem

Overview, Content Studio, and Approvals are live (SPEC-123, `serverApi`). Calendar and
Performance still render Phase-1 mock fixtures (`mockCalendar` / `mockPerformance`) through
`services/social.ts`. The backend now exposes real Calendar, Schedule, and Performance
endpoints, so both tabs must go live end-to-end, matching the existing Social Growth design
language exactly (reuse `features/social/*` components — `kpi-tile`, `social-pills`,
`product-thumb`, `card`, shadcn `Calendar`/`Popover`), with honest empty states and **no
fabricated metrics** (Rule 6/8) and **no entrance animations** (Rule 9).

## Live backend contract (authoritative, camelCase — types mirror it EXACTLY)

`GET /social/calendar` → `{ posts: CalendarPost[] }` (approved + scheduled only):
```
CalendarPost = {
  id: string; productName: string; channel: string;
  status: "approved" | "scheduled"; persona: string; pillar: string;
  imageUrl: string | null; scheduledFor: string | null;  // "YYYY-MM-DD"
  trackedLink: string | null                              // UTM'd product URL
}
```
Dated posts (`scheduledFor != null`, `status:"scheduled"`) bucket onto the month grid;
undated approved posts (`scheduledFor == null`) form the "Ready to schedule" rail.

`POST /social/posts/{id}/schedule` — body `{ "date": "YYYY-MM-DD" | null }` → returns ONE
`CalendarPost`. A date → `status:"scheduled"`; `null` → unschedules to `status:"approved"`.
Errors: 404 `social_post_not_found`, 409 `social_post_not_schedulable`, 422 malformed date.

`GET /social/performance` →
```
{ funnel: { generated, inReview, approved, scheduled, published },
  byChannel: { channel: string; count: number }[],
  contentMix: { reason: string; count: number }[],   // best_seller | new_drop | dead_stock
  attribution: { windowDays: number; attributedOrders: number; attributedRevenue: number;
                 topPosts: { id, productName, channel, attributedOrders, attributedRevenue }[] },
  platformConnected: boolean }                         // false for now
```

## Design / decisions

1. **Types (`types/social.ts`)** — replace the old `CalendarPost`/`CalendarDay`/`CalendarData`
   and `PerformanceData`/`TopPostRow`/`FollowerPoint`/`PostStatus` with the contract above:
   `CalendarPostStatus`, `CalendarPost`, `CalendarData`, `SocialFunnel`, `ChannelCount`,
   `ContentMixCount`, `AttributedPost`, `SocialAttribution`, `PerformanceData`. No `any`.
2. **Service (`services/social.ts`)** — `getSocialCalendar`/`getSocialPerformance` now call
   `serverApi("/social/calendar")` / `("/social/performance")`, matching the other three
   live tabs. `lib/mock/social` `mockCalendar`/`mockPerformance` are updated to the new
   shapes but kept ONLY as Vitest fixtures — no service or component renders from them.
3. **Client action (`services/social-actions.ts`)** — add `schedulePost(id, date | null)`,
   POSTing `{ date }` through `/api/proxy` (mirrors `approveSocialPost`), returning the
   updated `CalendarPost`; backend error messages surface via the shared `post()` helper.
4. **Pure logic** for Vitest (node env — Rule 4):
   - `lib/social-calendar.ts`: `readyToSchedule`, `scheduledPosts`, `groupPostsByDate`,
     `buildMonthGrid(year, month, byDate, todayISO)` (Sunday-first weeks, UTC-based so it
     is TZ-stable), `monthTitle`, `initialMonth`.
   - `lib/social-performance.ts`: `funnelStages(funnel)` (percent relative to `generated`,
     honest labels), `barRows(items, getCount)` (percent-of-max for bar widths).
   - `lib/social.ts`: dead `engagementTone`/`EngagementTone` removed (only the old
     Performance table used it).
5. **Calendar tab (`features/social/calendar-tab.tsx`, `"use client"`)** — a real content
   calendar: month grid (default) with a **Month / List** toggle and prev/next/Today month
   nav. Each day cell shows its scheduled posts as compact cards (product thumb + channel
   pill + schedule-status chip). A **Ready to schedule** rail lists undated approved posts.
   Scheduling uses a shadcn `Calendar` in a `Popover` (click a card → pick a day); the same
   popover offers **Reschedule** and **Unschedule (clear)** for dated posts. **Optimistic
   update with reconcile + rollback on error** and per-post pending state. Each card offers
   **Copy tracked link** when `trackedLink` is present. Empty state when there are no posts.
   Tokens only, both themes, keyboard-accessible (real buttons/popovers), responsive.
6. **Performance tab (`features/social/performance-tab.tsx`)** — value-oriented, honest:
   - **Pipeline funnel** (Generated → In review → Approved → Scheduled → Published) as
     token-based bars (`funnelStages`).
   - **By channel** + **Content mix** breakdowns as labelled bar rows (`ChannelBadge` /
     `ReasonChip` + count + `barRows` width).
   - **Revenue from social** headline: `attributedRevenue` + `attributedOrders` KPI tiles
     with the `windowDays` context, plus a **top attributed posts** list. Honest zero state
     when `topPosts` is empty.
   - **Reach & engagement** gated by `platformConnected`: false → "Connect Instagram/TikTok
     to unlock reach & engagement" nudge (link to /integrations). NEVER fabricate reach/likes.
7. **Pills (`features/social/social-pills.tsx`)** — `ChannelBadge`/`ReasonChip` made robust
   to the contract's free-form `string` (unknown channel → Globe + title-cased label;
   unknown reason → neutral chip). Old `StatusPill`/`PostStatus` removed (unused after the
   Calendar rewrite; only social's calendar-tab consumed them — ads/spotlight have their own).

### Deviation from the brief — "Copy caption"

The brief asked for **Copy tracked link** and **Copy caption**. The authoritative
`GET /social/calendar` payload contains **no caption field** (only id, productName, channel,
status, persona, pillar, imageUrl, scheduledFor, trackedLink). Synthesising caption text on
the client would fabricate content, which Rule 6/8 forbid. Therefore only **Copy tracked
link** (real UTM data — the genuine manual-posting bridge) ships. Captions are copied from
Content Studio / Approvals, where they are actually generated. If the contract later adds a
caption field, a Copy caption action is an additive follow-up.

## Files

- `types/social.ts` — Calendar + Performance interfaces to the contract.
- `services/social.ts` — Calendar/Performance now live via `serverApi`.
- `services/social-actions.ts` — `schedulePost(id, date|null)`.
- `lib/social-calendar.ts` (new) — calendar bucketing + month grid (pure).
- `lib/social-performance.ts` (new) — funnel + bar-row logic (pure).
- `lib/social.ts` — remove dead `engagementTone`.
- `lib/mock/social.ts` — `mockCalendar`/`mockPerformance` to new shapes (Vitest fixtures only).
- `features/social/calendar-tab.tsx` — real interactive calendar.
- `features/social/performance-tab.tsx` — real performance dashboard.
- `features/social/social-pills.tsx` — string-robust badges; drop StatusPill.
- `tests/social-calendar.test.ts` (new), `tests/social-performance.test.ts` (new),
  `tests/social.test.ts` (updated to new fixture shapes; engagementTone block removed).

## Acceptance criteria

1. `GET /social/calendar` and `GET /social/performance` are consumed live via `serverApi`;
   no component/service renders mock data. — **done**
2. Types match the camelCase contract exactly; no `any`; `npx tsc --noEmit` clean. — **done**
3. `schedulePost(id, date|null)` POSTs `{date}` through the proxy and returns the updated
   post; backend 404/409/422 messages surface to the user. — **done**
4. Calendar: month grid + list toggle + month nav; scheduled posts on the correct days;
   ready-to-schedule rail; schedule / reschedule / unschedule with optimistic update, server
   reconcile, and rollback on error; Copy tracked link when present; empty state. — **done**
5. Performance: funnel, by-channel, content-mix, attribution KPIs + top posts (with honest
   zero state), and platform-gated reach/engagement nudge with no fabricated metrics. — **done**
6. Tokens only (no hardcoded colors), both themes, responsive, keyboard-accessible; no
   entrance animations (Rule 9). — **done** (manual checklist below)
7. `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` all green. — **done**

## Manual verification checklist (UI — no jsdom runner)

- [ ] `/social?tab=calendar`: scheduled posts appear on their dates; Month/List toggle works;
      prev/next/Today month nav works; Ready-to-schedule rail lists undated posts.
- [ ] Schedule a ready post (pick a day) → it moves into the grid optimistically and stays
      after the server responds; Reschedule moves it; Unschedule returns it to the rail.
- [ ] Force a schedule error (offline) → the card rolls back and an inline error shows.
- [ ] Copy tracked link copies the UTM URL; button only shows when trackedLink is present.
- [ ] Empty calendar (no posts) shows the "approve posts in Content Studio" empty state.
- [ ] `/social?tab=performance`: funnel bars, by-channel + content-mix rows, attribution
      tiles with the 90-day window; empty topPosts shows the honest zero state; reach section
      shows the connect nudge while `platformConnected` is false.
- [ ] Both tabs verified in light and dark themes; nothing animates in on load/scroll;
      keyboard: tab to every button/popover, Enter/Space activate, Esc closes popovers.
- [ ] Responsive at mobile / tablet / desktop (grid collapses, rail stacks, tables scroll).

## Patches
```
