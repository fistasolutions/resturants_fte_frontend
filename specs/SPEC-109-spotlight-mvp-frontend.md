# SPEC-109 — Spotlight (Brand Visibility Engine) — MVP frontend

**Status:** MVP · frontend-only · mock data. No backend in this spec.
**Depends on:** PRD carve-out addendum 2026-08-11 (`docs/prd.md` Coming Soon). Owner-directed.

## What & why
Spotlight is a new product pillar: an AI brand-visibility / GTM engine. It builds a
cited **Brand Brain** (the foundation), runs an **Inbound Engine** that drafts SEO
content, gates every asset through **Approvals**, publishes to the brand's website,
and measures organic **Visibility**. Multi-store by construction (`store_id`-scoped),
like the rest of the platform.

This MVP ships the **frontend only**, on **mock data**, so we can validate the UX and
information design before building the backend (research/web-search/NLP, content
generation, publish-out, Search Console/GA4). It must look and feel **exactly like the
existing app** (Design.md tokens, shadcn, no Framer Motion) — not a bolt-on.

## Scope (in)
- One sidebar item **"Spotlight"** → `/spotlight` (`lib/navigation.ts`, `badge: "NEW"`).
- A `/spotlight` route with a **persistent shell** (header + URL-driven tab bar) in
  `layout.tsx`, active-tab content in `page.tsx` behind a keyed `<Suspense>` — mirrors
  the Returns pattern exactly (`?tab=` anchors, active underline `bg-primary`).
- **5 tabs:**
  1. **Overview** — the pipeline (Foundations → Intelligence → Messaging → Content →
     Distribution) with per-stage progress, KPI tiles, activity feed, next-best-actions.
  2. **Brand Brain** — the cited knowledge base (the star screen). Sections: Company ·
     Voice & guardrails (Tone, Prohibited claims) · Audience & Personas (ICP + personas)
     · Competitors · Markets & languages · Conversion goals · Content inventory ·
     Authors. Each fact carries a **source/provenance chip** and empty states invite
     "research fills this, or add one." A "Last confirmed <date> · Confirm now" header.
  3. **Inbound Engine** — query bank (clustered search intents mapped to a persona) +
     generated drafts (blog / LinkedIn) with an SEO-readiness score.
  4. **Approvals** — the human-in-the-loop: a draft preview (topic + article body +
     SEO gauge + publish target) with **Approve & publish** / **Request changes**; a
     queue of other pending assets. Reuses the Brief's review/compose feel.
  5. **Visibility** — reach metrics (impressions, clicks, avg position, indexed posts)
     + top-performing content table. "Connect Search Console" empty/estimated state.
- **Setup is NOT a tab** — it lives in the existing `/integrations` + `/settings`.
  Spotlight surfaces nudges that deep-link there.

## Provenance model (the core UI primitive)
Every Brand Brain fact is tagged with one source, rendered as a small chip using
**existing tokens only** (no invented colors):
| Source | Token treatment | Meaning |
| --- | --- | --- |
| `onboarding` | `bg-secondary text-secondary-foreground` | Captured once at onboarding |
| `measured` | `bg-success/10 text-success` | From live Shopify data — "I don't author these numbers" |
| `research` | `bg-muted text-foreground` + Sparkles icon | AI web-search / NLP fills it |
| `manual` | outline (`border-border text-muted-foreground`) | User added |
Empty sections show the "research fills this →" affordance (button is present; research
runs in a later backend phase — MVP does nothing on click beyond a toast/no-op).

## Design constraints (match the app — non-negotiable, root Rule 9)
- **Tokens only.** `--primary` is brand ink (near-black) for actions; `--brand` red is
  **identity-only** (never a CTA/status); `--success` `#008060`, `--warning` `#c86800`
  for status. **No indigo/violet or any color not in `globals.css`.**
- `font-heading` (Tenor Sans) for headings; `rounded-card` cards; shadcn `Card`,
  `Badge`, `Button`, `Table`, `Separator`, `Tooltip`, `Progress`(via div bar).
