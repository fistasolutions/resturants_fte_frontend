import { defineDoc } from "@/lib/docs/define";

export const foresightDoc = defineDoc({
  slug: "foresight",
  title: "Foresight",
  route: "/foresight",
  area: "merchandising",
  tagline: "The forward-looking view — true profit after every deduction, the season that is coming, pace to goal, size intelligence, stockout predictions and new-drop winners.",
  sources: ["Shopify", "Loop Returns", "V-Count", "Gorgias"],
  refresh: "Season forecast 06:30 UTC, stockout prediction 06:45 UTC, both scored against reality daily",
  updated: "2026-09-17",
  hero: "foresight",
  heroCaption:
    "Foresight → Profit Lens: gross sales, net profit, net margin and the amount lost to leaks, the profit-bridge waterfall, the AI's read of the biggest leak, and margin by product.",
  whatItIs: [
    "Foresight is where the platform looks ahead instead of back. Profit Lens shows what the business actually kept after cost of goods, discounts and returns; Season Radar forecasts the next occasion's demand lift and tells you the order-by date; Forecast & Pace projects month-end per store against its goal; Size Intelligence reads sell-through and returns by size; Stockout Risk predicts which variants run out where and when; Launch Watch spots the new drops selling at winner pace before the reorder window closes.",
    "The predictive tabs are honest by construction: every forecast is computed deterministically, reviewed by an adversarial critic agent that can reject a pointless call, and scored against what actually happened afterwards — the hit rate is on the page.",
  ],
  whyItMatters: [
    {
      title: "Profit after everything",
      body: "The profit bridge — gross → cost of goods → discounts → returns → net — puts a number on each leak and names the biggest one, with cost coverage stated beside the margin.",
    },
    {
      title: "Seasonality that follows the real calendar",
      body: "The store's biggest demand swings follow occasions whose dates move every year. Season Radar measures each occasion's lift over five years, forecasts the ramp, and says whether the order-by date has already passed.",
    },
    {
      title: "Stockouts predicted with a date, then scored",
      body: "Each at-risk variant carries a predicted run-out date, the revenue at risk, and the critic's objection where there is one; the ledger shows how past predictions fared.",
    },
    {
      title: "Winners caught inside the reorder lead time",
      body: "Launch Watch benchmarks each new drop at day 7, 14 or 30 against the pace of past winners, and flags the ones outselling that pace with under six weeks of stock — reorder now, not at day 60.",
    },
  ],
  howItWorks: [
    "Profit Lens aggregates the period's gross sales, allocated discounts, cost of goods and refunds into a bridge and a per-product margin table; the AI writes the leak callout from those figures.",
    "Season Radar's forecast job measures each occasion's historical lift by weeks-out, projects the coming ramp and per-store daily revenue, and derives the order-by date from the ramp start and the reorder lead time; a scoring job compares forecast to actual after the occasion.",
    "Forecast & Pace projects month-end revenue per store from the month's pace so far against per-location goals you set inline; company goal is the sum of the location goals.",
    "Size Intelligence scans every variant for units sold, units returned, on-hand and sell-through (sold ÷ sold + on-hand), folded by size, with a buy signal per size.",
    "Stockout Risk computes days of cover per variant and location, then a stockout analyst triages the rows and a critic argues against each call; neither agent can emit a number, and only confirmed calls enter the ledger that is scored daily.",
    "Launch Watch defines launch as the first sale (not the creation date), scores each drop at the largest milestone it has lived through, and benchmarks it against the median of the top quartile of past launches.",
  ],
  sections: [
    {
      title: "Profit Lens",
      route: "/foresight",
      summary:
        "Four headline tiles with deltas versus the prior window, the profit-bridge waterfall, an AI read of the biggest margin leak, and a paginated margin-by-product table with verdict pills.",
      details: ["Cost coverage is shown as the trust caveat on net margin and net profit."],
      screen: "foresight",
    },
    {
      title: "Season Radar",
      route: "/foresight/season",
      summary:
        "The next occasion: its lift, five-year range and confidence; the order-by state; the ramp curve; expected daily revenue per store; and the 26-week timeline of every occasion.",
      details: [
        "A passed order-by date is a loud warning — the merchant can still act on a ramp under way.",
        "Suppressed occasions (lift below 1×) are shown as such, because knowing demand drops prevents overstocking.",
      ],
      screen: "foresight-season",
    },
    {
      title: "Forecast & Pace",
      route: "/foresight/forecast",
      summary:
        "Month goal, projected finish and the daily catch-up needed, then a pace-by-store card with progress tracks, goal markers, ahead/behind status and an inline goal editor per location.",
      details: ["The Morning Brief's 'pace to goal' tile links here."],
      screen: "foresight-forecast",
    },
    {
      title: "Size Intelligence",
      route: "/foresight/sizes",
      summary:
        "Per size: sell-through and return rate as paired bars, units sold, on hand, average price and a buy signal — stock deeper, watch, or buy cautiously — with KPI tiles for return value and markdown risk.",
      details: ["'Selling out — restock' names sizes rather than inventing a lost-sales dollar figure."],
      screen: "foresight-sizes",
    },
    {
      title: "Stockout Risk",
      route: "/foresight/stockout",
      summary:
        "A risk donut and revenue at risk, the prediction hit rate, an at-risk table per variant and location with cover bars and predicted run-out dates, and the ledger of past calls.",
      details: [
        "'Warnings acted on' (reordered because of the warning) is reported beside the hit rate, never inside it.",
        "Each row carries the analyst's driver and the critic's objection where the agents spoke.",
      ],
      screen: "foresight-stockout",
    },
    {
      title: "Launch Watch",
      route: "/foresight/launch",
      summary:
        "Every product first sold in the last month, scored at day 7/14/30 against winner pace, with a 'Reorder now' tile for winners with under six weeks of stock.",
      details: [
        "Nothing forecasts where a drop will finish — only whether it is ahead or behind at the milestone it has reached.",
        "The table searches by style or category, filters by verdict and shows 15 styles a page, in place.",
      ],
      screen: "foresight-launch",
    },
  ],
  howToUse: [
    "Open Foresight. Profit Lens is first: read the bridge and the leak callout, then sort the product table by margin.",
    "Check Season Radar weekly. If the next occasion's order-by date is near or passed, act on the per-store expected revenue.",
    "Set a goal per location in Forecast & Pace; watch the projected finish and the catch-up per day.",
    "Before a buy, read Size Intelligence's buy signals alongside the Inventory Buy Plan.",
    "Review Stockout Risk's at-risk table and reorder the critical rows; check the ledger to see how reliable the predictions have been.",
    "Open Launch Watch after each drop; reorder the 'ahead of winners' styles before their stock runs out.",
  ],
  benefits: [
    "Decisions made on net profit, not gross revenue.",
    "The season ordered in time, store by store.",
    "Stockouts and winners caught while there is still time to reorder.",
    "Predictions that show their own track record.",
  ],
  goodToKnow: [
    "All Foresight figures are computed by the backend; the two agents on Stockout Risk decide only whether a computed row is worth flagging and cannot introduce numbers.",
    "Season and stockout forecasts run in the early morning UTC and appear on the System page as jobs with their own run history.",
    "Margin-based tabs depend on variant cost coverage; the coverage percentage is stated wherever it matters.",
  ],
  related: ["products", "inventory", "brief", "traffic"],
});
