/** Gorgias per-agent metrics (backend SPEC-074, frontend SPEC-081). */

export interface GorgiasAgentSummary {
  gorgias_agent_id: number;
  name: string;
  email: string;
  staff_name: string | null;
  mapped: boolean;
}

export interface GorgiasAgentMetric {
  gorgias_agent_id: number;
  name: string | null;
  email: string | null;
  staff_name: string | null;
  mapped: boolean;
  tickets_answered: number;
  tickets_resolved: number;
  avg_first_response_seconds: number | null;
  avg_resolution_seconds: number | null;
  reopened_count: number;
  csat: number | null;
  open_backlog_eod: number;
  /** Bot/automation account (backend SPEC-094 patch) — humans rank on the
   * leaderboard podium; bots are pooled into an automation strip. */
  is_bot: boolean;
  /** Always null today — no ticket-to-order attribution model exists yet. */
  upsell_amount: number | null;
  /** Refund $ associated with the distinct customers this agent handled
   * (SPEC-089) — association, not causation. Present only on the range
   * leaderboard (overview), not the single-day metrics endpoint. */
  refund_exposure?: number;
}

/** One flagged agent + why (SPEC-148) — first-response materially worse than the team. */
export interface SupportUnderperformer {
  gorgias_agent_id: number;
  name: string;
  avg_first_response_seconds: number;
  team_median_seconds: number;
  tickets_answered: number;
  severity: "red" | "yellow";
  why: string;
}

export interface SupportAttention {
  /** The support-lead email (Settings), or null → the action links to Settings. */
  recipient: string | null;
  agents: SupportUnderperformer[];
}
