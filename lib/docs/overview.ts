import type { DocScreenKey } from "@/lib/docs/screens";
import { PRODUCT } from "@/lib/product";

/**
 * The "Start here" overview of the docs (SPEC-229) — written for someone who has
 * never opened the app. Data only; rendered by `features/docs/docs-overview.tsx`.
 */

export interface OverviewPrinciple {
  title: string;
  body: string;
}

export interface OverviewStep {
  title: string;
  body: string;
}

export interface ConnectedSystem {
  name: string;
  feeds: string;
  pages: string;
}

export interface OverviewConvention {
  title: string;
  body: string;
}

export interface OverviewScreen {
  screen: DocScreenKey;
  title: string;
  caption: string;
}

export const OVERVIEW_INTRO = {
  eyebrow: "Start here",
  title: `What ${PRODUCT.name} is`,
  paragraphs: [
    `${PRODUCT.name} is a team of digital employees built on top of one Shopify store. It is not a chatbot bolted onto Shopify admin and it never changes anything in the store. It connects read-only, copies the store's data into its own database every fifteen minutes, computes every business metric itself, and then uses AI to explain what the numbers mean, draft the messages a manager would write, and propose the decisions worth making today.`,
    "Around that core sit the systems a retailer actually runs on — support tickets, returns, warehouse packing, in-store footfall, email marketing, search and social — each connected so that its data can be joined to sales. The result is one place where the questions that used to need six reports have one answer, priced in dollars, with the evidence attached.",
  ],
} as const;

export const OVERVIEW_PRINCIPLES: OverviewPrinciple[] = [
  {
    title: "The backend calculates",
    body: "Revenue, margin, cover, return rate, conversion — every figure is computed by the analytics engine in the database. Deterministic, tested, the same number on every page.",
  },
  {
    title: "The AI interprets",
    body: "The agents receive already-computed figures and turn them into verdicts, narratives, drafts and picks. No AI in the product can produce a number of its own. Every agent is written for any store: what yours sells, who buys from it, its voice and its picture rules come from your Brand Brain, so what an agent writes is about your business.",
  },
  {
    title: "A human approves",
    body: "Emails, blog posts, social posts, ad spend and list syncs all wait for a person unless you deliberately switch on automation — and every send is logged and later scored.",
  },
];

export const OVERVIEW_FLOW: OverviewStep[] = [
  {
    title: "Connect",
    body: "Shopify is connected read-only; Gorgias, Loop, iPacky, V-Count, Klaviyo, Clarity, Search Console and Meta are added on the Integrations page as you need them.",
  },
  {
    title: "Sync",
    body: "Every 15 minutes the scheduler pulls new and changed orders, products, inventory, customers, tickets, returns, packing records and footfall into the platform's own database. Nothing on any page calls Shopify live.",
  },
  {
    title: "Compute",
    body: "The analytics engine calculates every metric with set-based queries — from the dashboard KPIs to true profit per SKU, days of cover, conversion per hour and tax per jurisdiction.",
  },
  {
    title: "Interpret",
    body: "AI agents read the computed figures and write the Morning Brief, the daily report, page commentary, chat answers, draft emails, articles and social posts.",
  },
  {
    title: "Decide and measure",
    body: "You approve, send, publish or skip. The Results page measures what each action changed; AI Performance and System show how the agents and the jobs themselves performed.",
  },
];

