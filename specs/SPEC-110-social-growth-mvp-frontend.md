# SPEC-110 — Social Growth (Organic Social Media Manager) — MVP frontend

**Status:** MVP · frontend-only · mock data. No backend in this spec.
**Depends on:** PRD carve-out (`docs/prd.md`, Spotlight/Digital-FTE pillar, 2026-08-11).
Owner-directed. Sibling to Spotlight (SPEC-109) — same shell, same discipline.

## What & why
Social Growth is the second **Digital FTE**: an Organic Social Media Manager that turns
the **product catalog** into **native social content**. It picks what to feature
(grounded in Shopify data — best-sellers, new drops, dead stock to clear), generates a
**creative + caption per channel** in the brand voice, routes every post through human
**Approvals**, schedules to a **Calendar**, and measures **reach + engagement +
attributed sales**. Same loop as Spotlight, off the same shared foundation
(**Brand Brain**), just for organic social instead of SEO.

MVP is **frontend-only, on mock data**, matching the existing app EXACTLY (Design.md
tokens, shadcn, no Framer Motion). It looks like a real social manager; publishing,
creative generation, and platform insights are later backend phases.

## Architecture note (shared foundation)
Brand Brain (voice, guardrails, personas, POV) is the **shared org brain** across all
FTEs — Social Growth *reads* it, never re-asks. For this MVP it shows that context
read-only from its own mock; a later refactor extracts Brand Brain as a shared module.

## Scope (in)
- One sidebar item **"Social Growth"** → `/social` (`lib/navigation.ts`, icon `Share2`,
  `badge: "NEW"`), placed directly after "Spotlight".
- A `/social` route mirroring the **Spotlight/Returns pattern exactly**: persistent
  shell (PageHeader + URL-driven tab bar, `?tab=` anchors, active underline `bg-primary`)
  in `layout.tsx`; active-tab content in `page.tsx` behind a keyed `<Suspense>`;
  `loading.tsx` skeleton.
- **5 tabs:**
  1. **Overview** — the social pipeline (Plan → Create → Approve → Publish → Measure)
     with per-stage progress; KPI tiles (followers, reach 28d, engagement rate, posts
     scheduled, **attributed revenue**); "what to post next" (data-picked) + activity.
  2. **Content Studio** (THE STAR) — the "ads from product pictures" screen. A product
     picker (thumbnails; the FTE suggests one with a *grounded* reason chip, e.g.
     "best-seller momentum" / "clear dead stock" / "new drop"); channel-format creative
     previews (**4:5 feed, 9:16 story/reel, 1:1**) built from the product image; a
     generated **caption + hashtags** in brand voice tied to a persona + POV pillar;
     caption variants + a "regenerate" affordance (no-op/toast in MVP).
  3. **Calendar** — a weekly content calendar: queued posts per day, per channel, with
     status (draft / in review / scheduled / published) and cadence guidance.
  4. **Approvals** — human-in-the-loop (client component): a featured post preview
     (creative + caption + channel + persona + est. reach), **Approve & schedule** /
     **Request changes** with inline confirm + undo; a queue of other pending posts.
  5. **Performance** — reach/engagement KPIs with deltas; a top-posts table (post,
     channel, reach, engagement, **attributed sales**); a follower-growth mini trend;
     an "estimated — connect Instagram/TikTok" state deep-linking to `/integrations`.
- **Setup is NOT a tab** — channel connections live in `/integrations`; Social Growth
  surfaces a nudge that deep-links there.

## Creative / imagery in the mock
No external image URLs (CSP + no assets). Represent product photos with tasteful
**aspect-ratio placeholder tiles** (token `bg-muted`/`bg-secondary`, product name + a
small image glyph), sized to each channel's ratio, so the "creative per format" idea
reads clearly without real photos. Templated look only — no fake AI-scene imagery.

## Design constraints (match the app — root Rule 9, identical to SPEC-109)
- Tokens only. `--primary` (brand ink) for actions/active-underline; `--brand` red
  **identity-only**; `--success`/`--warning`/`--destructive` for status. **No invented
  colors (no indigo/violet/purple), no hex literals.** Channel identity (IG/TikTok/etc.)
  is conveyed by **name + lucide icon**, NOT by each platform's brand color.
- `font-heading` (Tenor Sans) headings; `rounded-card`; shadcn components; anchor tabs.
- No Framer Motion, no entrance animations (CSS hover/focus only). Both themes.
- Loading/empty/error states on every tab; responsive; keyboard-navigable tabs.

## Architecture (mock discipline — root Rule 6 Phase-1 exception)
- `types/social.ts` — interfaces (future API contract).
- `lib/mock/social.ts` — realistic Example-Store apparel mock (products, personas,
  posts, channels, metrics).
- `services/social.ts` — the ONLY data seam (async getters returning mock).
- `lib/social.ts` — pure, unit-tested helpers (tab normalization, any bucketing).
- `features/social/*` — shell, tabs, one component per tab + small subcomponents.
- `app/(app)/social/{layout,page,loading}.tsx`.
- Isolated: nothing existing imports it (only pre-existing edit = one nav line).

## Acceptance criteria
- [ ] "Social Growth" in the sidebar (NEW badge) → `/social`; 5 tabs switch via `?tab=`
  anchors (active underline `bg-primary`); deep-linkable.
- [ ] Content Studio shows a product picker with a grounded suggestion reason, multi-
  format creative previews (4:5 / 9:16 / 1:1), and a brand-voice caption + hashtags.
- [ ] Overview shows the 5-stage pipeline + KPIs (incl. attributed revenue) + next-post.
- [ ] Calendar shows a week grid of posts by channel with status.
- [ ] Approvals: working Approve/Request-changes interaction (client, no backend).
- [ ] Performance: KPIs + top-posts table + "connect a channel" estimated state.
- [ ] Zero hardcoded colors; `--brand` identity-only; zero Framer Motion; both themes.
- [ ] `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` all green;
  a `tests/social.test.ts` covers the pure helpers + service shape.
- [ ] Manual verification checklist (each tab loads, tabs switch, approve works, mobile).
