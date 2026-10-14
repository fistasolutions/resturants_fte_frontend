# SPEC-043 — Brief History Frontend

## Components
- features/brief/brief-date-picker.tsx — "use client", dropdown of recent dates
- app/(app)/brief/page.tsx — updated to accept searchParams.date, show picker
- app/(app)/brief/history/page.tsx — paginated history list

## Types (types/brief.ts additions)
- BriefHistoryItem: { snapshot_date, generated_at, decision_count, decisions_approved }
- BriefHistoryList: { items, total, page, pages }

## Acceptance criteria
- [ ] Date picker shows today + last 7 available snapshots
- [ ] Selecting a date navigates to /brief?date=YYYY-MM-DD
- [ ] Past-date brief shows read-only view (no approve/skip buttons)
- [ ] History page: paginated list, back button to brief
- [ ] Build passes
