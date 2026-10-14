/**
 * The Integrations hub's copy (SPEC-328) — one entry per connection, pure data.
 *
 * The keys are the contract with backend SPEC-337 (`services/integrations/catalog.py`): the
 * backend judges each connection's health, this file says what it is, what it reads, which
 * pages it powers and how to connect it. Field keys match the backend's whitelists
 * (`EDITABLE_FIELDS` / `SECRET_FIELDS`), so the connect dialog and the Settings tab post
 * exactly what the API accepts.
 */

export const INTEGRATION_KEYS = [
  "shopify",
  "gorgias",
  "loop",
  "klaviyo",
  "ipacky",
  "vcount",
  "clarity",
  "gsc",
  "meta",
  "quickbooks",
] as const;

export type IntegrationKey = (typeof INTEGRATION_KEYS)[number];
/** The settings API's provider names for the apps connected with a key (SMTP included). */
export type KeyProvider = "gorgias" | "loop" | "klaviyo" | "ipacky" | "vcount" | "clarity" | "smtp";

export type IntegrationArea = "store" | "marketing" | "support" | "ops" | "finance" | "traffic";
export type IntegrationKind = "app" | "key" | "oauth";

export const AREAS: Record<IntegrationArea, string> = {
  store: "Store",
  marketing: "Marketing",
  support: "Support & returns",
  ops: "Operations",
  finance: "Finance",
  traffic: "Search & traffic",
};

export const AREA_ORDER: IntegrationArea[] = ["store", "marketing", "support", "ops", "finance", "traffic"];

export interface FieldSpec {
  key: string;
  label: string;
  type?: "text" | "number" | "time" | "email";
  hint?: string;
  placeholder?: string;
}

export interface PageLink {
  label: string;
  href: string;
}

export interface IntegrationApp {
  key: IntegrationKey;
  name: string;
  /** The vendor's own mark, served from `public/app-logos/` — identifies the app it
   * connects to (Simple Icons' CC0 glyphs in the vendor's colour, else the vendor's own icon). */
  logo: string;
  area: IntegrationArea;
  kind: IntegrationKind;
  /** The vendor the owner signs in with (OAuth apps). */
  vendor?: string;
  /** A short second line under the name. */
  sub: string;
  description: string;
  unlocks: string;
  reads: string[];
  /** The one thing we send, for the two apps that send anything. */
  sends?: string;
  powers: PageLink[];
  /** How often it syncs, in words. */
  cadence: string;
  /** Key apps only: the settings provider and its fields. */
  provider?: KeyProvider;
  fields?: FieldSpec[];
  secrets?: FieldSpec[];
  help?: string[];
}

