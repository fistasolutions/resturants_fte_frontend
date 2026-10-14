/** Integrations-page queries — provider settings (SPEC-077; backend SPEC-070), the
 * Google Search Console link (backend SPEC-119) and the Meta link (backend SPEC-179)
 * — defined once for both transports (SPEC-230). Never a token: the backend does
 * not send one. Connect / disconnect mutations stay in `services/*-actions.ts`. */
import {
  adaptGoogleProperties,
  adaptGoogleStatus,
  type ApiGoogleProperties,
  type ApiGoogleStatus,
} from "@/lib/adapters";
import { ACTIVITY_PAGE_SIZE, toActivity, toOverview, type ApiActivityItem, type ApiHubOverview } from "@/lib/integration-hub";
import { defineQuery } from "@/lib/query-def";
import type { ActivityKind, ActivityPage, HubOverview, IntegrationField, IntegrationProvider, IntegrationSettings, MetaStatus, ProviderSettings, SecretFieldStatus } from "@/types/integrations";
import type { AiProvidersOverview } from "@/types/ai-providers";
import type { GoogleProperties, GoogleStatus } from "@/types/spotlight";

interface ApiProviderSettings {
  fields: Record<string, IntegrationField>;
  secrets: Record<string, SecretFieldStatus>;
  secret_configured: boolean;
}

type ApiIntegrationSettings = Record<IntegrationProvider, ApiProviderSettings>;

function adaptProvider(api: ApiProviderSettings): ProviderSettings {
  return { fields: api.fields, secrets: api.secrets, secretConfigured: api.secret_configured };
}

export function adaptIntegrationSettings(data: ApiIntegrationSettings): IntegrationSettings {
  return {
    smtp: adaptProvider(data.smtp),
    klaviyo: adaptProvider(data.klaviyo),
    gorgias: adaptProvider(data.gorgias),
    loop: adaptProvider(data.loop),
    ipacky: adaptProvider(data.ipacky),
    vcount: adaptProvider(data.vcount),
    clarity: adaptProvider(data.clarity),
  };
}

export const integrationPaths = {
  settings: (): string => "/settings/integrations",
  googleStatus: (): string => "/integrations/google/status",
  /** The properties the connected Google account can see (backend SPEC-257). */
  googleProperties: (): string => "/integrations/google/properties",
  metaStatus: (): string => "/integrations/meta/status",
  /** The AI provider cards (backend SPEC-245) — shown on the Integrations page. */
  aiProviders: (): string => "/ai-providers",
  /** Every connection's health in one read (backend SPEC-337). */
  overview: (): string => "/integrations/overview",
  activity: (key: string | null, kind: ActivityKind, page = 1, size = ACTIVITY_PAGE_SIZE): string => {
    const query = new URLSearchParams({
      kind,
      limit: String(size),
      offset: String((Math.max(1, page) - 1) * size),
    });
    if (key) query.set("key", key);
    return `/integrations/activity?${query.toString()}`;
  },
} as const;

export const integrationQueries = {
  settings: () =>
    defineQuery<IntegrationSettings>(["integrations", "settings"], async (api) =>
      adaptIntegrationSettings(await api<ApiIntegrationSettings>(integrationPaths.settings())),
    ),
  googleStatus: () =>
    defineQuery<GoogleStatus>(["integrations", "google-status"], async (api) =>
      adaptGoogleStatus(await api<ApiGoogleStatus>(integrationPaths.googleStatus())),
    ),
  /** Read only by the property dialog — one live `sites.list` call at Google. */
  googleProperties: () =>
    defineQuery<GoogleProperties>(["integrations", "google-properties"], async (api) =>
      adaptGoogleProperties(
        await api<ApiGoogleProperties>(integrationPaths.googleProperties()),
      ),
    ),
  /** Already camelCase on the wire — no adapter needed. */
  metaStatus: () =>
    defineQuery<MetaStatus>(["integrations", "meta-status"], (api) =>
      api<MetaStatus>(integrationPaths.metaStatus()),
    ),
  /** The hub (SPEC-328): every connection's status, reason and last runs. */
  overview: () =>
    defineQuery<HubOverview>(["integrations", "overview"], async (api) =>
      toOverview(await api<ApiHubOverview>(integrationPaths.overview())),
    ),
  /** Syncs and changes, newest first — all apps, or one — a page at a time with the total. */
  activity: (key: string | null, kind: ActivityKind, page = 1, size = ACTIVITY_PAGE_SIZE) =>
    defineQuery<ActivityPage>(["integrations", "activity", key ?? "all", kind, page, size], async (api) => {
      const body = await api<{ items: ApiActivityItem[]; total?: number }>(
        integrationPaths.activity(key, kind, page, size),
      );
      const items = toActivity(body.items);
      // An older backend sends no total: the page it sent is all there is.
      return { items, total: body.total ?? items.length };
    }),
  /** Already snake_case on the wire and consumed as such — no adapter. */
  aiProviders: () =>
    defineQuery<AiProvidersOverview>(["integrations", "ai-providers"], (api) =>
      api<AiProvidersOverview>(integrationPaths.aiProviders()),
    ),
} as const;
