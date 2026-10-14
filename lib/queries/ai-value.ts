/** AI spend and value queries (frontend SPEC-225/226, backend SPEC-234/236/237) —
 * defined once for both transports (SPEC-230). Byte-identical paths to
 * `services/ai-value.ts`. */
import { adaptAiValue, adaptCaps, type RawAiValue } from "@/lib/ai-value";
import { defineQuery } from "@/lib/query-def";
import type { AiSpendCap, AiTraceStep, AiValueOverview } from "@/types/ai-value";

export interface AiTrace {
  traceId: string;
  steps: AiTraceStep[];
}

export const aiValuePaths = {
  overview: (period: string): string => `/ai-value?period=${period}`,
  caps: (): string => "/ai-value/caps",
  trace: (traceId: string): string => `/ai-value/traces/${encodeURIComponent(traceId)}`,
} as const;

export const aiValueQueries = {
  overview: (period = "all") =>
    defineQuery<AiValueOverview>(["ai-value", "overview", period], async (api) =>
      adaptAiValue(await api<RawAiValue>(aiValuePaths.overview(period))),
    ),
  caps: () =>
    defineQuery<AiSpendCap[]>(["ai-value", "caps"], async (api) =>
      adaptCaps(await api<{ caps: never[] }>(aiValuePaths.caps())),
    ),
  /** One run, step by step (backend SPEC-236). */
  trace: (traceId: string) =>
    defineQuery<AiTrace>(["ai-value", "trace", traceId], async (api) => {
      const raw = await api<{ traceId: string; spans: AiTraceStep[] }>(aiValuePaths.trace(traceId));
      return { traceId: raw.traceId, steps: raw.spans };
    }),
} as const;