- **No Framer Motion, no entrance animations.** CSS hover/focus only.
- Loading/empty/error states on every tab; responsive desktop→mobile; keyboard-navigable
  tabs (real anchors, `role="tab"`).

## Architecture (mock discipline — root Rule 6 Phase-1 exception)
- `types/spotlight.ts` — all interfaces (the future API contract).
- `lib/mock/spotlight.ts` — realistic Example-Store mock data, typed to `types/`.
- `services/spotlight.ts` — the ONLY data seam; returns the mock now (async, so the
  real API drops in later without touching components). Components never import mock.
- `features/spotlight/*` — shell, tabs, and one component per tab + subcomponents
  (small, single-responsibility — no mega-file).
- `app/(app)/spotlight/{layout,page,loading}.tsx`.
- Isolated: nothing here is imported by existing pages; adding it cannot regress them.

## Acceptance criteria
- [ ] "Spotlight" appears in the sidebar (`NEW` badge) and routes to `/spotlight`.
- [ ] 5 tabs switch via `?tab=` anchors; active underline uses `bg-primary`; deep-linkable.
- [ ] Brand Brain renders all sections with provenance chips + at least one empty
  ("research fills this") state; "Confirm now" header present.
- [ ] Overview shows the 5-stage pipeline with progress + KPIs + activity.
- [ ] Inbound Engine shows query bank + drafts with SEO score.
- [ ] Approvals shows a draft with a working Approve/Request-changes interaction
  (client component; toast/state change, no backend).
- [ ] Visibility shows metrics + top-content table + an "estimated / connect" state.
- [ ] Zero hardcoded colors; zero Framer Motion; both themes verified.
- [ ] `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` all green.
- [ ] Manual verification checklist (no jsdom runner): each tab loads, tabs switch,
  approve interaction works, mobile layout holds.

## Patches

### 2026-08-12 — Visibility live + Google Search Console connect (backend SPEC-119, Slice 3b)
The **Visibility tab** now runs on **real Google Search Console reach** and a
full **GSC OAuth connect flow** was wired into the Integrations page. This is the
last mock tab (Overview aside) going live; numbers are never fabricated (Rule 8).

**Backend endpoints consumed** (via the same `serverApi` RSC seam + `/api/proxy`
client seam as the rest of Spotlight):
- `GET /integrations/google/status` → `{ connected, configured, email,
  property_url, last_pull }` (server read → `getGoogleStatus`).
- `GET /integrations/google/authorize-url` → `{ url }` (client → proxy).
- `POST /integrations/google/exchange { code }` → status (client → proxy).
- `DELETE /integrations/google` → status (client → proxy).
- `GET /spotlight/visibility` → `{ connected, email, property_url, window_days,
  last_pull, posts: [{ draft_id, title, live_url, impressions, clicks, ctr,
  position, estimated, top_queries: [{ query, impressions, clicks, ctr,
  position }] }] }` (server read → `getVisibility`, now live).

**Connect flow:** Integrations "Connect Google Search Console" → fetch
`authorize-url` → `window.location = url` → Google consent → redirect to the new
`/integrations/google-search-console/callback` route (matches the registered
redirect URI) → client exchanges `?code` via the proxy → `router.replace` to
`/integrations?google=connected` (or `…=error`), which the page reflects in a
dismissible banner. Disconnect is confirm-gated.

