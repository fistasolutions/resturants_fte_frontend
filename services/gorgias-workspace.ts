/** Gorgias workspace — server transport. Since SPEC-230 the paths, keys and loaders
 * live in `lib/queries/gorgias.ts`; this module is their `serverApi` face. */
import { serverApi } from "@/lib/api";
import { gorgiasQueries, type GorgiasCompare } from "@/lib/queries/gorgias";
import type {
  GorgiasAlerts,
  GorgiasConversationDetail,
  GorgiasConversationList,
  GorgiasOverview,
  VoiceOfCustomer,
} from "@/types/gorgias";

export async function getVoiceOfCustomer(start: string, end: string): Promise<VoiceOfCustomer> {
  return gorgiasQueries.voiceOfCustomer(start, end).load(serverApi);
}

export async function getGorgiasOverview(
  start: string,
  end: string,
  compare: GorgiasCompare = "previous_period",
): Promise<GorgiasOverview> {
  return gorgiasQueries.overview(start, end, compare).load(serverApi);
}

export async function getGorgiasConversations(query: string): Promise<GorgiasConversationList> {
  return gorgiasQueries.conversations(query).load(serverApi);
}

export async function getGorgiasConversation(gorgiasTicketId: number): Promise<GorgiasConversationDetail> {
  return gorgiasQueries.conversation(gorgiasTicketId).load(serverApi);
}

export async function getGorgiasAlerts(start: string, end: string): Promise<GorgiasAlerts> {
  return gorgiasQueries.alerts(start, end).load(serverApi);
}
