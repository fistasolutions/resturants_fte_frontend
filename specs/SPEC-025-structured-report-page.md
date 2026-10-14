# SPEC-025 — Structured Daily Report Page

- **Status:** Implemented
- **Date:** 2026-07-16
- **Supersedes:** the raw-Markdown rendering of SPEC-022 (archive/selection
  behavior unchanged).
- **Context:** The owner's reference design renders the daily report as an
  executive dashboard — KPI tiles and metric cards — not prose. Every stored
  report already carries `metrics` (all backend-computed numbers) alongside
  the AI narrative, so the page renders **numbers from `metrics`** and
  **judgment from the AI** (Summary, Risks, Opportunities, Recommended
  Actions parsed from the narrative's `##` sections).

## Changes

1. `lib/report-sections.ts` — pure parser: splits the report Markdown by
   `##` headings into named sections (summary, risks, opportunities,
   recommended actions). Unit-tested (Vitest).
2. `types/reports.ts` — `ReportMetrics` mirroring the stored payload
   (sales, customers, refunds, top/worst products, zero-sales,
   inventory counts + reorder alerts, top discounts, channels, top
   customers). All fields optional — older payloads must not crash the page.
3. `features/reports/report-viewer.tsx` rebuilt:
   - Header: store report title, date, generated-by badge, **Print / Save
     PDF** button (`features/reports/print-button.tsx`, client, calls
     `window.print()`).
   - **KPI tiles**: Revenue, Orders, Avg order value, Returning %, New
     customers, Refunds — with prior-day change where available.
   - **AI Summary** as the lead paragraph under the header.
   - Metric cards (reusing `SectionCard`/`SimpleTable`): Top products, Worst
     products (+ zero-sales headline), Low & out of stock (true counts +
     reorder table with days of cover), Largest discounts, Refund summary,
     Sales by channel, Top customers.
   - **AI sections**: Business risks (warning tone), Opportunities (success
     tone), Recommended actions (emphasized action list) — rendered from the
     parsed narrative with the chat Markdown renderer.
   - **Fallback**: if the narrative has no parseable sections or `metrics`
     is empty (old/fallback reports), render the full Markdown as before —
     never a blank page.

## Honesty rules

- Cards show only stored metrics; nothing is recomputed client-side.
- AI sections are visually attributed ("AI analysis") and come verbatim from
  the stored narrative.
- No per-reason refund breakdown or priority chips are invented — those need
  data V1 does not store (documented gap).

## Acceptance criteria

- [ ] Report renders as KPI tiles + cards + AI sections from stored data.
- [x] Parser unit tests green; malformed/legacy reports fall back to full
      Markdown.
- [ ] Print button produces a clean print/PDF layout.
- [x] All four frontend gates green.

## Patches

- **2026-07-16 — history rail → header dropdown (owner decision).** The
  permanent "History" side column wasted a full-width track when few reports
  exist. Replaced by `features/reports/history-menu.tsx`: a compact
  "History" dropdown in the page header (calendar icon + selected date,
  scrollable date list, active date checked); the report now uses the full
  content width. `report-archive.tsx` deleted.
- **2026-07-16 — on-demand generation prepared but NOT mounted (owner
  deferral).** Backend SPEC-017 (`POST /reports/generate`) is implemented and
  tested; `generate-button.tsx` exists but is not rendered on the page —
  wiring deferred until the owner asks.
