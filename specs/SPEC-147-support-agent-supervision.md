# SPEC-147 — Team Performance: support-agent supervision UI (detect → email → Results)

Status: implemented
Depends on: backend SPEC-148 (underperformers + agent-review draft/send/history + support outcome),
SPEC-146 (warehouse supervision UI pattern), SPEC-067 (Results)

## Problem

Team Performance showed a per-agent leaderboard but only *reported*. Bring it to the full
ladder like Warehouse/Discounts: flag an underperforming agent, let the owner email the
support lead to coach them, and prove the agent's response time improved on Results.

## Design

Pure consumer of the new backend (Rule 8).

- **Recipient (Settings)**: `services/store.ts` surfaces `supportEmail` from
  `/settings/status`; a new **`SupportEmailCard`** on Settings → Manager Notifications
  saves it via `PUT /settings/support-email` (mirrors the warehouse-email card).
- **Detect + act (Agents page)**: `types/team-performance.ts` gains
  `SupportUnderperformer`/`SupportAttention`; `services/team-performance.ts`
  `getSupportAttention()` → `/gorgias/agent-review/attention`. A new
  **`SupportAttentionCard`** renders above the leaderboard listing flagged agents (each
  `why` + severity dot) with an **"Email support lead"** button →
  `/team-performance/agents/[id]/review`. Fetched in parallel with the overview (Rule 5).
- **Send flow**: `/team-performance/agents/[id]/review` renders the shared
  **`ComposePanel`** (draft/send/history at `/gorgias/agent-review/*`,
  `requestBody {gorgias_agent_id}`) — review / edit / AI-rewrite / send; the panel's own
  "manager email required" state covers an unset support lead.
- **Result**: `support` threaded through `types/results.ts`, `lib/adapters.ts`, and a new
  **"Support Team"** tab in `features/results/results-tabs.tsx` (`resolveLink` →
  `/team-performance/agents`).

HCI/perf: parallel fetch; semantic tokens; no entrance animation (Rule 9); keyboard-navigable.

## Manual verification checklist

- Settings → Manager Notifications shows a **Support Lead** email field; save/remove works.
- Team Performance → Agents: when an agent's first response is materially slower than the
  team, a "N agents to coach" card appears with a reason + "Email support lead" → compose
  → send. No card when everyone's within range.
- After sending, **Results → Support Team** lists it (Too early < 3 days, then Worked/No change).
- Light + dark; mobile; empty-recipient state.

## Acceptance Criteria

- [x] Support attention card (reason + email action) from `getSupportAttention`.
- [x] Compose send page via shared ComposePanel; Settings support-email field.
- [x] Results "Support Team" tab wired (types → adapter → tabs → link).
- [x] `npm run lint`, `npx tsc --noEmit`, `npm test` (631), `npm run build` green.
