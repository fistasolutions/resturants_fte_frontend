/**
 * Integration settings — client-side write (SPEC-077): saves a provider's
 * non-secret fields through the proxy (backend SPEC-070). Kept separate
 * from services/integration-settings.ts, which imports lib/api's
 * server-only serverApi and would break a client bundle if combined.
 */
import type {
  IntegrationField,
  IntegrationProvider,
  IntegrationSettings,
  ProviderSettings,
  SecretFieldStatus,
} from "@/types/integrations";

interface ApiProviderSettings {
  fields: Record<string, IntegrationField>;
  secrets: Record<string, SecretFieldStatus>;
  secret_configured: boolean;
}

type ApiIntegrationSettings = Record<IntegrationProvider, ApiProviderSettings>;

function adaptProvider(api: ApiProviderSettings): ProviderSettings {
  return { fields: api.fields, secrets: api.secrets, secretConfigured: api.secret_configured };
}

export function adaptIntegrationSettings(api: ApiIntegrationSettings): IntegrationSettings {
  return {
    smtp: adaptProvider(api.smtp),
    klaviyo: adaptProvider(api.klaviyo),
    gorgias: adaptProvider(api.gorgias),
    loop: adaptProvider(api.loop),
    ipacky: adaptProvider(api.ipacky),
    vcount: adaptProvider(api.vcount),
    clarity: adaptProvider(api.clarity),
  };
}

const base = process.env.NEXT_PUBLIC_API_URL ?? "/api/proxy";

export async function updateIntegrationSettings(
  provider: IntegrationProvider,
  fields: Record<string, string>,
): Promise<IntegrationSettings> {
  const response = await fetch(`${base}/settings/integrations/${provider}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fields }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error?.message ?? "Could not save the integration settings.");
  }
  return adaptIntegrationSettings(data);
}

/** One credential, because the owner pressed the eye on that one field (SPEC-302). */
export async function revealIntegrationSecret(
  provider: IntegrationProvider,
  key: string,
): Promise<string | null> {
  const response = await fetch(`${base}/settings/integrations/${provider}/secrets/${key}`);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error?.message ?? "Could not read that value.");
  }
  return (data?.value as string | null) ?? null;
}