**Files** — **new** `services/google.ts` (`getGoogleStatus`),
`services/google-actions.ts` (`getGoogleAuthorizeUrl`/`exchangeGoogleCode`/
`disconnectGoogle`), `features/integrations/google-search-console-card.tsx`,
`.../google-connect-banner.tsx`, `.../google-callback-exchange.tsx`,
`app/(app)/integrations/google-search-console/callback/page.tsx`,
`tests/visibility-adapter.test.ts`; **edited** `types/spotlight.ts` (new
`GoogleStatus`/`PostReach`/`ReachQuery`/`VisibilityTotals` + real `VisibilityData`,
replacing the mock `VisibilityKpi`/`TopContentRow` shape), `lib/adapters.ts`
(`adaptGoogleStatus`, `adaptVisibility` + roll-ups), `services/spotlight.ts`
(`getVisibility` live), `lib/mock/spotlight.ts` (dropped `mockVisibility`),
`features/spotlight/visibility-tab.tsx` (real reach view + connect/awaiting-data
states), `app/(app)/integrations/page.tsx` (Google card + banner + status fetch),
`app/(app)/spotlight/page.tsx` (published branch merges best-effort reach),
`features/spotlight/published-tab.tsx` + `.../published-post-card.tsx`
(per-post impressions hint).

**Deviations / notes**
- **No aggregate KPIs from the backend.** `/spotlight/visibility` serves per-post
  reach only, so the tab's four KPI tiles (impressions, clicks, avg. position,
  indexed posts) are **pure display roll-ups** computed in `adaptVisibility` —
  sums, a count of measured (`estimated:false`) posts, and an **impression-weighted
  mean position** (a plain mean would over-weight low-reach pages). This is the
  same category of display aggregation as the existing `adaptChannels` share calc;
  it is unit-tested. Because no prior-period baseline is served, the tiles carry
  **no deltas** (never fabricated).
- **No `configured` flag on `/spotlight/visibility`.** The payload only exposes
  `connected`, so the Visibility empty state keys off `connected` and deep-links to
  the Integrations card (which does know `configured`). Not-connected → "Connect
  Google Search Console to see real reach"; connected-but-no-data → "No measured
  reach yet".
- **Published-tab reach is best-effort:** the published branch also calls
  `getVisibility()` behind its own `.catch(() => ({}))`, so an unconnected store or
  a Search Console hiccup never fails the Published tab — the impressions hint is
  simply hidden.
- **Integrations status is best-effort too:** `getGoogleStatus()` is caught on the
  page so a status error degrades the Google card to "unavailable" rather than
  blanking the whole Integrations page.

**Verification** — from `ecommerce-fte-frontend/`:
`npm run build` ✅ · `npx tsc --noEmit` ✅ (exit 0) · `npm run lint` ✅ (clean) ·
`npm test` ✅ (55 files, 421 tests).

### 2026-08-12 — Live wiring: Inbound Engine + Approvals + blog detail (backend SPEC-109)
The Inbound Engine and Approvals tabs now run on **real backend data** (backend
SPEC-109), and a clickable **blog-detail page** was added. Overview, Brand Brain
(already live, SPEC-108), and Visibility are unchanged — Overview/Visibility stay
on mock until their backends land.

**Backend endpoints consumed** (via the same `serverApi`/proxy seam as
`getBrandBrain`):
- `GET /spotlight/queries` → `{ queries: [{ id, keyword, monthly_volume, persona,
  intent, source }] }`. `monthly_volume` is `null` until Search Console (Slice 3);
  `intent` ∈ `high | seasonal | informational`; `source` = `derived`.
- `POST /spotlight/drafts` `{ query_id }` | `{ keyword }` → full draft payload
  (adds `sections: string[]`).
- `GET /spotlight/drafts?status=` → `{ drafts: [...] }`, each **without**
  `body_md`/`grounding`/`agent_trace` (list read).
- `GET /spotlight/drafts/{id}` → full draft incl. `body_md`, `grounding`
  `{ personaId, povPillar, guardrails_ok, products:[{product_id,title}] }`,
  `agent_trace: string[]`.
- `POST /spotlight/drafts/{id}/approve` · `/request-changes` → updated draft.
  Statuses: `in_review` → `approved` | `changes_requested`. Publish is Slice 2.

