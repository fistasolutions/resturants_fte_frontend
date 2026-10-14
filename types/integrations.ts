/** SMTP/Klaviyo/Gorgias non-secret config (backend SPEC-070) — the actual
 * credentials (SMTP user+password, Klaviyo private key, Gorgias API token)
 * never appear here; only the editable fields the backend whitelists. */
export type IntegrationFieldSource = "database" | "env" | "unset";

export interface IntegrationField {
  value: string | null;
  source: IntegrationFieldSource;
}

export interface SecretFieldStatus {
  /** Whether this credential is set (database override or `.env`) — never
   * the value itself; the server never returns a secret's value at all. */
  configured: boolean;
  source: IntegrationFieldSource;
}

export interface ProviderSettings {
  fields: Record<string, IntegrationField>;
  /** Write-only credential fields (SPEC-072) — set-only, never read back. */
  secrets: Record<string, SecretFieldStatus>;
  /** Whether every one of the provider's credentials is configured. */
  secretConfigured: boolean;
}

export interface IntegrationSettings {
  smtp: ProviderSettings;
  klaviyo: ProviderSettings;
  gorgias: ProviderSettings;
  loop: ProviderSettings;
  ipacky: ProviderSettings;
  vcount: ProviderSettings;
  /** Microsoft Clarity (backend SPEC-219) — behavioural data joined to revenue. */
  clarity: ProviderSettings;
}

export type IntegrationProvider = keyof IntegrationSettings;

/** `GET /integrations/meta/status` — the Meta (Instagram + Facebook Page)
 * connection (backend SPEC-179). Already camelCase on the wire, so there is no
 * adapter (unlike `GoogleStatus`, whose endpoint returns snake_case).
 *
 * No token field exists here by design: the backend never sends one. */
export interface MetaStatus {
  connected: boolean;
  /** Whether the server has META_APP_ID/SECRET/redirect configured at all. */
  configured: boolean;
  pageName: string | null;
  instagramUsername: string | null;
  /** False when the connected Page has NO linked Instagram Business account —
   * Facebook publishing works, Instagram does not. The difference the card must
   * surface rather than showing a clean "Connected". */
  instagramLinked: boolean;
  /** ISO-8601 expiry of the long-lived user token, or null. */
  tokenExpiresAt: string | null;
  /** Inside the refresh window. Should stay false forever while the daily
   * refresh job is healthy; true means publishing is about to stop. */
  expiringSoon: boolean;
  connectedBy: string | null;
  connectedAt: string | null;
}

/* ── The Integrations hub (SPEC-328 over backend SPEC-337) ─────────────────────────── */

export type HubStatus =
  | "not_connected"
  | "unavailable"
  | "attention"
  | "warning"
  | "syncing"
  | "pending"
  | "healthy";

export type HubAction = "reconnect" | "renew" | "open_settings" | "choose_property" | "retry";
export type RunOutcome = "success" | "error" | "running";

export interface HubAttention {
  code: string;
  /** Written for the owner by the backend — never the vendor's words. */
  message: string;
  action: HubAction;
  /** The raw error, cut short, for the technical line only. */
  detail: string | null;
}

export interface HubCompany {
  id: number;
  name: string;
  status: string;
  lastSyncedAt: string | null;
  lastError: string | null;
}

/** The non-secret facts a connection's Settings tab shows. Never a token. */
export interface HubAccount {
  shopDomain?: string | null;
  scopes?: string | null;
  email?: string | null;
  propertyUrl?: string | null;
  pageName?: string | null;
  instagramUsername?: string | null;
  instagramLinked?: boolean;
  tokenExpiresAt?: string | null;
  companies?: HubCompany[];
  /** Meta Ads: the ad accounts being read, and how many the sign-in can see. */
  adAccounts?: { id: string; name: string }[];
  availableAccounts?: number;
}

/** A connection's one-click sign-in (Klaviyo, backend SPEC-379; Gorgias, SPEC-380). Never a token. */
export interface HubOAuth {
  /** The platform has the vendor's app set up here, so the button can be offered. */
  available: boolean;
  /** The store is connected through the sign-in (a pasted key may still sit beside it). */
  connected: boolean;
  /** The scopes the vendor granted, e.g. "campaigns:write". */
  scopes: string[];
  /** The vendor refused the last token refresh: the sign-in must be redone (Gorgias, SPEC-372). */
  needsReconnecting?: boolean;
}

export interface HubConnection {
  key: string;
  connected: boolean;
  /** False when the platform's own app (Google, Meta, Intuit) is not set up here. */
  available: boolean;
  status: HubStatus;
  attention: HubAttention | null;
  lastSuccessAt: string | null;
  lastRunAt: string | null;
  lastRecords: number | null;
  /** Oldest → newest, at most 24. */
  runs: RunOutcome[];
  errors7d: number;
  canSync: boolean;
  canTest: boolean;
  account: HubAccount | null;
  connectedAt: string | null;
  connectedBy: string | null;
  /** Klaviyo (SPEC-371) and Gorgias (SPEC-372); absent from an older backend and for every other app. */
  oauth?: HubOAuth;
}

export interface HubSummary {
  connected: number;
  healthy: number;
  syncing: number;
  pending: number;
  warning: number;
  attention: number;
}

export interface HubOverview {
  checkedAt: string;
  summary: HubSummary;
  integrations: HubConnection[];
}

export type ActivityKind = "all" | "problems" | "changes";

export interface ActivityItem {
  at: string;
  key: string;
  type: "run" | "change";
  result: RunOutcome | "change";
  message: string;
  detail: string | null;
  records: number | null;
  durationSeconds: number | null;
  actor: string | null;
}

export interface TestResult {
  /** `null` when the vendor cannot be asked (Clarity's daily read budget). */
  ok: boolean | null;
  latencyMs: number | null;
  code: string | null;
  message: string | null;
}

/** One page of the timeline and how many events there are in all (SPEC-328 patch). */
export interface ActivityPage {
  items: ActivityItem[];
  total: number;
}
