# SPEC-229 — `/docs`: the in-app product documentation

Status: implemented
Depends on: SPEC-003 (sidebar), SPEC-112/SPEC-152 (the persistent tab-shell pattern
every workspace uses), SPEC-227 (the error boundaries this route inherits)
Governs: root `CLAUDE.md` **ABSOLUTE RULE 11** (docs are part of "done") — added with
this spec.

## Problem

The platform has 23 sidebar destinations and well over a hundred routes, and the only
way to learn what any of them does is to open it against live data and guess. The
August "Platform Guide" `.docx` covered 14 modules and is already a month stale —
Spotlight, Social Growth, Performance Ads, Foresight, Sales & Tax, AI Performance and
System post-date it, and half the tabs inside the older modules do too.

The ask (owner, 2026-09-11): a **Docs** tab in the app, with **sub-tabs per feature**,
where every feature is explained the way a good onboarding would — *what it is, how it
works, the value it creates, the benefit, how to use it* — with the actual screen shown
beside the words, so that someone who reads the docs before touching the software
already knows all of it. And a standing rule that every future feature updates them.

## Placement

A sidebar entry **Docs** (`/docs`, `BookOpen` icon) at the bottom of the nav, after
Settings — reference material sits last, the way every product does it. It is a real
route inside the app shell, not an external site: it is read by the same people, in the
same session, with the same theme.

## Information architecture — tabs, then sub-tabs

The owner asked for "a tab docs, and in that sub tabs according to tabs of feature".
Twenty-four flat tabs would overflow any screen, so the sub-tabs are **two tiers**,
both always visible, both real links:

1. **Area tabs** (underline tab bar, same chrome as Store Traffic / Foresight):
   `Start here · Command Center · Merchandising · Operations · Customers & Support ·
   Growth · Outcomes & Platform`.
2. **Feature pills** under the active area — one per sidebar destination in that area.
   Clicking a pill opens `/docs/<slug>`; the active area is derived from the active
   feature, so deep links land on the right tier.

| Area | Features (one doc each — the slug is the route segment) |
| --- | --- |
| Start here | `overview` (`/docs` itself) |
| Command Center | `brief`, `dashboard`, `chat`, `reports` |
| Merchandising | `products`, `inventory`, `foresight` |
| Operations | `orders`, `warehouse`, `returns`, `discounts`, `tax-reports` |
| Customers & Support | `customers`, `team-performance`, `traffic` |
| Growth | `spotlight`, `social`, `ads` |
| Outcomes & Platform | `results`, `ai`, `system`, `integrations`, `settings` |

Every enabled `navItems` entry except `/docs` itself maps to exactly one doc, and a
Vitest case fails the build when one is missing — that is how Rule 11 is enforced
mechanically rather than by memory.

## The overview (`/docs`)

Read first, and written for someone who has never opened the app:

- **What Ecommerce FTE is** — an AI Business Analyst on one Shopify store, and the
  three principles every page obeys: the backend calculates, the AI interprets, a human
  approves before anything leaves.
- **How it works, end to end** — a five-step strip: connected systems → 15-minute
  read-only sync into Postgres → the analytics engine computes every figure → the AI
  turns figures into verdicts and drafts → you decide, and the outcome is measured.
- **Connected systems** — Shopify, Gorgias, Loop Returns, Klaviyo, iPacky, V-Count,
  Google Search Console, Microsoft Clarity, Meta, email, and the AI model providers —
  each with what it feeds.
- **Conventions you will see everywhere** — the date-range picker, tab workspaces,
  Review & Send, verdict pills, "AI read" callouts, data-trust caveats, the sign-in
  screen, theme toggle, sidebar collapse.
- **Your first ten minutes** — a reading order: Morning Brief → Dashboard → Chat →
  one analyst page → Settings.
- **Every feature, by area** — index cards linking to each doc with its tagline.

## A feature doc (`/docs/[slug]`)

Every feature doc has the **same shape**, in the same order, so a reader can skim any
of them the same way. The shape is a TypeScript interface (`types/docs.ts`), so a doc
cannot be saved with a section missing:

| Section | What it holds |
| --- | --- |
| Header | title, one-line tagline, area, **Open in app →** link to the route, data-source chips, last-updated date |
| Hero screen | the feature's landing screen, captioned |
| What it is | 1–3 paragraphs in plain language |
| Why it matters | 2–4 business-value cards: the problem, and what this changes |
| How it works | the mechanism as numbered steps — where the data comes from, what the backend computes, what the AI does, what the human does |
| Screens & tabs | one block per tab / sub-screen: title, route, what it shows, bullet details, its screenshot where one exists |
| How to use it | a numbered tutorial |
| Benefits | a checklist of outcomes |
| Good to know | limits, cadence, prerequisites, what it deliberately does not do |
| Related | links to sibling docs, plus previous / next across the whole set |

A right rail on wide screens carries "On this page" anchors and the quick facts (route,
sources, refresh cadence). On narrow screens it folds above the article.

### Screens

Screenshots are real captures of the live app (`ref/screens/full-2026-09-04`,
`system-2026-09-11`, `daily-2026-09-10`, `weekly-2026-09-05`), downscaled to 1440px
WebP by `tools/build_docs_screens.py` at the monorepo root and committed under
`public/docs/`. A figure renders in a framed card **clamped to ~34rem** with a fade,
and an **Expand** button opens the full-height capture in a dialog — a 4,000px-tall
inventory page must not become 4,000px of article. Every image has real `alt` text.

