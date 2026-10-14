import { defineDoc } from "@/lib/docs/define";

export const discountsDoc = defineDoc({
  slug: "discounts",
  title: "Discounts",
  route: "/discounts",
  area: "operations",
  tagline: "Discount monitoring and loss prevention — who is discounting, where, how much, whether a policy flag applies, and which codes give margin to people who were buying anyway.",
  sources: ["Shopify"],
  refresh: "Orders every 15 minutes; discount codes nightly at 00:00 UTC",
  updated: "2026-10-09",
  hero: "discounts",
  heroCaption:
    "Discount Monitoring overview: gross sales, total discount and manual share, the automatic / code / manual split, per-location and per-employee tables, promotions and the alerts list.",
  whatItIs: [
    "Discounts is a loss-prevention page, not a marketing report. It reads every discount on every order — automatic promotions, discount codes and manually keyed register discounts — and lays out the path from company to location to employee to transaction to item, so ownership can see exactly where margin is being given away and by whom.",
    "Flags are policy-based, not proof: a discount over the percentage limit or several discounts stacked on one order is raised as 'needs attention', and a one-click email asks the location's manager to confirm the reason. Cannibalisation goes further and asks whether each code acquired anyone at all.",
  ],
  whyItMatters: [
    {
      title: "Visibility of manual discounting",
      body: "Manual register discounts are the ones nobody planned. The manual share, the staff leaderboard and the reasons breakdown show how much is being keyed by hand, by whom, and how much carries no reason at all.",
    },
    {
      title: "Outliers flagged automatically",
      body: "Employees whose discounting is far outside their peers', single discounts over the limit and stacked discounts are flagged without anyone building a report.",
    },
    {
      title: "Codes that only reward existing customers",
      body: "Cannibalisation shows, per code, how much discount went to customers who had already bought versus first-ever orders — the largest single margin lever the data can prove.",
    },
    {
      title: "A supervised loop, not just a chart",
      body: "Needs attention → email the manager → Results shows whether the location's discounting changed.",
    },
  ],
  howItWorks: [
    "Orders carry their discount codes and amounts from the sync; the staff member who keyed a POS discount is resolved from the Shopify order timeline; discount codes themselves sync nightly.",
    "The engine splits each period's discount into automatic, code and manual, aggregates by location and employee, and applies the policy rules (over-percentage limit, stacked) to flag transactions.",
    "Reasons come from the discount reason captured at the register; the breakdown states how much has no reason recorded rather than guessing one.",
    "Cannibalisation classifies each redeeming order by whether it was the customer's first ever, splits an order's discount across its codes, and labels each code by the finding — Not acquiring, Mostly existing, Mixed, Acquiring — leaving the judgement to the owner.",
    "'Email the manager' opens the compose panel for a flagged transaction; sends are logged and scored on Results → Discount Reviews.",
  ],
  sections: [
    {
      title: "Overview",
      route: "/discounts",
      summary:
        "Company-wide KPIs — gross sales, total discount, manual share, average discount — the automatic / code / manual split, promotions, per-location and per-employee tables, and alerts.",
      details: [
        "Filters by location and time; each location and employee opens its own drill-down.",
        "'All clear' is the stated clean state for alerts.",
      ],
      screen: "discounts",
    },
    {
      title: "Needs attention",
      route: "/discounts/attention",
      summary:
        "Flagged discounts ranked by urgency — over the percentage limit, stacked, unknown staff — each with why, where, and a one-click email to the location's manager.",
      details: ["Reached from the alerts list or directly; the send page reviews the draft first."],
      screen: "discounts-attention",
    },
    {
      title: "Staff",
      route: "/discounts/staff",
      summary:
        "Every employee ranked by the manual discounts they entered across all stores, with count, total, average and an outlier flag; unnamed staff can be named inline.",
      details: ["'No outliers — everyone's in a similar range' is the clean state."],
      screen: "discounts-staff",
    },
    {
      title: "Reasons",
      route: "/discounts/reasons",
      summary: "The manual-discount total broken down by recorded reason, and how much carries no reason at all.",
      details: [],
      screen: "discounts-reasons",
    },
    {
      title: "Cannibalisation",
      route: "/discounts/cannibalisation",
      summary:
        "Per code: total discount, the share that went to customers who had already bought, new customers acquired, and a finding label.",
      details: [
        "Operational credits staff apply by hand (damage, replacement, return credits) are existing-customer by nature and are labelled as findings, not told to be retired.",
        "A summary tile states the store-wide share of discount that went to existing customers.",
        "The table searches by code, filters by finding with a count on each chip, and shows 15 codes a page, in place.",
      ],
      screen: "discounts-cannibalisation",
    },
    {
      title: "Decisions",
      route: "/discounts/decisions",
      summary:
        "One row per code that ran in the range: what it gave and to whom, then what the whole store did per day while it ran versus the same number of days just before — orders, revenue, cost-known margin — and a verdict with the sentence that names the number behind it.",
      details: [
        "Verdicts: Worked (revenue per day up 5% or more without a margin drop), Cost margin (revenue up but margin down 3 points or more, judged only where at least half of sales carry a cost), No lift, Too small to judge (under 10 orders).",
        "Ran is the code's own start and end date in Shopify, so a campaign is judged over the days it ran, not only the days it sold. A hand-typed POS title (a manual 'custom discount') has no Shopify record, so its first and last use stand in.",
        "A code with no end date in Shopify, or in use for most of the range, is Always on — a standing credit such as a damage or replacement discount, not a campaign. It gets no before/after comparison, because there is no before; its cost stays on Cannibalisation.",
        "Store figures are movement, not attribution: the row says what the store did while the code ran, never that the code caused it. When no code in the range was a campaign, the three comparison columns are not shown at all — one line above the table says how many codes are standing credits and how many were too small — and they return the first time a code with a start and end date runs.",
        "Rows are ordered so the expensive mistakes come first: cost margin, no lift, worked, always on, too small — biggest discount first within each.",
        "Ask Glisp knows the same table: ask 'last time I ran 20%' or 'should I run this code again'.",
      ],
    },
    {
      title: "Drill-downs",
      route: "/discounts/locations/[locationId]",
      summary: "Location → employee → transaction → item pages, each with the same filters, ending in the order's items and the discount applied to each.",
      details: ["The transaction page links to the order in Orders."],
    },
  ],
  howToUse: [
    "Open Discounts and read the manual share — it is the number to watch. Filter by location if one store is the concern.",
    "Open Needs attention; for each flagged transaction, read the why and either dismiss or email the location's manager to confirm the reason.",
    "Before repeating a campaign code, open Decisions at 90 days and read its row: what the store did per day while it ran, what it cost in margin, and how much went to customers who were coming anyway.",
    "Use Staff to see who is discounting most; name any unnamed register user so the leaderboard is readable.",
    "Use Reasons to see how much manual discount has no reason recorded and tighten the register process if needed.",
    "Open Cannibalisation before renewing a code: if it is 'Not acquiring', it is paying existing customers to do what they already do.",
    "Check Results → Discount Reviews to see whether emailed locations changed.",
  ],
  benefits: [
    "Ownership-level visibility of exactly where margin is given away and by whom.",
    "Automatic outlier and policy flags, with honest labels.",
    "A memory of every campaign — before, during, verdict — so the next discount decision starts from evidence, not a guess.",
    "Codes judged by acquisition, not by redemptions.",
    "A logged, measured escalation for each flagged case.",
  ],
  goodToKnow: [
    "Flags are policy-based signals, not evidence of wrongdoing; the page says so wherever a flag appears.",
    "Staff identity comes from the Shopify order timeline; a register user with no name shows as 'Unnamed staff' until named here.",
    "Checkout behaviour is not synced, so cannibalisation measures prior purchase, never 'added to cart at full price then applied a code'.",
    "The discount-code sync is large and runs nightly; the overview's order-level figures are current to the 15-minute sync.",
  ],
  related: ["orders", "customers", "results", "products"],
});
