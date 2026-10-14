/**
 * Meta connection — server transport (backend SPEC-179). Reports whether the store
 * is linked plus non-sensitive metadata (page, Instagram handle, expiry) — never a
 * token. Since SPEC-230 the path, key and loader live in
 * `lib/queries/integrations.ts`; the mutations stay in `services/meta-actions.ts`.
 */
import { serverApi } from "@/lib/api";
import { integrationQueries } from "@/lib/queries/integrations";
import type { MetaStatus } from "@/types/integrations";

export async function getMetaStatus(): Promise<MetaStatus> {
  return integrationQueries.metaStatus().load(serverApi);
}
