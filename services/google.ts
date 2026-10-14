/**
 * Google Search Console connect — server transport (backend SPEC-119). Reports
 * whether the store is linked (+ non-sensitive metadata) — never a token. Since
 * SPEC-230 the path, key and loader live in `lib/queries/integrations.ts`; the
 * connect/exchange/disconnect mutations stay in `services/google-actions.ts`.
 */
import { serverApi } from "@/lib/api";
import { integrationQueries } from "@/lib/queries/integrations";
import type { GoogleStatus } from "@/types/spotlight";

export async function getGoogleStatus(): Promise<GoogleStatus> {
  return integrationQueries.googleStatus().load(serverApi);
}
