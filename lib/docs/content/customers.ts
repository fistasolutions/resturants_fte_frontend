import { defineDoc } from "@/lib/docs/define";

export const customersDoc = defineDoc({
  slug: "customers",
  title: "Customers",
  route: "/customers",
  area: "customers",
  tagline: "The money finder — who stopped buying, what they are worth, when they usually come back, and the vetted list to win them back.",
  sources: ["Shopify", "Klaviyo"],
  refresh: "15-minute sync; the win-back review is prepared with the Morning Brief",
  updated: "2026-10-13",
  hero: "customers",
  heroCaption:
    "Customers → Money Finder: the headline of customers flagged and their combined lifetime value, the Drifting VIPs, Category lovers and Sale-only shoppers cards, and the Due-to-reorder table.",
  whatItIs: [
    "Customers is not a CRM list; it is a money finder. It looks at every customer's own buying rhythm and lifetime value and surfaces the groups worth contacting now: VIPs who have gone quiet for longer than their usual gap, customers overdue to reorder, category loyalists, and shoppers who only buy on discount. Every segment shows the exact customer list behind it before anything is sent.",
    "Two further tabs explain the customer base: Segments splits customers by discount behaviour and shows what each group costs in margin, and the Repeat Clock measures how long customers actually take between their first and second orders — so a win-back lands before they would have rebought, not after.",
  ],
  whyItMatters: [
    {
      title: "Revenue sitting in a list",
      body: "The headline is the lifetime value of customers currently drifting. Winning back a fraction of it is the cheapest revenue in the business.",
    },
    {
      title: "Ranked by each customer's own rhythm",
      body: "'Quiet' is measured against the customer's personal gap between orders, not a one-size-fits-all number of days — so a monthly buyer silent for 60 days ranks above a yearly buyer silent for 90.",
    },
    {
      title: "Vetted before it is sent",
      body: "The win-back list is reviewed customer by customer, then synced to Klaviyo with one click — a manager sees exactly who is on it.",
    },
    {
      title: "Discounts explained by who takes them",
      body: "Segments shows the customers who have never taken a discount against those who only buy with one, and what each group's discount actually cost.",
    },
  ],
  howItWorks: [
    "For every customer the engine computes lifetime value, order count, average gap between orders and days since the last order from the synced orders.",
    "Drifting VIPs are the top 20% by lifetime value with three or more orders who are silent for at least twice their own usual gap (minimum 30 days); Due to reorder applies the same rhythm test to every customer.",
    "Category lovers are customers concentrated in one category and gone quiet; Sale-only shoppers are those who have only ever bought on discount.",
    "Segments classifies customers by whether their orders were discounted at all — automatic, code or manual — and sums each group's revenue and discount; the Repeat Clock takes the median (not the mean) of first-to-second-order gaps with p25/p75.",
    "Review & sync sends the reviewed VIP list to a Klaviyo list to trigger the win-back flow there; the sync date is recorded so those customers' subsequent orders can be attributed on Results.",
  ],
  sections: [
    {
      title: "Money Finder",
      route: "/customers",
      summary:
        "The headline tiles (customers flagged, combined lifetime value, segments with signal), the three segment cards, and the searchable Due-to-reorder table with export.",
      details: [
        "Drifting VIPs → Review & sync to Klaviyo (Review list, with Connect Klaviyo to sync under it, while Klaviyo is not connected); Category lovers and Sale-only shoppers → Export CSV.",
        "Search the reorder table by name or email; each row shows spend, orders and days silent.",
      ],
      screen: "customers",
    },
    {
      title: "Winback review",
      route: "/customers/winback",
      summary: "The VIP win-back list, customer by customer — lifetime value, orders, usual gap, days silent — with the one-click sync to Klaviyo.",
      details: [
        "Reached from the Morning Brief's win-back decision or from the Money Finder card.",
        "The sync date is recorded; Results → Winback later attributes the revenue these customers bring back.",
      ],
      screen: "customers-winback",
    },
    {
      title: "Segments",
      route: "/customers/segments",
      summary:
        "Customers grouped by discount behaviour — never discounted, mostly full price, mixed, discount-only — with each group's size, revenue and discount taken.",
      details: [
        "A group whose discount exceeds its revenue is surfaced on the card itself.",
        "'Discounted' means the order carried any discount, not only a code — automatic and manual discounts count.",
      ],
      screen: "customers-segments",
    },
    {
      title: "Repeat Clock",
      route: "/customers/repeat-clock",
      summary:
        "The distribution of first-to-second-order gaps: median, p25, p75, the share returning within a week, and the buckets — so win-back timing lands before customers rebuy.",
      details: ["Median deliberately, because the distribution is heavily right-skewed."],
      screen: "customers-repeat-clock",
    },
    {
      title: "Health",
      route: "/customers/health",
      summary:
        "The top spenders of the last 12 months, each with every platform's view on one line — Shopify orders and refunds, Loop returns, Gorgias tickets, days since the last order against their usual gap — and a verdict: Open problem, Going quiet, Draining or Healthy, with the sentence behind it.",
      details: [
        "Open problem means a ticket or a return is open right now; Going quiet is the winback list's own rule (silent longer than twice their usual gap, 30-day floor; 180 days for customers with fewer than three orders); Draining means they sent back 40% or more of what they bought across two or more refunds — the customer to stop chasing.",
        "Rows are ordered so today's action is first: open problems, then going quiet, then draining, then healthy — biggest spender first within each.",
        "A store with less than a year of orders reads its own window: the tiles and the line under them say \"since\" the first order rather than \"12 months\", and the money in each row's sentence is said the same way. In a new (guided) workspace the Returns and Tickets columns appear once Loop or Gorgias is connected, and the line names only the apps that are.",
        "Refunds come from Shopify, which sees in-store returns too; Loop returns and Gorgias tickets are matched on the customer's email, and the line under the tiles says what share of tickets carry one. A customer without an email shows no returns or tickets rather than a false zero.",
        "Each tile carries ✦ Explain this; Ask Glisp answers 'which big customers are leaving' and 'who should I stop discounting' from the same table.",
      ],
    },
  ],
  howToUse: [
    "Open Customers. Read the headline value and the Drifting VIPs count.",
    "Click Review & sync to Klaviyo, check the list, and sync it — Klaviyo's win-back flow takes it from there.",
    "Export Category lovers or Sale-only shoppers as CSV for a targeted campaign.",
    "Use the Due-to-reorder table to find individual customers overdue on their own rhythm.",
    "Open Segments to see what the discount-only group is costing; open Repeat Clock to time a nudge before the median gap.",
    "Open Health before a VIP outreach: save the open-problem and going-quiet rows, and take the draining rows off the discount list.",
    "Check Results → Winback in a few weeks for the revenue attributed to the synced list.",
  ],
  benefits: [
    "A dollar-ranked list of customers likely to buy again if nudged now.",
    "A manager-vetted win-back list that reaches Klaviyo in one click.",
    "The discount cost of each customer group, stated plainly.",
    "Win-back timing grounded in how customers actually rebuy.",
  ],
  goodToKnow: [
    "The Klaviyo sync is a deliberate, approved outbound action — it writes a list to Klaviyo and nothing else; the flow itself runs in Klaviyo.",
    "The sync needs a Klaviyo key that can write profiles and lists — the same key, and the same check, the Email Marketing Manager uses. With a read-only key the list can still be reviewed, and the sync button is greyed out with the reason; nothing is marked as synced.",
    "Segments and Repeat Clock have no push-to-Klaviyo action by design; a new outbound integration needs its own sign-off.",
    "Klaviyo credentials are set on the Integrations page; without them the win-back sync button explains what is missing.",
  ],
  related: ["brief", "results", "discounts", "integrations"],
});
