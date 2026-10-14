import "server-only";

import { serverApi } from "@/lib/api";
import { dataTrustQueries } from "@/lib/queries/data-trust";
import type { DataTrustReport } from "@/types/data-trust";

/**
 * Catalogue data trust (SPEC-217; backend SPEC-225) — server transport. Since
 * SPEC-230 the path, key and loader live in `lib/queries/data-trust.ts`; null on
 * failure, same contract as before.
 */
export async function getDataTrust(): Promise<DataTrustReport | null> {
  return dataTrustQueries.report().load(serverApi);
}