export const APPS: Record<IntegrationKey, IntegrationApp> = {
  shopify: {
    key: "shopify",
    name: "Shopify",
    logo: "/app-logos/shopify.svg",
    area: "store",
    kind: "app",
    sub: "Your store",
    description: "Orders, products, customers, inventory, discounts, locations and refunds.",
    unlocks: "The whole app",
    reads: [
      "Orders, refunds and fulfilments",
      "Products, variants and collections",
      "Customers and their order history",
      "Inventory at every location",
      "Discount codes and their use",
    ],
    powers: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Orders", href: "/orders" },
      { label: "Products", href: "/products" },
      { label: "Customers", href: "/customers" },
      { label: "Inventory", href: "/inventory" },
      { label: "Discounts", href: "/discounts" },
    ],
    cadence: "Every 15 minutes",
  },
  gorgias: {
    key: "gorgias",
    name: "Gorgias",
    logo: "/app-logos/gorgias.png",
    area: "support",
    kind: "key",
    sub: "Customer support",
    description: "Tickets, first response time and satisfaction, per agent.",
    unlocks: "Team Performance",
    reads: ["Tickets and their messages", "Agents and their assignments", "Satisfaction survey scores"],
    powers: [
      { label: "Team Performance", href: "/team-performance" },
      { label: "Customers", href: "/customers" },
    ],
    cadence: "Every 15 minutes",
    provider: "gorgias",
    fields: [
      { key: "subdomain", label: "Subdomain", hint: "The part before .gorgias.com", placeholder: "yourstore" },
      { key: "email", label: "Account email", type: "email", placeholder: "support@yourstore.com" },
    ],
    secrets: [{ key: "api_token", label: "API key" }],
    help: [
      "In Gorgias, open Settings → REST API.",
      "Copy the account email and create an API key.",
      "Paste both here.",
    ],
  },
  loop: {
    key: "loop",
    name: "Loop Returns",
    logo: "/app-logos/loop-returns.png",
    area: "support",
    kind: "key",
    sub: "Returns",
    description: "Return reasons, exchanges, processing time and backlog.",
    unlocks: "Returns Analytics and Products → Fit",
    reads: ["Returns and their reasons", "Exchanges and the size chosen", "Processing dates and warehouse receipts"],
    powers: [
      { label: "Returns Analytics", href: "/returns" },
      { label: "Products → Fit", href: "/products/fit" },
    ],
    cadence: "Every 15 minutes",
    provider: "loop",
    fields: [],
    secrets: [{ key: "api_key", label: "API key" }],
    help: [
      "In Loop, open Tools & integrations → Developers.",
      "Create an API key with read access to returns.",
      "Paste it here.",
    ],
  },
  klaviyo: {
    key: "klaviyo",
    name: "Klaviyo",
    logo: "/app-logos/klaviyo.png",
    area: "marketing",
    kind: "key",
    sub: "Email & SMS",
    description: "Your email platform: the Email Marketing Manager plans, writes and measures in it, and the Morning Brief sends winbacks to it.",
    unlocks: "The Email Marketing Manager and one-click winback from the Morning Brief",
    reads: [
      "Your campaigns, flows, lists and segments, and their results",
      "Your subscribers' consent — read, never changed",
    ],
    sends: "Campaigns, flows and list updates the Email Marketing Manager prepares — only those you approve, or that your autonomy setting allows — and customers you choose to win back, only when you press Send.",
    powers: [
      { label: "Email Marketing", href: "/email-marketing" },
      { label: "Morning Brief", href: "/brief" },
    ],
    cadence: "Hourly, plus a nightly report",
    provider: "klaviyo",
    fields: [{ key: "winback_list_id", label: "Winback list ID", hint: "Lists & segments → your list → Settings" }],
    secrets: [{ key: "private_key", label: "Private API key" }],
    help: [
      "In Klaviyo, open Settings → API keys.",
      "Create a private key with Lists and Profiles write access.",
      "Paste it here with the ID of the list winback customers go to.",
    ],
  },
  ipacky: {
    key: "ipacky",
    name: "iPacky",
    logo: "/app-logos/ipacky.png",
    area: "ops",
    kind: "key",
    sub: "Warehouse packing",
    description: "Orders packed per person, per hour.",
    unlocks: "Warehouse",
    reads: ["Packing sessions per packer"],
    powers: [{ label: "Warehouse", href: "/warehouse" }],
    cadence: "Every 15 minutes, finalised daily",
    provider: "ipacky",
    fields: [
      { key: "email", label: "Login email", type: "email" },
      { key: "sync_time", label: "Daily sync time", type: "time", hint: "In your store's time" },
    ],
    secrets: [{ key: "password", label: "Password" }],
    help: ["Use the login of an iPacky admin account.", "Choose when yesterday's day is locked in."],
  },
  vcount: {
    key: "vcount",
    name: "V-Count",
    logo: "/app-logos/v-count.png",
    area: "ops",
    kind: "key",
    sub: "In-store footfall",
    description: "Door counts from your shops, turned into in-store conversion.",
    unlocks: "Store Traffic → in-store conversion",
    reads: ["Visitor counts per door, per hour"],
    powers: [{ label: "Store Traffic", href: "/traffic" }],
    cadence: "Every 15 minutes, finalised daily",
    provider: "vcount",
    fields: [
      { key: "username", label: "API username" },
      { key: "sync_time", label: "Daily sync time", type: "time", hint: "In your store's time" },
    ],
    secrets: [{ key: "password", label: "API password" }],
    help: ["Ask V-Count support for API access.", "They send an API username and password.", "Paste both here."],
  },
  clarity: {
    key: "clarity",
    name: "Microsoft Clarity",
    logo: "/app-logos/microsoft-clarity.png",
    area: "traffic",
    kind: "key",
    sub: "Site behaviour",
    description: "Scroll depth, rage clicks and script errors, joined to revenue.",
    unlocks: "Store Traffic → behaviour",
    reads: ["One day of page behaviour per sync (3 of Clarity's 10 daily reads)"],
    powers: [{ label: "Store Traffic", href: "/traffic" }],
    cadence: "Daily",
    provider: "clarity",
    fields: [{ key: "project_id", label: "Project ID", hint: "It is in your Clarity URL" }],
    secrets: [{ key: "api_token", label: "Data export token" }],
    help: [
      "In Clarity, open Settings → Data export.",
      "Generate a token (a Clarity admin can).",
      "Paste the project ID and the token here.",
    ],
  },
  gsc: {
    key: "gsc",
    name: "Google Search Console",
    logo: "/app-logos/google-search-console.svg",
    area: "traffic",
    kind: "oauth",
    vendor: "Google",
    sub: "Search",
    description: "What people search for before they land on your store.",
    unlocks: "Search Visibility and Money pages",
    reads: ["Search queries, clicks and positions for the property you choose"],
    powers: [{ label: "Search Visibility", href: "/spotlight" }],
    cadence: "Daily",
  },
  meta: {
    key: "meta",
    name: "Meta",
    logo: "/app-logos/meta.svg",
    area: "marketing",
    kind: "oauth",
    vendor: "Meta",
    sub: "Facebook & Instagram · posts and ads",
    description: "Publishes the posts you approve, and reads your ad accounts to audit where ad money is wasted.",
    unlocks: "Social Media Manager publishing and the Paid Ads Manager audit",
    reads: [
      "Your Facebook Page and linked Instagram account",
      "Reach and engagement of your posts",
      "Campaigns, ad sets, ads and results in the ad accounts you choose (read-only)",
    ],
    sends: "Posts you approved, published to your Page and Instagram. Nothing is ever changed in your ad accounts.",
    powers: [
      { label: "Social Media Manager", href: "/social" },
      { label: "Paid Ads Manager · Audit", href: "/ads?tab=audit" },
    ],
    cadence: "Posts as they come due · ads read every 3 hours",
  },
  quickbooks: {
    key: "quickbooks",
    name: "QuickBooks Online",
    logo: "/app-logos/quickbooks.svg",
    area: "finance",
    kind: "oauth",
    vendor: "Intuit",
    sub: "Accounts payable",
    description: "Bills, vendors, payments and bank balances across your companies.",
    unlocks: "Accounts Payable",
    reads: ["Unpaid and paid bills", "Vendors and payment terms", "Bill payments and bank balances"],
    powers: [{ label: "Accounts Payable", href: "/employees/finance" }],
    cadence: "Hourly",
  },
};

