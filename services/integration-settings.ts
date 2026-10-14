/** Integration settings — server transport (SPEC-077): SMTP/Klaviyo/Gorgias non-secret
 * config for the Integrations page (backend SPEC-070). Since SPEC-230 the path, key
 * and adapter live in `lib/queries/integrations.ts`. */
import { serverApi } from "@/lib/api";
import { integrationQueries } from "@/lib/queries/integrations";
import type { IntegrationSettings } from "@/types/integrations";

export async function getIntegrationSettings(): Promise<IntegrationSettings> {
  return integrationQueries.settings().load(serverApi);
}
