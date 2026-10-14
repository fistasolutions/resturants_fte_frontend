# SPEC-229 — Persistent shells for `/system` and `/ai`

Status: implemented
Depends on: SPEC-112 (the Store Traffic shell this copies), SPEC-226 (`/ai`),
SPEC-228 (`/system`)

## Problem

**Fourteen sections of the app hold their header in a `layout.tsx`. `/system` and `/ai`
are the only multi-route sections that do not.**

Both were shipped as standalone pages that each draw their own `PageHeader`. So moving
from `/system` to `/system/runs`, or from `/ai` to a trace, throws the header away and
rebuilds it — the title, the description and the controls all unmount and remount even
though nothing about them changed. It flickers, and it is inconsistent with every other
section in the product.

Store Traffic is the reference: one `layout.tsx` renders `TrafficShell`, which holds the
header, the date picker and the tab bar; only the content beneath the tabs swaps. The
active tab underline moves **instantly** on click, before the new tab's data arrives,
because the tab bar never unmounted.

## What this builds

The same shell, twice.

### `/system` — header + tab bar

| Tab | Route |
| --- | --- |
| Overview | `/system` |
| All runs | `/system/runs` |

The header ("System", its description) and the tab bar live in the layout. `/system` and
`/system/runs` become pure content.

`/system/[jobId]` — one job's run history — is **not** a tab. It renders bare, exactly
as Store Traffic's `stores/[locationId]` does, because it carries its own breadcrumb and
its own job title: a section header above a page that already says "Shopify sync" would
be two headers arguing.

### `/ai` — header + period picker

`/ai` has **one** tab route today, so it gets the shell without a tab bar. A tab bar with
one tab is decoration, and adding a second tab would mean inventing a traces *list* page
this spec has no mandate for. What the shell fixes here is real regardless: the title, the
description and the period picker stop being rebuilt on every navigation, and the picker
is declared once instead of being wired into the page body.

`/ai/traces/[traceId]` renders bare, same reasoning as above.

### The mechanism, copied exactly

`if (activeTab === null) return <>{children}</>` — the shell renders its chrome only on
the routes it owns, and gets out of the way everywhere else. That one line is what keeps a
detail page from inheriting a header it does not want, and it is why this pattern has
survived fourteen sections.

## A bug this surfaced

`features/system/run-table.tsx` links a run's AI trace to **`/ai/traces?trace=<id>`**.
There is no `/ai/traces` route — only `/ai/traces/[traceId]` — so every one of those
links 404s. Introduced with SPEC-228 and never clicked, because no job had produced a
trace yet. Corrected to `/ai/traces/<id>`, and `lib/system-trace.ts` now owns the href so
it is covered by a test rather than typed into JSX.

## Scope

1. `lib/system-tabs.ts` — the tab model and routing helpers, framework-free and
   unit-tested: `SYSTEM_TABS`, `activeSystemTab(pathname)`, `systemTabHref(basePath,
   params)` carrying the active filters across a switch.
2. `features/system/system-shell.tsx` + `features/system/system-tabs.tsx`.
3. `app/(app)/system/layout.tsx`; header removed from `page.tsx` and `runs/page.tsx`.
4. `features/ai/ai-shell.tsx` + `app/(app)/ai/layout.tsx`; header and picker removed
   from `app/(app)/ai/page.tsx`.
5. `lib/system-trace.ts` — `aiTraceHref(traceId)`, and the 404 fixed.
6. `app/(app)/system/runs/loading.tsx` — the runs tab had no skeleton, so switching to
   it showed nothing until the fetch returned.

## What does not change

- **No new routes.** No traces list, no re-ordering of what exists.
- **Filters stay in the URL.** A tab switch carries `status` and `window` the way
  Store Traffic carries its date range, so the shell cannot lose a filter.
- **The period picker keeps its behaviour** — it is moved, not rewritten.

## Design (root Rule 9)

Tab bar identical to Store Traffic's: `border-b-2` underline on the active tab,
`text-muted-foreground` → `text-foreground` on hover, semantic tokens only, no entrance
animation. `aria-current="page"` on the active tab. The bar scrolls horizontally on
mobile rather than wrapping.

## Acceptance criteria

1. `/system` and `/system/runs` share one header and tab bar that never remount. — done
2. The active tab underline moves on click, before data arrives. — done
3. `/system/[jobId]` and `/ai/traces/[traceId]` render without the section chrome. — done
4. A tab switch preserves the active status/window filters. — done
5. `/ai` renders its header and period picker from the layout. — done
6. A run's AI trace link resolves instead of 404ing. — done
7. The runs tab has a skeleton. — done
8. All `lib/system-tabs.ts` logic is Vitest-covered. — done
9. `npm test`, `npx tsc --noEmit`, `npm run build` pass. — done

## Manual verification (no jsdom runner — root Rule 4)

- [ ] Click Overview ↔ All runs: the header does not flash, the underline moves instantly.
- [ ] Filter to Failed, switch tabs: the filter survives.
- [ ] Open a job from a card: breadcrumb + job title, no duplicate section header.
- [ ] `/ai` header and picker present; open a trace: no duplicate header.
- [ ] Both themes; mobile — tab bar scrolls, page does not.