/** Your own mail server — lives under Included, not as a connection. */
export const SMTP_FIELDS: { fields: FieldSpec[]; secrets: FieldSpec[] } = {
  fields: [
    { key: "host", label: "Host", placeholder: "smtp.yourstore.com" },
    { key: "port", label: "Port", type: "number", placeholder: "587" },
    { key: "from_email", label: "From address", type: "email", placeholder: "reports@yourstore.com" },
  ],
  secrets: [
    { key: "user", label: "Username" },
    { key: "password", label: "Password" },
  ],
};

export interface ComingSoonApp {
  name: string;
  logo: string;
  area: IntegrationArea;
  description: string;
}

export const COMING_SOON: ComingSoonApp[] = [
  { name: "Google Ads", logo: "/app-logos/google-ads.svg", area: "marketing", description: "Spend, ROAS and campaign results." },
  { name: "Google Analytics 4", logo: "/app-logos/google-analytics.svg", area: "traffic", description: "Sessions, sources and conversion funnels." },
  { name: "Triple Whale", logo: "/app-logos/triple-whale.png", area: "marketing", description: "Blended attribution and profit." },
  { name: "Slack", logo: "/app-logos/slack.svg", area: "ops", description: "Reports and alerts in your channels." },
  { name: "BigQuery", logo: "/app-logos/bigquery.svg", area: "ops", description: "Your data in your own warehouse." },
];

/** What we never do with any connection — true of every one, stated per app. */
export function neverDo(app: IntegrationApp): string[] {
  const lines = [
    `Change, delete or create anything in ${app.name}`,
    `Share your ${app.name} data outside your organization`,
  ];
  if (!app.sends) lines.splice(1, 0, `Send messages or posts from your ${app.name} account`);
  return lines;
}

export function isIntegrationKey(value: string): value is IntegrationKey {
  return (INTEGRATION_KEYS as readonly string[]).includes(value);
}

/** How the owner connects it, in a few words. */
export function connectMethod(app: IntegrationApp): string {
  if (app.kind === "oauth") return `Sign in with ${app.vendor ?? app.name}`;
  if (app.kind === "app") return "Installed with the store";
  return "API key";
}