`lib/docs/screens.ts` is the registry (`key → src, width, height`); a doc references a
screen by key, and the test suite fails if a key has no file, a file has no key, or a
doc references a key that does not exist.

Where a tab shipped after the last capture (Inventory → Cash Release / Allocation,
Store Traffic → Staffing, Sales & Tax → Nexus Watch) the doc says so and shows the text
without a screen rather than a stale or wrong one; recapturing is a follow-up, not a
reason to omit the tab.

## Where the code lives

1. `types/docs.ts` — `FeatureDoc`, `DocSection`, `DocValue`, `DocArea`, `DocScreen`.
2. `lib/docs/index.ts` — `DOC_AREAS`, `FEATURE_DOCS` (ordered), `getDoc`,
   `docsForArea`, `docNeighbors`, `activeDocSlug(pathname)`, `activeDocArea`,
   `docHref`, `docSourceLabel`. Pure, Vitest-covered.
3. `lib/docs/screens.ts` — the screen registry.
4. `lib/docs/content/<slug>.ts` — one file per feature, the prose. This is the file a
   future feature edits (Rule 11). Data only — no logic — in the sanctioned
   `lib/mock/`-style data-module pattern.
5. `features/docs/` — `docs-shell.tsx` (header + two-tier tabs, client, persistent via
   the route layout), `docs-tabs.tsx`, `doc-article.tsx`, `doc-screen.tsx` (figure +
   expand dialog), `doc-rail.tsx`, `doc-pager.tsx`, `docs-overview.tsx`,
   `overview-*.tsx` parts.
6. `app/(app)/docs/layout.tsx`, `page.tsx`, `[slug]/page.tsx` (`generateStaticParams`
   over `FEATURE_DOCS`; unknown slug → `notFound()`).
7. `lib/navigation.ts` — the Docs entry.
8. `public/docs/*.webp` — the screens.
9. Root `tools/build_docs_screens.py` — the screenshot pipeline (reads `ref/screens/`,
   writes `public/docs/`, prints the registry block to paste into `screens.ts`).

## What the page must not do

- **Never invent behaviour.** Every sentence describes what the code does today; a
  planned capability is either absent or explicitly labelled as not built. When a doc
  and the app disagree, the doc is wrong and is fixed with the feature that changed it.
- **No numbers from the store.** The screenshots carry real figures because they are
  the product; the prose does not repeat them as facts, because they change daily.
- **No fetches.** The docs are static content; the route makes no API call.

## Loading, empty and error states (root Rule 6)

- No data fetch, so no skeleton: the article renders in its final position.
- An unknown slug renders the SPEC-227 `(app)/not-found.tsx` inside the shell.
- A doc with no screen for a tab renders the text block and a muted "no capture yet"
  note, never an empty frame.

## Design (root Rule 9)

Semantic tokens only, both themes verified. Article measure capped (`max-w-3xl`) for
readability, `font-heading` for section titles like the rest of the app, 8px spacing,
16px card radius on figures and value cards. No entrance animation. Tab bars scroll
horizontally inside their own container; the page never scrolls sideways. Screens
are `next/image` with explicit dimensions so nothing shifts as they load.

## Governance — root CLAUDE.md ABSOLUTE RULE 11

Added with this spec: **every feature or tab change updates its doc in the same
change.** New sidebar destination ⇒ new `lib/docs/content/<slug>.ts` + registry entry
(the coverage test fails otherwise). New or changed tab ⇒ its `sections` entry. New
screen ⇒ recapture, run `tools/build_docs_screens.py`, add the registry row. Bump the
doc's `updated` date. Not done until the doc is.

## Acceptance criteria

1. `Docs` appears in the sidebar and is active on `/docs` and `/docs/*`. — done
2. `/docs` renders the overview with the seven area tabs; each area shows its feature
   pills; every pill opens its doc. — done
3. Every enabled nav item except `/docs` has a doc, and `tests/docs.test.ts` fails
   when one is missing. — done
4. Every doc has every section populated (interface + test). — done
5. Every referenced screen key exists in the registry and on disk; no orphan files. — done
6. Tall screens are clamped with an Expand dialog; every image has alt text. — done
7. Unknown slug → in-shell not-found. — done
8. Both themes correct; no entrance animation; no horizontal page scroll at 400px. — done
9. `lib/docs/index.ts` helpers Vitest-covered. — done
10. `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` pass. — done
11. Root `CLAUDE.md` gains Rule 11; `docs/MEMORY.md` records the day. — done

## Manual verification (no jsdom runner — root Rule 4)

- [x] `/docs` in light and dark: header, area tabs, pills, overview sections. (2026-09-11, live app)
- [x] Articles verified live: `/docs/brief`, `/docs/inventory`, `/docs/foresight` — hero, all sections, rail, pager.
- [x] Expand a tall screen (Morning Brief hero); dialog scrolls, Esc closes.
- [x] 400px width: tabs scroll within their bar; `scrollWidth === clientWidth === 400`.
- [x] `/docs/does-not-exist` renders the in-shell not-found page with HTTP 404.
- [x] Sidebar `Docs` link present and active on `/docs/*`.