**Field-shape notes adapted precisely** (not guessed): grounding is stored with
mixed casing — `personaId`/`povPillar` already camelCase, `guardrails_ok` +
`products[].product_id` snake; `agent_trace` is a `string[]` (rendered as trace
sentences); list rows omit the heavy fields; an unknown status coerces to
`in_review`.

**Files**
- `types/spotlight.ts` — `SpotlightQuery`, `BlogDraft`, `BlogDraftGrounding`,
  `BlogDraftProduct`, `AgentTraceStep`, `BlogDraftStatus`, `InboundEngineData`.
- `lib/adapters.ts` — `Api*` shapes + `adaptSpotlightQuery`, `adaptBlogDraft`
  (pure, client-safe so the mutation service can reuse them).
- `lib/spotlight.ts` — `queryIntentLabel`, `draftReadMinutes`, `draftStatusLabel`,
  `seoToneLabel`.
- `services/spotlight.ts` — server reads `getQueries`, `getDrafts(status?)`,
  `getDraft(id)`, and the tab payloads `getInboundEngine` (parallel), `getApprovals`.
- `services/spotlight-actions.ts` — **new** client-safe mutations `generateDraft`,
  `approveDraft`, `requestChanges` (go through `/api/proxy`, matching the app's
  client pattern). Kept separate from `services/spotlight.ts` because that module
  is server-only (`serverApi`/`server-only`) and can't be imported client-side.
- `features/spotlight/` — rewrote `inbound-engine-tab.tsx` (real query bank +
  drafts, per-query Generate action) and `approvals-tab.tsx` (real `in_review`
  drafts); new `blog-detail.tsx`, `blog-markdown.tsx` (safe react-markdown, no raw
  HTML / no `dangerouslySetInnerHTML`), `draft-decision.tsx` (client Approve /
  Request-changes), `generate-draft-button.tsx`, `seo-gauge.tsx` (extracted, shared).
- `app/(app)/spotlight/draft/[id]/page.tsx` — **new** server-rendered detail route.
- `app/(app)/spotlight/page.tsx` — updated to the live tab payloads.
- `tests/spotlight-adapter.test.ts` — **new** node-safe unit tests for the adapters
  + display helpers (mirrors the brand-brain adapter test structure).

**Deviations**
- Back link uses `/spotlight?tab=inbound` (the real tab id) rather than the task's
  `?tab=engine`, which `normalizeSpotlightTab` would fall back to Overview.
- Approve is labelled **"Approve"** (not "Approve & publish") with a note that
  publishing to Shopify lands in the next slice — there is no publish endpoint yet.
- Mutation service functions live in `services/spotlight-actions.ts` (client-safe),
  not in `services/spotlight.ts` (server-only) — inlining them there would poison
  the `server-only` import boundary.
- `features/spotlight/asset-pills.tsx` and `lib/mock/spotlight.ts`'s
  `mockInbound`/`mockApprovals` are now unused by the live tabs but left in place
  (still valid, referenced by the mock module) — no behavior change.

**Verification** — from `ecommerce-fte-frontend/`:
`npm run build` ✅ (both new routes compile) · `npx tsc --noEmit` ✅ ·
`npm run lint` ✅ · `npm test` ✅ (52 files, 391 tests).

### 2026-08-12 — Slice 2b: real publishing + a "Published" tab (backend SPEC-118)
The Spotlight blog now **publishes to the live Shopify store**. Approve on the
blog-detail page pushes the article live; a new 6th **"Published"** tab manages
the live posts (unpublish / delete-from-site). Backend endpoints (SPEC-118):
`POST /spotlight/drafts/{id}/publish` · `/unpublish` · `DELETE
/spotlight/drafts/{id}/published` · `GET /spotlight/published`.

