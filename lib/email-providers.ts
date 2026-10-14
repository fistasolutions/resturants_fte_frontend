/**
 * The email platforms the Email Marketing Manager can run on, and what each can do
 * (SPEC-345). The UI asks `can(provider, capability)` — never `provider === "klaviyo"` —
 * so a second platform is one row here and one backend adapter, not new screens.
 *
 * Klaviyo's row follows its API reference (revision 2026-07-15). The other rows are
 * named so the owner sees what is coming; they are not connectable, and their
 * capabilities are confirmed when each adapter is built.
 */
import type { Capability, EmailProviderInfo, EmailProviderKey, ProviderCapabilities } from "@/types/email-marketing";

const NONE: ProviderCapabilities = {
  emailChannel: false,
  smsChannel: false,
  campaigns: false,
  flowsCreate: false,
  segmentsCreate: false,
  listsWrite: false,
  templatesWrite: false,
  uniqueCoupons: false,
  smartSendTime: false,
  throttledSend: false,
  reporting: false,
  catalogSync: false,
  customEvents: false,
};

export const EMAIL_PROVIDERS: Readonly<Record<EmailProviderKey, EmailProviderInfo>> = {
  klaviyo: {
    key: "klaviyo",
    name: "Klaviyo",
    kind: "Email & SMS",
    available: true,
    capabilities: {
      emailChannel: true,
      smsChannel: true,
      campaigns: true,
      flowsCreate: true,
      segmentsCreate: true,
      listsWrite: true,
      templatesWrite: true,
      uniqueCoupons: true,
      smartSendTime: true,
      throttledSend: true,
      reporting: true,
      catalogSync: true,
      customEvents: true,
    },
    scopes: [
      "accounts:read",
      "campaigns:write",
      "catalogs:write",
      "coupons:write",
      "coupon-codes:write",
      "events:write",
      "flows:write",
      "images:write",
      "lists:write",
      "metrics:read",
      "profiles:write",
      "segments:write",
      "subscriptions:write",
      "tags:write",
      "templates:write",
    ],
    limits: [
      "Reports are limited to about 2 a minute and 225 a day, so figures come from a nightly snapshot, not live.",
      "About 100 flows can be created a day; larger builds are queued.",
      "Klaviyo's own sending rules still apply: a verified sending domain, consent, smart sending and account review on new accounts.",
      "Klaviyo's drag-and-drop editor and A/B test screen are not in its API, so templates are written as HTML and tests run as campaign variants with a holdout.",
    ],
    keyPrefix: { prefix: "pk_", wrong: "A Klaviyo private key starts with pk_. A public key (six characters) cannot manage campaigns." },
  },
  mailchimp: {
    key: "mailchimp",
    name: "Mailchimp",
    kind: "Email",
    available: false,
    capabilities: { ...NONE, emailChannel: true, campaigns: true, listsWrite: true, segmentsCreate: true, templatesWrite: true, reporting: true },
    scopes: [],
    limits: [],
    keyPrefix: null,
  },
  omnisend: {
    key: "omnisend",
    name: "Omnisend",
    kind: "Email & SMS",
    available: false,
    capabilities: { ...NONE, emailChannel: true, smsChannel: true, campaigns: true, listsWrite: true, customEvents: true, reporting: true },
    scopes: [],
    limits: [],
    keyPrefix: null,
  },
  shopify_email: {
    key: "shopify_email",
    name: "Shopify Email",
    kind: "Email",
    available: false,
    capabilities: { ...NONE, emailChannel: true, campaigns: true },
    scopes: [],
    limits: [],
    keyPrefix: null,
  },
  hubspot: {
    key: "hubspot",
    name: "HubSpot",
    kind: "Email & CRM",
    available: false,
    capabilities: { ...NONE, emailChannel: true, campaigns: true, listsWrite: true, segmentsCreate: true, customEvents: true, reporting: true },
    scopes: [],
    limits: [],
    keyPrefix: null,
  },
  attentive: {
    key: "attentive",
    name: "Attentive",
    kind: "SMS",
    available: false,
    capabilities: { ...NONE, smsChannel: true, campaigns: true, customEvents: true },
    scopes: [],
    limits: [],
    keyPrefix: null,
  },
  postscript: {
    key: "postscript",
    name: "Postscript",
    kind: "SMS",
    available: false,
    capabilities: { ...NONE, smsChannel: true, campaigns: true, customEvents: true },
    scopes: [],
    limits: [],
    keyPrefix: null,
  },
};

export const EMAIL_PROVIDER_ORDER: readonly EmailProviderKey[] = [
  "klaviyo",
  "mailchimp",
  "omnisend",
  "shopify_email",
  "hubspot",
  "attentive",
  "postscript",
];

export function providerInfo(key: EmailProviderKey): EmailProviderInfo {
  return EMAIL_PROVIDERS[key];
}

/** Whether the store's platform can do this — the one question screens ask. */
export function can(key: EmailProviderKey, capability: Capability): boolean {
  return EMAIL_PROVIDERS[key].capabilities[capability];
}

/** A key's scopes checked against what this employee needs. */
export function scopeCheck(key: EmailProviderKey, granted: readonly string[]): { scope: string; granted: boolean }[] {
  const have = new Set(granted);
  return EMAIL_PROVIDERS[key].scopes.map((scope) => ({ scope, granted: have.has(scope) }));
}

/** A private key's shape, checked before it is sent anywhere. */
export function privateKeyProblem(key: EmailProviderKey, value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) return "Paste the private API key.";
  if (/\s/.test(trimmed)) return "The key has a space in it — copy it again from your email platform.";
  const prefix = EMAIL_PROVIDERS[key].keyPrefix;
  if (prefix && !trimmed.startsWith(prefix.prefix)) return prefix.wrong;
  if (trimmed.length < 20) return "That key looks too short — copy the whole key.";
  return null;
}
