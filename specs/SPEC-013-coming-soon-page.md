# SPEC-013 — Coming Soon Page

**Status:** Implemented
**Phase:** 1 — Frontend Foundation (PRD "Coming Soon" section — the page itself is
in scope; the features are not)

## Goal

`/coming-soon`: an honest, well-designed roadmap page for everything the PRD defers —
so future capability is visible without pretending it exists.

## Scope

- **Data** `lib/roadmap.ts` (static config, not mock data — it IS the content):
  categorized items from the PRD: Integrations (Multi-Store, Klaviyo, Google Ads,
  Meta Ads, GA4, Triple Whale, Gorgias, Slack), Reports & Export (Email reports,
  PDF/CSV/Excel export), Advanced Analytics (CLV, AI forecasting, marketing +
  inventory recommendations, predictive analytics), Team (team management, roles &
  permissions). Each: title, one-line description, Lucide icon.
- **Component** `features/coming-soon/roadmap-card.tsx` — icon tile + title +
  description + "Planned" badge.
- Page: h1 + intro + category sections with responsive card grids.
- Nav: new item **Coming Soon** (Rocket icon) after Settings, enabled.

## Acceptance Criteria

1. `/coming-soon` lists every PRD Coming-Soon feature, grouped, with descriptions.
2. Nothing on the page pretends to be clickable/functional; no fake switches.
3. Tokens only; responsive grid; one h1. Lint, tsc, tests, build green.