export const CONNECTED_SYSTEMS: ConnectedSystem[] = [
  { name: "Shopify", feeds: "Orders, products, variants and costs, inventory, customers, discounts, refunds, locations, tax lines — read-only, every 15 minutes", pages: "Everything" },
  { name: "FoodTec (restaurant POS)", feeds: "For a restaurant brand: orders with their times, channels and lines, the menu with recipe costs, and daily labor — pushed by an integration with a brand-issued ingest key, or imported from its report exports. Read-only: nothing is ever written back to the POS", pages: "Network, Menu Engineering, Operations, Guests, Royalties" },
  { name: "Gorgias", feeds: "Support tickets, messages, agents, CSAT; the Customer Support Agent replies (approved by you, or on autopilot topics inside the guardrails), leaves internal notes and updates tickets through it", pages: "Team Performance, Morning Brief, Chat, Customer Support Agent" },
  { name: "Loop Returns", feeds: "Return records, reasons, sizes, exchanges, processing times", pages: "Returns Analytics, Product Analyst, Foresight" },
  { name: "iPacky", feeds: "Packing performance per packer and order", pages: "Warehouse, Morning Brief" },
  { name: "V-Count", feeds: "In-store footfall per store per hour", pages: "Store Traffic, Foresight, Morning Brief" },
  { name: "Klaviyo", feeds: "Receives the reviewed win-back list; the Email Marketing Manager reads campaigns, flows, lists, profiles and reports from it, and on your approval sends campaigns and builds flows through it", pages: "Customers, Results, Email Marketing Manager" },
  { name: "Microsoft Clarity", feeds: "Website behaviour per page, source and device", pages: "Store Traffic → Website, Search Visibility → Published, Paid Ads Manager" },
  { name: "Google Search Console", feeds: "Search impressions, clicks and position per post", pages: "Search Visibility → Visibility and Published" },
  { name: "Meta", feeds: "Publishes approved posts to Instagram and Facebook; returns insights", pages: "Social Media Manager" },
  { name: "Email (SMTP)", feeds: "Sends every manager and supervision email", pages: "Morning Brief, Inventory, Orders, Discounts, Warehouse, Team Performance, Returns" },
  { name: "AI model providers", feeds: "OpenAI, Anthropic and Google Gemini as cards on Integrations — one is the system default for text, OpenAI or Gemini for images, Google Veo for video; Chat can run on the owner's own pick, remembered on the account", pages: "Every AI surface; metered on AI Performance" },
];

