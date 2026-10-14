import { defineDoc } from "@/lib/docs/define";

export const dashboardDoc = defineDoc({
  slug: "dashboard",
  title: "Dashboard",
  route: "/dashboard",
  area: "command",
  tagline: "The business at a glance — money at stake, then KPIs, net sales, what changed and why, alerts, channels, locations, and top products for any date range.",
  sources: ["Shopify"],
  refresh: "Re-fetches itself every 60 seconds; data is the 15-minute sync",
  updated: "2026-10-09",
  hero: "dashboard",
  heroCaption:
    "The dashboard for a date range: the money-at-stake strip, the KPI tiles with comparison deltas, the net-sales bridge, the 'what changed' card, dollar-priced alerts, revenue trend, channel split, locations, top products and recent orders.",
  whatItIs: [
    "The Dashboard is the numbers page. Pick any period — today, 7 days, 30 days, or a custom range with its comparison — and it shows revenue, orders, average order value, and new versus returning customers, each against the comparison period, followed by the breakdowns an owner actually asks for.",
    "Every figure is computed by the analytics engine from the synced Shopify data. The AI's only contribution here is the plain-English reading on the 'What changed, and why' card, written from figures it was handed.",
  ],
  whyItMatters: [
    {
      title: "Alerts priced in dollars, not counts",
      body: "Cash at stockout risk, cash frozen in dead stock, a returns spike, misplaced stock — each alert carries the money behind it, so 'should I reorder' has an instant answer.",
    },
    {
      title: "Net sales, not just gross",
      body: "The net-sales bridge shows gross → discounts → returns → net for the period, so the headline revenue can never hide what was given back.",
    },
    {
      title: "'Revenue is down' comes with a why",
      body: "The What-changed card decomposes the period's revenue delta product by product and states whether the move is broad-based or concentrated in a few items.",
    },
    {
      title: "Every location, always",
      body: "Location cards show each store and Online side by side — revenue, orders, AOV, top product and trend — and never drop a store just because it sold nothing.",
    },
  ],
  howItWorks: [
    "The 15-minute sync keeps orders, products, customers, inventory and refunds in the platform's own database.",
    "When you open the dashboard (or change the range), the server computes the KPIs, alerts, channel split, location metrics and top products in one parallel batch of set-based SQL queries — the page never calls Shopify live.",
    "The 'What changed' decomposition sums every product's revenue delta so the parts add exactly to the store's delta; the AI turns that into one readable paragraph.",
    "The page silently re-fetches every 60 seconds so the numbers track the sync without a manual reload.",
    "Every KPI and alert links to the page that explains it: Orders, Customers, Inventory, Returns.",
  ],
  sections: [
    {
      title: "Money at stake",
      route: "/dashboard",
      screen: "dashboard",
      summary:
        "Three cards at the very top: cash sitting still, leaked in the last 30 days, and at risk if nothing changes — each a total, the question it answers, and its largest lines with a link to act.",
      details: [
        "Cash sitting still (right now): dead stock with no sale in 90 days, best-sellers in storage while stores are out, paid orders unshipped over 48 hours.",
        "Leaked in the last 30 days: discount codes that won nobody new, manual discounts that broke policy, returns for a reason you can fix.",
        "At risk if nothing changes (right now): best-sellers about to run out, and what your best customers who have gone quiet spent in the last 12 months — never their lifetime value.",
        "These windows are fixed and do not follow the date picker — the titles say which window each number covers.",
        "Every amount is the same figure its own page shows (Inventory, Orders, Discounts, Products, Foresight, Customers); the strip only adds them up. Links carry the same date window, so the number you land on is the number you clicked.",
        "A card shows its two largest lines and folds the rest behind '+ N more'. A number with nothing behind it says 'Nothing found' — a real zero, shown as good news.",
        "If a source could not be read, its line is left out and a note under the strip says how many are missing — figures are never padded with a $0.",
        "Fetched separately, so it never delays the rest of the page.",
      ],
    },
    {
      title: "KPI tiles",
      route: "/dashboard",
      summary:
        "Revenue, orders, average order value, new customers and returning customers for the chosen period, each with its delta against the comparison period.",
      details: [
        "Orders and New customers tiles link to their pages.",
        "The Compare menu beside the date picker chooses what the KPIs are measured against: the previous period (the default), last year on the same dates, last year on the Hebrew calendar, or nothing. The label under each delta names the exact dates the backend compared.",
        "Last year on the Hebrew calendar compares the same Hebrew dates one Hebrew year earlier, so a festival week is measured against the same festival last year — Pesach 2026 (from 2 April) against Pesach 2025 (from 13 April) — rather than against whatever week fell on those Gregorian dates.",
        "When the range or the compared window holds a festival, a line under the KPIs says which, and whether the two windows hold the same festivals. If they don't — typically a Gregorian 'last year' around Pesach or the Tishrei holidays — it says the comparison isn't like for like and offers Compare by Hebrew calendar. Festivals follow the diaspora calendar.",
        "The Hebrew-calendar comparison and the festival line appear only for an organization whose calendar is set to Hebrew; for any other organization the Compare menu offers the previous period, last year and no comparison, and an old link asking for the Hebrew comparison opens compared with last year instead.",
        "The ✦ in each tile's corner — and in each money card's — opens the Ask Glisp panel with that figure already asked about (see Chat with AI › Explain this).",
      ],
    },
    {
      title: "Net sales bridge",
      route: "/dashboard",
      summary:
        "A waterfall directly under revenue: gross sales, less discounts, less returns, equals net sales for the period.",
      details: [
        "Discounts are the order-level figure Shopify records; returns are refunds by refund date.",
        "Omitted only if the backend cannot serve it for the range.",
      ],
    },
    {
      title: "What changed, and why",
      route: "/dashboard",
      summary:
        "The revenue delta versus the comparison period, decomposed into the products that moved it, with a concentration line and an AI reading.",
      details: [
        "Gainers and losers both render — a store can be down overall while something is up.",
        "The only cause-like label is 'Sold out', and it is a fact (zero on hand, was selling), never an inference.",
        "The concentration line says whether five products did it or three thousand did.",
      ],
    },
    {
      title: "Alerts",
      route: "/dashboard",
      summary:
        "Five cards between the KPIs and the chart: Unfulfilled orders, Low stock risk, Dead stock, Returns spike, Misplaced stock — each with a dollar figure and a drill-down.",
      details: [
        "Low stock risk → Inventory → Reorder; Dead stock → Inventory → Dead Stock.",
        "Returns spike → Orders → returns spike list; Misplaced stock → Inventory → Allocation.",
        "Unfulfilled orders → Orders, filtered to the unfulfilled slice.",
      ],
    },
    {
      title: "Revenue overview, sales by channel, locations",
      route: "/dashboard",
      summary:
        "The revenue trend for the period, a donut of revenue by sales channel (online, POS locations), and one card per location with its own mini trend.",
      details: [
        "Location cards show revenue, orders, AOV, new-vs-returning split, unfulfilled count and the top product for that store.",
        "Locations are always listed, even at zero sales.",
      ],
    },
    {
      title: "Top products and recent orders",
      route: "/dashboard",
      summary:
        "The best-selling products by revenue with images, and the latest orders with status — both linking into Product Analyst and Orders.",
      details: [
        "Top products link to the product detail page.",
        "Recent orders is the last panel of the main column and fills the height the right column leaves, so the two columns end together; it carries the newest twenty orders and scrolls the rows the height cannot show under a fixed header.",
        "Recent orders link to the order detail page.",
      ],
    },
  ],
  howToUse: [
    "Open Dashboard. Read the three money cards first — cash sitting still, leaked last month, at risk — and click any line to go straight to the page that fixes it.",
    "The default range is the current period; use the date picker (top right) to choose Today, 7 days, 30 days, or a custom range, and the Compare menu next to it to choose what it is measured against. Around a festival, pick Last year (Hebrew calendar). The money cards keep their own fixed windows.",
    "Read the five KPI tiles and their deltas. Click Orders or New customers to drill in.",
    "Check the net-sales bridge to see how much of gross was given back in discounts and returns.",
    "Read the What-changed card to understand the KPI move before reacting to it.",
    "Scan the five alert cards; click any to open the ranked list behind it.",
    "Use the location cards to compare stores; click through to Store Traffic or Foresight → Store League for the deeper view.",
    "Leave the page open on a screen — it refreshes itself every minute.",
  ],
  benefits: [
    "One glance replaces a morning of report pulling.",
    "The three numbers a partner would ask for — stuck, leaked, at risk — are on screen before the first scroll, each traceable to the page it came from.",
    "Alerts arrive with a dollar figure and a link to the fix.",
    "Revenue movements come with a decomposition, not a guess.",
    "Store-by-store comparison without leaving the page.",
  ],
  goodToKnow: [
    "Ranges and comparisons are shared through the URL, so a dashboard view can be bookmarked or sent to a colleague.",
    "The dashboard reads the local database only; if the sync is stale, Settings and the Morning Brief's integration tiles say so.",
    "'What changed' is a decomposition, not a causal claim — it will never say 'because of the promotion'; the data cannot support it.",
    "The date-range picker on this page is the same component every analyst page uses; a range chosen here does not carry to other pages unless the link carries it.",
  ],
  related: ["brief", "orders", "inventory", "products", "foresight"],
});
