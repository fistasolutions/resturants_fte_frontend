# SPEC-042 — Brief Real Actions: Frontend enriched response display

## Problem
After Card 1 / Card 3 approve, the UI showed a generic "✓ Approved" message.
Now the backend returns what actually happened (email sent, Klaviyo synced).
The success state should reflect real outcomes.

## Changes
- `types/brief.ts` — add optional action result fields to a new `BriefActionResult` type
- `features/brief/decision-card.tsx` — show outcome-specific success text

## Success messages per card
- `unfulfilled_48h` approved + `email_sent: true` → "✓ Email sent to {N} managers — recorded at HH:MM"
- `unfulfilled_48h` approved + `email_sent: false` → "✓ Approved — check SMTP config"
- `dormant_vips` approved + `klaviyo_synced > 0` → "✓ {N} customers synced to Klaviyo"
- `dormant_vips` approved + `klaviyo_synced == 0` → "✓ Approved — check Klaviyo config"
- All other cards / skip → existing behaviour unchanged

## Acceptance criteria
- [ ] Card 1 success shows manager count from API response
- [ ] Card 3 success shows customer count from API response
- [ ] Graceful fallback when fields absent (old API / skip action)
- [ ] No new entrance animations; CSS-only 150ms transition on state change
