/**
 * The helpdesk capability matrix (SPEC-346). One row per helpdesk; the Customer Support Agent's
 * screens ask `can(provider, capability)` and never compare a provider's name, so adding a
 * helpdesk is one row here and one adapter in the backend — no new screens.
 *
 * Only Gorgias is `available`. Its facts are from Gorgias's developer reference: REST at
 * `https://{subdomain}.gorgias.com/api`, HTTP Basic with the account email and an API key (OAuth2
 * for a public app), a leaky bucket of 40 requests per 20 s on a key and 80 on OAuth, and `429`
 * with `Retry-after`. The coming-soon rows are shown by name only; their booleans are left all
 * false until each adapter is built and its capabilities are checked, so the UI never claims a
 * capability nobody has verified.
 */

import type {
  Channel,
  HelpdeskCapabilities,
  HelpdeskProvider,
  HelpdeskProviderKey,
} from "@/types/customer-support";

export type CapabilityKey = Exclude<keyof HelpdeskCapabilities, "channels">;

const NONE: HelpdeskCapabilities = {
  replyOnChannel: false,
  internalNotes: false,
  tags: false,
  customFields: false,
  assignTeams: false,
  snooze: false,
  macros: false,
  rulesRead: false,
  csat: false,
  realtimeWebhooks: false,
  sidebarWidget: false,
  voice: false,
  channels: [],
};

function comingSoon(key: HelpdeskProviderKey, name: string): HelpdeskProvider {
  return { key, name, status: "coming_soon", auth: [], rateLimit: null, capabilities: NONE };
}

export const HELPDESK_PROVIDERS: Record<HelpdeskProviderKey, HelpdeskProvider> = {
  gorgias: {
    key: "gorgias",
    name: "Gorgias",
    status: "available",
    auth: [
      { method: "api_key", live: true },
      { method: "oauth", live: false },
    ],
    rateLimit: {
      requests: 40,
      windowSeconds: 20,
      note: "40 requests per 20 seconds on an API key, 80 on OAuth; a 429 carries Retry-after.",
    },
    capabilities: {
      replyOnChannel: true,
      internalNotes: true,
      tags: true,
      customFields: true,
      assignTeams: true,
      snooze: true,
      macros: true,
      rulesRead: true,
      csat: true,
      realtimeWebhooks: true,
      sidebarWidget: true,
      voice: true,
      channels: [
        "email",
        "chat",
        "sms",
        "facebook",
        "instagram",
        "whatsapp",
        "twitter",
        "phone",
        "contact_form",
        "help_center",
      ],
    },
  },
  zendesk: comingSoon("zendesk", "Zendesk"),
  freshdesk: comingSoon("freshdesk", "Freshdesk"),
  reamaze: comingSoon("reamaze", "Re:amaze"),
  helpscout: comingSoon("helpscout", "Help Scout"),
  intercom: comingSoon("intercom", "Intercom"),
  kustomer: comingSoon("kustomer", "Kustomer"),
  richpanel: comingSoon("richpanel", "Richpanel"),
  shopify_inbox: comingSoon("shopify_inbox", "Shopify Inbox"),
};

/** Picker order: what can be connected first, then the rest by name. */
export const HELPDESK_ORDER: HelpdeskProviderKey[] = [
  "gorgias",
  "zendesk",
  "freshdesk",
  "reamaze",
  "helpscout",
  "intercom",
  "kustomer",
  "richpanel",
  "shopify_inbox",
];

export function helpdesk(key: HelpdeskProviderKey): HelpdeskProvider {
  return HELPDESK_PROVIDERS[key];
}

/** Whether this helpdesk can do it. The only question the screens ask. */
export function can(key: HelpdeskProviderKey, capability: CapabilityKey): boolean {
  return HELPDESK_PROVIDERS[key].capabilities[capability];
}

export function canReplyOn(key: HelpdeskProviderKey, channel: Channel): boolean {
  const caps = HELPDESK_PROVIDERS[key].capabilities;
  return caps.replyOnChannel && caps.channels.includes(channel);
}

export const CHANNEL_LABELS: Record<Channel, string> = {
  email: "Email",
  chat: "Chat",
  sms: "SMS",
  facebook: "Facebook",
  instagram: "Instagram",
  whatsapp: "WhatsApp",
  twitter: "X (Twitter)",
  phone: "Phone",
  contact_form: "Contact form",
  help_center: "Help centre",
};

export const CAPABILITY_LABELS: Record<CapabilityKey, string> = {
  replyOnChannel: "Replies on the customer's channel",
  internalNotes: "Internal notes",
  tags: "Tags",
  customFields: "Custom fields",
  assignTeams: "Assign to teams",
  snooze: "Snooze",
  macros: "Macros",
  rulesRead: "Reads your automation rules",
  csat: "Satisfaction surveys",
  realtimeWebhooks: "Real-time intake",
  sidebarWidget: "Sidebar panel for your agents",
  voice: "Calls (read-only)",
};
