/** Team Performance queries — the Gorgias workspace (SPEC-074/081/087) — defined once
 * for both transports (SPEC-230). Byte-identical paths to `services/gorgias-workspace.ts`
 * and `services/team-performance.ts`. */
import { defineQuery } from "@/lib/query-def";
import type {
  GorgiasAlerts,
  GorgiasConversationDetail,
  GorgiasConversationList,
  GorgiasOverview,
  VoiceOfCustomer,
} from "@/types/gorgias";
import type {
  GorgiasAgentMetric,
  GorgiasAgentSummary,
  SupportAttention,
} from "@/types/team-performance";

export type GorgiasCompare = "previous_period" | "previous_year" | "none";

export const gorgiasPaths = {
  voiceOfCustomer: (start: string, end: string): string =>
    `/gorgias/voice-of-customer?${new URLSearchParams({ start, end }).toString()}`,
  overview: (start: string, end: string, compare: GorgiasCompare): string =>
    `/gorgias/overview?${new URLSearchParams({ start, end, compare }).toString()}`,
  /** `query` is the backend query string `conversationsApiQuery(...)` produces. */
  conversations: (query: string): string => `/gorgias/conversations?${query}`,
  conversation: (gorgiasTicketId: number): string => `/gorgias/conversations/${gorgiasTicketId}`,
  alerts: (start: string, end: string): string =>
    `/gorgias/alerts?${new URLSearchParams({ start, end }).toString()}`,
  agents: (): string => "/gorgias/agents",
  metrics: (date?: string): string => `/gorgias/metrics${date ? `?date=${encodeURIComponent(date)}` : ""}`,
  supportAttention: (): string => "/gorgias/agent-review/attention",
} as const;

export const gorgiasQueries = {
  voiceOfCustomer: (start: string, end: string) =>
    defineQuery<VoiceOfCustomer>(["gorgias", "voice-of-customer", { start, end }], (api) =>
      api<VoiceOfCustomer>(gorgiasPaths.voiceOfCustomer(start, end)),
    ),
  overview: (start: string, end: string, compare: GorgiasCompare = "previous_period") =>
    defineQuery<GorgiasOverview>(["gorgias", "overview", { start, end, compare }], (api) =>
      api<GorgiasOverview>(gorgiasPaths.overview(start, end, compare)),
    ),
  conversations: (query: string) =>
    defineQuery<GorgiasConversationList>(["gorgias", "conversations", query], (api) =>
      api<GorgiasConversationList>(gorgiasPaths.conversations(query)),
    ),
  conversation: (gorgiasTicketId: number) =>
    defineQuery<GorgiasConversationDetail>(["gorgias", "conversation", gorgiasTicketId], (api) =>
      api<GorgiasConversationDetail>(gorgiasPaths.conversation(gorgiasTicketId)),
    ),
  alerts: (start: string, end: string) =>
    defineQuery<GorgiasAlerts>(["gorgias", "alerts", { start, end }], (api) =>
      api<GorgiasAlerts>(gorgiasPaths.alerts(start, end)),
    ),
  agents: () =>
    defineQuery<{ agents: GorgiasAgentSummary[] }>(["gorgias", "agents"], (api) =>
      api<{ agents: GorgiasAgentSummary[] }>(gorgiasPaths.agents()),
    ),
  metrics: (date?: string) =>
    defineQuery<{ date: string; agents: GorgiasAgentMetric[] }>(["gorgias", "metrics", date ?? null], (api) =>
      api<{ date: string; agents: GorgiasAgentMetric[] }>(gorgiasPaths.metrics(date)),
    ),
  supportAttention: () =>
    defineQuery<SupportAttention>(["gorgias", "support-attention"], (api) =>
      api<SupportAttention>(gorgiasPaths.supportAttention()),
    ),
} as const;
