/**
 * Nudge service — server transport (SPEC-246). The read is defined in
 * `lib/queries/nudge.ts`; this is its `serverApi` face, kept for the registry
 * convention (SPEC-230) — the launcher reads it client-side.
 */
import { serverApi } from "@/lib/api";
import { nudgeQueries } from "@/lib/queries/nudge";
import type { Nudge } from "@/types/nudge";

export async function getNudge(route: string): Promise<Nudge | null> {
  return nudgeQueries.forRoute(route).load(serverApi);
}