**Backend field shapes adapted precisely (read from the route/service, not the
task brief — they differ).**
- `GET /spotlight/published` → `{ posts: [...] }`, each post = the
  `publish_service._payload` shape **plus** a `live` flag:
  `{ id, title, handle, status, target_keyword, shopify_article_id,
  shopify_blog_id, article_handle, live_url, published_at, live }`. It does
  **NOT** carry `seo_score`, `persona`, or `image_url` (the task's assumed shape
  was wrong). `PublishedPost` therefore maps the real fields and treats
  `seoScore`/`persona`/`imageUrl` as **optional enrichment** — read through only
  if a later backend serializes them, otherwise `null`, never fabricated
  (Rule 8). The Published card degrades to a `ShoppingBag` thumbnail + the real
  `targetKeyword`/publish-date line; the SEO badge/persona show only if present.
- `publish`/`unpublish`/`delete-published` all return the same
  `publish_service._payload` (with `live_url`/`published_at`), so `BlogDraft`
  gained `liveUrl`, `publishedAt`, and an optional `live` flag; `BlogDraftStatus`
  gained `published | unpublished | draft`; `adaptBlogDraft`/`normalizeDraftStatus`
  now keep those and the adapter reads the publish columns.

**Approve → publish.** On `blog-detail`, `DraftDecision` was replaced by a new
`PublishDecision`: the primary button is **"Approve & publish"** → `publishDraft(id)`
(publishes to Shopify, status `published`), then shows a **"View live ↗"** link
(`live_url`, new tab) + **Unpublish**. `published` shows View-live + Unpublish;
`unpublished` offers re-publish; `changes_requested` keeps the refine banner;
`in_review`/`approved`/`draft` show Approve & publish + (unchanged) Request
changes. Failures surface inline. The **Approvals tab keeps** the old
`DraftDecision` (approve→approved) unchanged — the publish flow is detail-only.

