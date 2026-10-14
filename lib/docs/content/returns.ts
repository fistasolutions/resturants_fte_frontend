import { defineDoc } from "@/lib/docs/define";

export const returnsDoc = defineDoc({
  slug: "returns",
  title: "Returns Analytics",
  route: "/returns",
  area: "operations",
  tagline: "Why products come back and what it costs — return rate, profit lost, sizing defects, category breakdown and the page fix each product needs, from Loop Returns.",
  sources: ["Loop Returns", "Shopify"],
  refresh: "Loop syncs every 15 minutes alongside the other integrations",
  updated: "2026-10-09",
  hero: "returns",
  heroCaption:
    "Returns Intelligence overview: return rate, return value, profit lost, exchange revenue, refund amount, open backlog and average resolution, the reason breakdown, the AI action plan and the attention card.",
  whatItIs: [
    "Returns Analytics is the Returns hub. It joins Loop's return records — reasons, sizes, exchanges, processing times — to the store's orders and costs, and answers what a return count alone cannot: which styles are hurting margin, whether the cause is sizing or something else, how much exchange revenue was recovered rather than refunded, and how fast the team is clearing the queue.",
    "It is team-level by design. Loop's data carries no employee identity, so nothing here is per person. When the returns queue ages, the page flags it and lets you email the returns lead from a reviewed draft.",
  ],
  whyItMatters: [
    {
      title: "Profit lost, not just returns counted",
      body: "Every style's return cost is computed with cost of goods, so the ranking is by money actually lost — and exchange revenue recovered is shown against refunds paid.",
    },
    {
      title: "Sizing problems become size-chart fixes",
      body: "The size heat grid shows which sizes of which styles come back, and Product Fixes maps the dominant reason to the page edit it implies — size chart, fit note, re-shoot, fabric detail, quality check.",
    },
    {
      title: "A weekly plan in plain language",
      body: "The AI writes a short, prioritised action plan from the computed figures — what to do this week and why.",
    },
    {
      title: "The queue is supervised",
      body: "An aging backlog raises a severity-toned card with a one-click email to the returns lead; Results shows whether it cleared.",
    },
  ],
  howItWorks: [
    "Loop's detailed returns list syncs into the database; refund lines from Shopify carry the money side.",
    "The engine computes return rate, value, profit lost (with COGS), exchange rate and revenue, refund amount, open backlog and average resolution for the range, then breaks returns down by style, size and category.",
    "Product Fixes applies a deterministic rule table — no model — from each product's dominant return reason to the recommended page change, ranked by the money that went out for that reason.",
    "The action plan is written by the AI from those computed figures; the backlog attention verdict comes from the backend.",
    "'Email returns lead' opens the shared compose panel; the send is logged and scored on Results → Returns.",
  ],
  sections: [
    {
      title: "Overview",
      route: "/returns?tab=overview",
      summary:
        "The KPI tiles, the return-reason breakdown, the AI action plan card and, when the queue is aging, the attention card with Email returns lead.",
      details: ["Reason bars show the share of returns by customer-stated reason."],
      screen: "returns",
    },
    {
      title: "By Style",
      route: "/returns?tab=by-style",
      summary: "Every returned style ranked by profit lost, with return rate, units and the real orders behind it; a style opens its detail page.",
      details: ["Filter by category; click a style for the per-size and per-reason view."],
    },
    {
      title: "Sizing",
      route: "/returns?tab=sizing",
      summary: "A size heat grid per style and the store-wide size profile — which sizes come back and where a sizing defect is flagged.",
      details: ["'No sizing defect flagged in this period' is the clean state."],
    },
    {
      title: "Categories",
      route: "/returns?tab=categories",
      summary: "Returns by product category — rate, value and profit lost — to see whether a problem is a style or a whole category.",
      details: [],
    },
    {
      title: "Product Fixes",
      route: "/returns?tab=fixes",
      summary:
        "Per product: the dominant return reason, the page fix it implies (size chart, fit note, re-shoot, fabric detail, quality check), and the money at stake.",
      details: [
        "'At stake' is money already lost to that reason — never a projected saving.",
        "The tab states its own coverage: only Loop returns carry a reason.",
        "An unmapped reason yields 'No page fix — demand or price' rather than a guess.",
        "The table searches by product or top reason, filters by fix with a count on each chip, and shows 15 products a page, in place.",
      ],
    },
    {
      title: "Bracketing",
      route: "/returns?tab=bracketing",
      summary:
        "Orders that held one style in two or more sizes, how they ended — kept all, kept one, kept some, returned everything — the styles that draw it most, and the customers who do it repeatedly.",
      details: [
        "Reads Shopify's own orders and refunds (in store and online), not Loop: the range is the orders' dates, and a refund counts whenever it came, because a return follows its sale.",
        "Tiles: bracket orders and their share of all orders, how many kept only one size, how many sent everything back, and the money refunded on bracket orders with its share of all refunds.",
        "By channel splits online, in store and other channels. Styles are ranked by money refunded on their bracket orders, with how many orders held the style, the bracket rate, and the style's verdict from the Fit tab (Product Analyst › Fit) where it has one — a click opens it.",
        "Customers has two lists. Repeat bracketers: at least 3 bracket orders that ended in a return, and returns from at least half of their bracket orders — so an account that buys several sizes and keeps them is not listed. High-return customers: at least 5 orders in the range with half or more of the units bought refunded.",
        "Customers are shown by name, or by a masked email when there is no name. The lists are patterns, not verdicts — a refund can be an exchange, a fault or a fit problem — and nothing is sent to anyone or flagged in Shopify.",
        "Glisp and the Report Builder read the same figures.",
      ],
    },
    {
      title: "Email the returns lead",
      route: "/returns/backlog/send",
      summary: "The compose panel for the aging-queue email — review, edit or AI-rewrite, then send; past sends alongside.",
      details: ["Recipient set under Settings → Manager notifications → Returns lead."],
    },
  ],
  howToUse: [
    "Open Returns Analytics and set the range. Read the KPIs and the reason breakdown, then the AI action plan.",
    "Go to By Style and sort by profit lost; open the worst style to see its sizes and reasons.",
    "Use Sizing to decide whether a size chart or fit note is needed; Product Fixes tells you the specific page edit per product.",
    "If the attention card is showing, click Email returns lead, review the draft, send.",
    "Cross-check Product Analyst → Return Leak for the same products from the merchandising side.",
  ],
  benefits: [
    "A ranked, dollar-quantified list of the styles bleeding margin to returns.",
    "The fix per product — a size chart, a re-shoot, a fabric note — instead of a return rate you can do nothing with.",
    "Exchange revenue counted, so recovery is visible, not just loss.",
    "A supervised returns queue with a logged escalation.",
  ],
  goodToKnow: [
    "Return reasons exist only for returns processed through Loop; the page states the share of refund lines that carry one.",
    "Nothing here is per employee — Loop's API has no employee field, and the product does not infer one.",
    "Profit lost requires variant cost; products without cost are shown with return value only.",
  ],
  related: ["products", "orders", "results", "team-performance"],
});
