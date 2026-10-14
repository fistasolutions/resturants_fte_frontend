/** Team Performance agents — server transport. Since SPEC-230 the paths, keys and
 * loaders live in `lib/queries/gorgias.ts`; this module is their `serverApi` face. */
import { serverApi } from "@/lib/api";
import { gorgiasQueries } from "@/lib/queries/gorgias";
import type {
  GorgiasAgentMetric,
  GorgiasAgentSummary,
  SupportAttention,
} from "@/types/team-performance";

export async function getGorgiasAgents(): Promise<{ agents: GorgiasAgentSummary[] }> {
  return gorgiasQueries.agents().load(serverApi);
}

export async function getGorgiasAgentMetrics(
  date?: string,
): Promise<{ date: string; agents: GorgiasAgentMetric[] }> {
  return gorgiasQueries.metrics(date).load(serverApi);
}

export async function getSupportAttention(): Promise<SupportAttention> {
  return gorgiasQueries.supportAttention().load(serverApi);
}
