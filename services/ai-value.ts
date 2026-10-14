/** AI spend and value (frontend SPEC-225, backend SPEC-234) — server transport. Since
 * SPEC-230 the paths, keys and loaders live in `lib/queries/ai-value.ts`; this module
 * is their `serverApi` face. */
import { serverApi } from "@/lib/api";
import { aiValueQueries, type AiTrace } from "@/lib/queries/ai-value";
import type { AiSpendCap, AiValueOverview } from "@/types/ai-value";

export async function getAiValue(period = "all"): Promise<AiValueOverview> {
  return aiValueQueries.overview(period).load(serverApi);
}

export async function getAiSpendCaps(): Promise<AiSpendCap[]> {
  return aiValueQueries.caps().load(serverApi);
}

/** One run, step by step (backend SPEC-236). */
export async function getAiTrace(traceId: string): Promise<AiTrace> {
  return aiValueQueries.trace(traceId).load(serverApi);
}