export const OVERVIEW_CONVENTIONS: OverviewConvention[] = [
  {
    title: "Sidebar and tabs",
    body: "Every destination is in the left sidebar (collapse it with ⌘B); the AI employees sit under one row, Digital Employees — listed under it and open by default; its chevron folds them away — and the row stays lit while you are inside any of them. Analyst pages are tab workspaces: the header, date picker and tab bar stay put while the tab's content changes, and the URL carries the tab and range so any view can be bookmarked or shared.",
  },
  {
    title: "A workspace that grows with your data",
    body: "A new organization starts guided: the sidebar shows only the pages your store's data can fill, and inside each page only the tabs that have data. A tab that needs an integration, a second location, in-store sales, three years of history or a first action stays out of the way until that is true, and a page with no such tab stays out of the sidebar. Open one from a link and it says what unlocks it, with one button to do it: connect the integration, open the Morning Brief, or switch the employee on. Digital Employees start with Search Visibility and Report Builder; the others join once switched on. An owner or admin turns any page, tab or employee on or off for the company in Settings → Sidebar; whatever it needs to connect appears in Setup at the top right with a progress bar, and on Integrations, until it is connected. Setup opens by itself when a step appears, follows each app's first sync, and brings you back to the page you switched on once that app has synced. For a new store, Setup also carries the store's first sync (five steps, each saying what it is loading: orders, customers, stock, forecasts, yesterday's report) and then the Brand Brain research, every step live with what it is doing and its time (your store, what you sell, who buys, your profile, voice, customer types, reviews, look and competitors, run together), ending in a Review button. Everyone can still hide pages just for themselves.",
  },
  {
    title: "Roles decide what you can do",
    body: "Every member of the organization holds a role — Owner, Admin, Manager, Social media manager, Analyst, Viewer, or one your organization builds in Settings → Roles. A page your role cannot open is not in your sidebar. A button your role cannot use is shown disabled with the reason, such as which permission it needs and who to ask, rather than failing after the click. Smaller actions your role cannot take are simply not shown. The server checks the same permissions on every request.",
  },
  {
    title: "Plans and your organization",
    body: "One plan per annual-revenue band, with every feature in every plan. Settings → Billing & plan shows yours, its AI allowance and your invoices. Your organization keeps its own people, roles, branding, login link, keys and data — nothing is shared with another organization.",
  },
  {
    title: "The date-range picker",
    body: "Today, 7 days, 30 days, or a custom range with its comparison period. The label on the picker and the data on the page always describe the same window.",
  },
  {
    title: "Dollar-ranked lists",
    body: "Wherever a list could be sorted by count, it is sorted by money instead — revenue at risk, cash frozen, profit lost — so the top row is always the biggest lever.",
  },
  {
    title: "Verdicts and AI reads",
    body: "Pills such as Strong day, Critical, Not acquiring, Reorder now are computed by the backend. The 'AI read' callout beneath a chart is the AI's interpretation of those figures — never their source.",
  },
  {
    title: "Ask Glisp anywhere",
    body: "The Ask Glisp button at the bottom-right of every desktop page (the analyst icon in the top bar on a phone, or ⌘J / Ctrl+J) opens the chat analyst in a side panel that knows which page, tab, date range and product, order or store you are looking at, and offers prompts for it. It is the same analyst and the same history as Chat with AI; the thread survives moving between pages, and Open full workspace hands it to the chat page.",
  },
  {
    title: "Explain this",
    body: "Every KPI card and verdict tile the analyst can verify carries a small ✦ in its corner. One click opens the Ask Glisp panel with that figure already asked about — label, value, change and caption — and the analyst re-fetches the number with its own tool before explaining what moved it and what to do next. Cards whose figures no tool can recompute (AI Performance, System, Social, Ads, forecasts) have no ✦, on purpose. For everything that is not a card, highlight the text — a row, an alert, a name — and click the Ask Glisp bubble that appears above it (or press ⌘J with it selected). And when a page has one figure worth a look, the Ask Glisp button says so first: a dot and a one-line card — revenue swinging against yesterday, orders waiting too long, best-sellers about to run out — with Explain one click away.",
  },
  {
    title: "Review & Send",
    body: "Any action that leaves the platform — an email to a manager, a list to Klaviyo, a post to Meta, a blog to the storefront — first shows you exactly what will go, to whom. Automatic sending is an explicit switch in Settings.",
  },
  {
    title: "Notifications",
    body: "The bell beside your name in the sidebar (and in the phone header) counts what is new: a scheduled report that sent itself, one waiting for your approval, one that could not be built or emailed. Opening one takes you to it and marks it read. The inbox is shared by everyone in the store.",
  },
  {
    title: "Honest data",
    body: "When a figure cannot be computed the page says why ('No cost data', 'Not reported', 'coverage 5.7%') rather than showing a zero. Test fixtures and catalogue errors are excluded and disclosed. Cost means the landed cost recorded on Products → Costs where one is in force for the sale's date, and Shopify's unit cost otherwise — never a mix inside one line.",
  },
  {
    title: "Light and dark",
    body: "Light is the default; the toggle in the sidebar footer switches to dark. Every page is built for both.",
  },
  {
    title: "Fast by construction",
    body: "Pages read the local database only, fetch in parallel, show skeletons while loading, stream AI text as it is written, and never animate content into place.",
  },
];

export const FIRST_TEN_MINUTES: OverviewStep[] = [
  { title: "Sign up or sign in", body: "Create your account with Google or your work email, choose the plan for your annual revenue, and connect Shopify — the first sync starts on its own and Setup shows each step. A teammate you invite signs in from your team's own login link. The app opens on the Morning Brief." },
  { title: "Read the Morning Brief", body: "Yesterday's headline, what needs attention, and today's decisions with their evidence. Try Review & Send on one card to see the per-location review." },
  { title: "Open the Dashboard", body: "Change the date range, read the KPIs and the net-sales bridge, click an alert to land on the list behind it." },
  { title: "Ask the analyst", body: "Go to Chat with AI and ask a question in your own words — 'what sold best last week at my biggest store?'. Watch the answer lead with the conclusion." },
  { title: "Pick one analyst page", body: "Product Analyst → True Profit or Inventory Analyst → Reorder shows the platform's core habit: a money-ranked list with a next step." },
  { title: "Check Settings", body: "Set the manager email per location and the daily report time. Everything that sends depends on the first; everything scheduled shows on System." },
];

export const OVERVIEW_SCREENS: OverviewScreen[] = [
  { screen: "login", title: "Sign in", caption: "The sign-in page: Google or email, with Create an account for a new company." },
  { screen: "brief", title: "Morning Brief", caption: "Where every day starts: attention, decisions, overnight watch, predictions, integration health." },
];
