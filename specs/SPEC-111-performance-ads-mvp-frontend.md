# SPEC-111 — Performance Ads (AI Media Buyer) — MVP frontend

**Status:** MVP · frontend-only · mock data. No backend, NO real spend in this spec.
**Depends on:** PRD carve-out (`docs/prd.md`, Digital-FTE pillar). Owner-directed.
Third Digital FTE — sibling of Spotlight (SPEC-109) & Social Growth (SPEC-110):
same shell, same discipline. This one differs in one way that shapes the whole UI:
**it spends money**, so the product is TRUST — every dollar gated, capped, accounted.

## What & why
Performance Ads is an AI Media Buyer for **Paid Social (Meta) + Search (Google)**. It
proposes campaigns/budgets grounded in real Shopify data, a human approves every spend
decision, and hard caps + a kill-switch + an audit ledger keep it accountable. The
differentiator is **profit-aware optimization**: it targets ROAS on *real margin*
(COGS), not platform-reported vanity ROAS, and attributes against actual Shopify orders.

**Autonomy model (defines the feel):** the AI never has unsupervised spend authority.
**Human approval is required to launch a campaign and to raise any budget.** The AI may
only optimize *within* an already-approved cap. Every gated action shows its rationale,
projected spend, and the cap it fits inside.

MVP is **frontend-only on mock data** — NO ad-platform connection, NO real spend, NO
live optimization. It models the control surface so the trust/gating UX can be validated
before any money or API risk. Matches the app EXACTLY (Design.md tokens, shadcn, no
Framer Motion).

## Architecture note (shared foundation + cross-FTE)
Reads the shared **Brand Brain** (ICP/personas/POV/offers) for targeting + messaging;
reuses **Social Growth** creatives and **Spotlight** search queries as ad inputs
(shown as provenance context in the mock). Later refactor extracts Brand Brain as shared.

## Scope (in)
- One sidebar item **"Performance Ads"** → `/ads` (`lib/navigation.ts`, icon `Target`,
  `badge: "NEW"`), directly after "Social Growth".
- A `/ads` route mirroring the Spotlight/Social shell EXACTLY: persistent shell
  (PageHeader + URL tab bar, `?tab=` anchors, active underline `bg-primary`) in
  `layout.tsx`; active-tab content in `page.tsx` behind a keyed `<Suspense>`;
  `loading.tsx`.
- A **persistent budget/guardrail strip** in the shell (below the header, on every tab):
  total budget, spent, remaining with a cap-utilization bar, and a **"Pause all spend"
  kill-switch** button (client; toast/state only in MVP). This is the "capped" promise,
  always visible.
- **5 tabs:**
  1. **Overview** — the money command center: spend vs cap, **profit-aware ROAS**
     (real-margin), CAC, attributed **profit** (not just revenue), live campaigns count,
     **pending approvals** count, blended trend, activity. "Every dollar accounted for."
  2. **Campaigns** — the media plan across Meta + Google: each row = objective, target
     persona/ICP, product/offer, **daily + total budget cap**, status
     (draft / pending approval / live / paused / capped), and profit performance (spend,
     ROAS, CAC, profit). A data-picked "recommended next campaign" with a grounded reason
     (scale a winner / clear dead stock / defend a branded search term).
  3. **Creative** — the ads: reuses Social Growth creatives (image/format placeholders)
     + Spotlight-sourced search headlines/keywords, each with a provenance chip and a
     per-creative spend/ROAS readout.
  4. **Spend Gates** (THE STAR — client component) — every spend action queued for human
     sign-off: *launch campaign · raise budget · expand audience*. Each card shows the
     AI's **rationale**, the **projected spend**, the **cap it fits within**, and the
     expected profit impact, with **Approve / Hold / Deny**. Approve updates local state +
     inline confirmation + Undo. This surface IS "every dollar gated."
  5. **Accountability** — the ledger: a spend log (date, campaign, channel, amount,
     attributed profit), cap utilization per campaign, and a **guardrail log** (auto-
     pauses, cap hits, anomaly halts) — proof nothing runs unchecked.
- **Setup is NOT a tab** — ad-account connections live in `/integrations`; a nudge here
  deep-links there (and states clearly no account is connected in MVP).

## Money & trust in the UI (the point of this FTE)
- Budget caps are visible on EVERY tab (the persistent strip) — never buried.
- Money uses `tabular-nums`; profit shown alongside revenue everywhere (real-margin story).
- The kill-switch is prominent and unmistakable.
- Every AI spend proposal carries a plain-language rationale + the cap it respects —
  the human approves with full context, never a blind "spend more?".

## Design constraints (match the app — root Rule 9, identical to SPEC-109/110)
- Tokens only. `--primary` (brand ink) actions/active-underline; `--brand` red
  **identity-only**; `--success`/`--warning`/`--destructive` for status (a *deny*/anomaly
  may use `destructive`; a *cap hit*/hold may use `warning`; healthy ROAS `success`).
  **No invented colors (no indigo/violet/purple), no hex literals.**
- Channels (Meta / Google) identified by **name + lucide icon only** — NOT platform
  brand colors. `font-heading` headings; `rounded-card`; shadcn; anchor tabs.
- No Framer Motion, no entrance animations (CSS hover/focus only). Both themes.
- Loading/empty/error states; responsive; keyboard-navigable tabs.

## Architecture (mock discipline — root Rule 6 Phase-1 exception)
- `types/ads.ts`, `lib/mock/ads.ts` (realistic the store apparel mock), `services/ads.ts`
  (only data seam, async getters), `lib/ads.ts` (pure helpers: tab ids +
  `normalizeAdsTab` + a ROAS/spend bucketing helper).
- `features/ads/*` — shell, tabs, budget strip, one component per tab + small subs.
- `app/(app)/ads/{layout,page,loading}.tsx`.
- Isolated: only pre-existing edit = one nav line.

## Acceptance criteria
- [ ] "Performance Ads" in the sidebar (NEW badge) → `/ads`; 5 tabs via `?tab=` anchors
  (active underline `bg-primary`); deep-linkable.
- [ ] A persistent budget strip (spent/remaining/cap bar + kill-switch) shows on every tab.
- [ ] Overview shows profit-aware ROAS + attributed profit + pending-approvals count.
- [ ] Campaigns lists Meta + Google campaigns with budget caps + status + profit perf.
- [ ] Spend Gates lists gated actions each with rationale + projected spend + cap, and a
  working Approve/Hold/Deny interaction (client, no backend).
- [ ] Accountability shows a spend ledger + guardrail log.
- [ ] Money is profit-aware and `tabular-nums`; kill-switch prominent.
- [ ] Zero hardcoded colors; `--brand` identity-only; channels by name+icon; no Framer
  Motion; both themes.
- [ ] `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` all green;
  `tests/ads.test.ts` covers the pure helpers + service shape.
- [ ] Manual checklist: each tab loads, tabs switch, kill-switch + approve work, mobile.