**Published tab** (`features/spotlight/published-tab.tsx`, server-fetched via
`getPublished`): a **Blog-health strip** ("N posts live · Last published
{date}") over a list of `PublishedPostCard`s — thumbnail (next/image
unoptimized+fill or `ShoppingBag` fallback), title (→ draft detail), SEO badge
(when present), **View live ↗**, publish date, and **Unpublish** + **Delete from
site**, each behind an `AlertDialog` confirm ("Delete removes this post from your
live site"). Optimistic row removal on success; inline error on failure; a
`live: false` row shows a subtle "Not live" note (reconciled). Empty state: "No
posts are live yet — publish an approved draft to see it here."

**Files** — `types/spotlight.ts` (`PublishedPost`, `BlogDraft` publish fields,
extended `BlogDraftStatus`), `lib/adapters.ts` (`ApiPublishedPost` +
`adaptPublishedPost`, extended `DRAFT_STATUSES`/`ApiBlogDraft`/`adaptBlogDraft`),
`lib/spotlight.ts` (`published` tab id + status labels), `services/spotlight.ts`
(`getPublished`), `services/spotlight-actions.ts` (`publishDraft`,
`unpublishDraft`, `deleteFromSite`), `features/spotlight/spotlight-tabs.tsx`
(Published label), `.../inbound-engine-tab.tsx` + `.../blog-detail.tsx`
(status-class entries; blog-detail now uses `PublishDecision`), **new**
`.../publish-decision.tsx`, `.../published-tab.tsx`, `.../published-post-card.tsx`,
`app/(app)/spotlight/page.tsx` (published branch), `tests/spotlight-adapter.test.ts`
(publish fields + `adaptPublishedPost`).

**Deviations / notes**
- Button label is **"Approve & publish"** (SPEC-109 AC wording), not the task's
  bare "Approve" — it now publishes to Shopify, so the label is made truthful.
- **Backend payload inconsistency (frontend-only task, not fixed here):**
  `blog_service._payload` (`GET /drafts/{id}`, the detail read) omits
  `live_url`/`published_at`, whereas `publish_service._payload` includes them.
  So "View live" on the detail page is populated from the publish **response**
  and held in client state (persists across `router.refresh()` since the
  component isn't remounted), but a **cold reload** of an already-published
  draft's detail page cannot show View-live (backend returns no `live_url`
  there). The **Published tab is unaffected** — it reads `GET /spotlight/published`,
  which does carry `live_url`. A one-line backend fix (add `live_url`/`published_at`
  to `blog_service._payload`) would close the gap; left for the backend owner.
- `PublishedPost` intentionally has no SEO/persona/thumbnail data today because
  the backend doesn't send it; the UI renders those conditionally so it lights up
  automatically if the backend enriches the payload later.

**Verification** — from `ecommerce-fte-frontend/`:
`npm run build` ✅ · `npx tsc --noEmit` ✅ (exit 0) · `npm run lint` ✅ (clean) ·
`npm test` ✅ (54 files, 414 tests).

---

## Patches

### 2026-08-13 — Quality Harness scorecard on the blog detail (backend SPEC-121)

The draft read (`GET /spotlight/drafts/{id}`) now carries the quality-harness
output: `aeo_score` / `geo_score` / `quality_score` (nullable ints, list rows too),
`harness_rounds` (int, ≥1), and — detail read only — `critique` (per-round
scorecard) and `sources` (researched off-store URL strings). Surfaced on the blog
detail; **frontend-only, isolated to Spotlight** (no backend/Brand-Brain/social/ads
changes).

**Backend shapes adapted** (read from `app/services/spotlight/blog_service.py`
`_payload` + `harness.py`):
- `critique`: `CritiqueRound[]`, each `{ round: int, scores: {seo,aeo,geo,quality:int},
  min: int, overall: int, notes: {seo,aeo,geo,quality:str}, feedback: str }`.
- `sources`: `list[str]` of bare off-store URLs (from `derive.external_links`).
- `aeo_score`/`geo_score`/`quality_score`: nullable; `harness_rounds`: int default 1.

**Changes**
- `types/spotlight.ts` — `BlogDraft` gains `aeoScore`/`geoScore`/`qualityScore`
  (`number | null`), `harnessRounds` (`number`), `critique: CritiqueRound[]`,
  `sources: BlogSource[]`; new `CritiqueRound` / `QualityDimensionScores` /
  `QualityDimensionNotes` / `BlogSource` types.
- `lib/adapters.ts` — `ApiBlogDraft` + `ApiCritiqueRound` fields; `adaptCritiqueRound`
  (missing dims → 0 / ""), `adaptSources` (string | `{url}` → `{url}`, blanks dropped);
  `adaptBlogDraft` maps the new fields (absent → null / [] / 1, never fabricated).
- `lib/spotlight.ts` — `QUALITY_DIMENSIONS` (SEO=Search, AEO=Answer engines,
  GEO=Generative/LLMs, Quality=Brand), `overallQualityScore` (rounded mean of the
  present dims, nulls excluded), `hasFullQualityScores`. Tone reuses existing `seoTone`.
- `features/spotlight/quality-scorecard.tsx` (new) — `QualityScorecard` (overall
  readout + four tone-colored dials + "Refined N×…" when rounds>1), `ScoringDisclosure`
  (native `<details>`, latest-round notes per dimension + weakest-dim improvement across
  rounds), `ResearchedSources` (external `target=_blank rel=noopener` list, hidden when
  empty), plus `hasScorecard`/`draftOverallScore` for list badges.
- `features/spotlight/blog-detail.tsx` — the "SEO & publish" panel becomes
  "Quality & publish": `SeoGauge` → `QualityScorecard` + `ScoringDisclosure`; a new
  "Researched sources" aside panel renders only when sources exist. Everything else
  (banner, body, Written-by / Grounded-on, publish/approve) unchanged.
- `features/spotlight/seo-badge.tsx` — new `QualityScoreBadge` (overall "Q {n}").
- `features/spotlight/inbound-engine-tab.tsx` — draft cards show the overall
  `QualityScoreBadge` when the full scorecard is present, else the legacy `SeoBadge`.
- `SeoGauge` retained (still used by `approvals-tab.tsx`).
- Tests — `tests/spotlight-adapter.test.ts` (harness scores + critique/sources mapping,
  null-preserving, sparse-payload defaults), `tests/spotlight.test.ts`
  (`overallQualityScore`, `hasFullQualityScores`).

**Notes / deviations**
- `PublishedPost` carries no AEO/GEO/Quality fields from the backend, so the published-
  post card's best-effort badge is a no-op there (nothing fabricated); the overall badge
  lands on Inbound draft cards where the scorecard data exists.
- Design: app tokens only (`text-success`/`text-warning`/`text-destructive`,
  `bg-muted`, `border-border`, `font-heading`, `rounded-lg`), no `--brand`, no
  framer-motion, both themes; disclosure uses a native `<details>` (CSS-only collapse).

**Verification** — from `ecommerce-fte-frontend/`:
`npm run build` ✅ · `npx tsc --noEmit` ✅ (exit 0) · `npm run lint` ✅ (0 errors;
1 pre-existing unrelated warning in `features/traffic/store-league-view.tsx`) ·
`npm test` ✅ (56 files, 434 tests).

---

## Patches

### 2026-08-13 — Spotlight E4b: AI editorial hero on the blog banner (backend SPEC-122)

**What & why** — Backend SPEC-122 generates a magazine-grade composited hero
(gpt-image backdrop derived from the draft's real featured product + the real
product photo composited on top). This slice surfaces it on the blog detail
banner and adds a human-triggered Generate/Regenerate control (image-gen is slow
and costs money, so it is never automatic). Frontend-only; isolated to Spotlight.

**Backend contract consumed** (read from `app/api/routes/spotlight.py`):
- `GET /spotlight/drafts/{id}/hero` → `image/png` (404 `hero_not_found` if none yet).
- `POST /spotlight/drafts/{id}/hero` → `{ has_hero, updated_at }` (~15–40s; any
  image-gen failure degrades to `{ has_hero: false }`, never crashes the draft).

**How the image is served — binary passthrough through the existing proxy.**
`app/api/proxy/[...path]/route.ts` streams `upstream.body` untouched and passes
the `content-type` header through, so it already forwards a binary `image/png`
response — no JSON-only limitation. The banner therefore points a plain
`next/image` (`unoptimized`, `fill`) directly at
`/api/proxy/spotlight/drafts/{id}/hero?v={updatedAt}`; the proxy injects the
httpOnly bearer token server-side and the browser sends the session cookie
same-origin. No client-side blob/object-URL fetch was needed (simpler, one fewer
round trip). The 404-before-generated case is handled by the `<img>` `onError`
falling back to the current product-photo banner — no extra probe request. The
`?v=` param (the draft's `updatedAt`, restamped on each regenerate) cache-busts
so a fresh hero paints instead of a stale cached PNG.

**Generate / Regenerate UX** — a new "Editorial header" `SidePanel` in the detail
aside: one `outline` `Button`, labelled **Generate header** when no hero exists and
**Regenerate header** when one does. Presence is resolved off the banner's
`onHeroLoad`/`onHeroError` (the draft payload carries no `has_hero` flag), so the
label is correct without an extra read. On click → `generateHero(id)` → the button
shows a spinner + "Designing your header…", the banner dims + pulses the same
message, and a hint notes it takes ~30s. On success the hero version is bumped so
the banner reloads the new PNG in place (no full `router.refresh` needed); a
non-OK response surfaces the backend message inline (`role="alert"`), and a
graceful `{ has_hero: false }` shows a retry message. The button is disabled while
a blog rewrite (refine loop) is in flight.

**Files**
- `lib/spotlight.ts` — new pure `heroUrl(draftId, version?)` helper (proxy path +
  encoded cache-bust); node-safe, unit-tested.
- `services/spotlight-actions.ts` — new `generateHero(id)` → `{ hasHero, updatedAt }`
  (POST via `/api/proxy`), plus the `GenerateHeroResult` type.
- `features/spotlight/blog-banner.tsx` — now a client component; optional
  `heroUrl` / `generating` / `onHeroLoad` / `onHeroError` props. Renders the hero
  (`object-cover object-center`) with `onError` fallback to the product photo
  (`object-top`) then the token gradient; overlaid eyebrow/title/byline + scrim
  unchanged. Streaming surface (`blog-draft-streaming.tsx`) passes no `heroUrl`,
  so its behaviour is unchanged.
- `features/spotlight/blog-detail.tsx` — hero state + handler + the "Editorial
  header" aside panel; passes `heroUrl`/`generating`/load-error callbacks to the
  banner.
- `tests/spotlight.test.ts` — `heroUrl` unit tests (proxy path, encoded version,
  null/empty version).

**Design** — app tokens only (`text-muted-foreground`, `text-destructive`,
`bg-black/*` scrim as before, `border-border`), shadcn `Button`, Lucide
`ImagePlus`/`RefreshCw`/`Loader2` outline icons, `animate-pulse`/`animate-spin`
only (no framer-motion, no entrance animation), verified both themes. The banner
keeps its premium magazine look.

**Verification** — from `ecommerce-fte-frontend/` (see report for command tails):
`npm run build` → `npx tsc --noEmit` → `npm run lint` → `npm test`.

## Patch — Brand Brain "Confirm now" freshness (client-directed)

The Brand Brain "Confirm now" button is fully live (backend `POST /brand-brain/confirm`
restamps `confirmed_at = now` on every owner/manual fact; `ConfirmButton` calls it,
then `router.refresh()` re-reads the brain so "Last confirmed" updates and persists).
Two changes so the affordance earns its place:

- **Freshness signal.** New pure helper `lib/brand-brain-freshness.ts`
  (`brandBrainFreshness(lastConfirmedISO, nowMs)` → `{ days, relative, stale }`,
  `BRAND_BRAIN_STALE_DAYS = 30`, unit-tested). The header now reads "Last confirmed
  {relative} ({date})", and once the brain goes **stale** (≥ 30 days) it shows an amber
  warning-token note prompting a re-confirm — turning a buried date into an action, so
  the AI's on-brand grounding doesn't quietly drift. `nowMs` snapshot at mount (pure
  render, React 19). No entrance animation (Rule 9).
- **Removed dead stub.** `features/spotlight/nudge-button.tsx` (`NudgeButton`, the MVP
  no-op `onClick={() => setDone(true)}`) was unused anywhere — deleted (Rule 6: no
  placeholder code). The real, wired `ConfirmButton` lives in `brand-brain-tab.tsx`.

Verified: `npx tsc --noEmit`, `npm run lint`, `npm test` (628, +4 freshness),
`npm run build` all green.

## Patches

- **Fixed stale Approvals-tab status label (2026-08-21, quick fix).** After approving a
  draft, `features/spotlight/draft-decision.tsx` showed "Approved — publishing to Shopify
  lands in the next slice." That slice shipped long ago — publishing/unpublishing/delete
  are fully implemented on the draft-detail `PublishDecision` panel. Updated the label to
  "Approved — open the draft to publish it to your Shopify blog." and corrected the file's
  header comment (removed the "Slice 2" note). Copy-only; no logic change.
  Verified: `npx eslint` + `npx tsc --noEmit` clean.

- **Inbound Engine — Drafts card gets a bounded scroll region (2026-08-22, quick fix).**
  The Drafts card grew unbounded and stretched the whole tab as drafts accumulated,
  while the Query bank next to it was already capped at `max-h-[60vh]` with an inner
  scroll. Wrapped the drafts list in the same `max-h-[60vh] … overflow-y-auto pr-1`
  region so the two columns stay height-matched, and applied the shared
  `scrollbar-subtle` utility (globals.css) to **both** scroll areas for a consistent,
  token-styled thin scrollbar. Layout-only; no logic change. Verified: `tsc`, `eslint`,
  `npm run build` clean.
