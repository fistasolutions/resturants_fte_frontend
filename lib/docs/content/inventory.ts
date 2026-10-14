import { defineDoc } from "@/lib/docs/define";

export const inventoryDoc = defineDoc({
  slug: "inventory",
  title: "Inventory Analyst",
  route: "/inventory",
  area: "merchandising",
  tagline: "What to reorder, what to move, what is stuck and what is bleeding cash — every list ranked by money, with the send-to-manager workflow built in.",
  sources: ["Shopify"],
  refresh: "Inventory levels update in real time via webhook; sales pace from the 15-minute sync",
  updated: "2026-10-09",
  hero: "inventory",
  heroCaption:
    "Inventory Analyst overview: snapshot and verdict tiles, stock value by location, 'selling but out of stock', overstock, fast and slow movers, and the AI's reading.",
  whatItIs: [
    "Inventory Analyst answers the questions Shopify's stock report cannot: what runs out next and what that costs per week, what should move from the warehouse to the stores, what is sitting dead and how to release the cash, how to split the next buy across sizes, and whether the catalogue itself can be trusted.",
    "Ten tabs, one rule: everything is ranked by dollar impact and days of cover are projected from recent sales pace, never typed in. Transfer and dead-inventory decisions end in a Review & Send step to the right location manager.",
  ],
  whyItMatters: [
    {
      title: "The warehouse holds the stock; the stores run out",
      body: "Warehouse → Store and Allocation put a dollar figure on best-sellers sitting in storage or in the wrong store, and say exactly what to move where — grouped into runs a van actually does.",
    },
    {
      title: "Reorders sized by size",
      body: "The Buy Plan splits the suggested units across sizes using the category's real sell-through curve, so the money goes into the sizes that sell rather than the ones that get marked down.",
    },
    {
      title: "Dead stock becomes a dated cash schedule",
      body: "Cash Release turns aged inventory into a six-week plan with an expected recovery per week, and a Markdown Plan gives each style its depth.",
    },
    {
      title: "Numbers you can trust",
      body: "Data Trust finds test fixtures and catalogue errors that would otherwise inflate every stock figure, excludes them, and discloses exactly what was excluded and why.",
    },
  ],
  howItWorks: [
    "Stock levels arrive in real time from Shopify's inventory webhook, with a nightly reconciliation as a safety net; sales pace comes from the 15-minute order sync.",
    "For each variant and location the engine computes days of cover from recent velocity, then ranks reorder risk, overstock, fast and slow movers and dead stock by revenue at stake.",
    "Transfer plans pair a location that is stocked out of a seller with one holding units; Allocation groups the moves into source → destination runs by value.",
    "Buy Plan applies the category size curve to each style's suggested units, narrowed to the sizes that style actually carries, with largest-remainder rounding so per-size figures sum exactly to the total.",
    "Review & Send drafts the per-location email with the detail attached; sends are logged and scored on Results.",
    "The AI reads the computed overview and writes the commentary; it never produces a figure of its own.",
  ],
  sections: [
    {
      title: "Overview",
      route: "/inventory",
      summary:
        "Snapshot and verdict tiles, stock value by location, and the four lists that matter this period: selling but out of stock, overstock, fast movers, slow movers.",
      details: ["AI commentary streams in below the fast figures."],
      screen: "inventory",
    },
    {
      title: "Reorder",
      route: "/inventory/reorder",
      summary:
        "Reorder alerts ranked by urgency — critical and out of stock first — with days of cover and the weekly revenue at risk, exportable as a supplier order sheet.",
      details: ["Filters by location; each row links to the product."],
      screen: "inventory-reorder",
    },
    {
      title: "Overstock & Movers",
      route: "/inventory/overstock-movers",
      summary: "Sellers holding more than 90 days of stock, and the fastest and slowest movers for the range.",
      details: ["Overstock rows carry the cash tied up and the cover in days."],
      screen: "inventory-overstock",
    },
    {
      title: "Warehouse → Store",
      route: "/inventory/transfers",
      summary:
        "The unified transfer plan: best-sellers at ≤2 units in a store while storage holds them, ranked by revenue ready to sell once moved, with Review & Send.",
      details: [
        "Review groups the plan by destination store and emails each manager their list, one location or all.",
        "Store-to-store moves for a specific location open from the location's own page.",
      ],
      screen: "inventory-transfers",
    },
    {
      title: "Dead Stock",
      route: "/inventory/dead-stock",
      summary:
        "Stock that is not selling anywhere, in severity buckets by age, ranked by cash frozen — with the Markdown Plan and Dead-inventory alerts one click away.",
      details: ["Fixed 7-day cross-location window; no date range."],
      screen: "inventory-dead-stock",
    },
    {
      title: "Markdown Plan",
      route: "/inventory/markdown-plan",
      summary: "An AI-drafted markdown plan per dead style — recommended depth and projected cash recovered — with a scrollable list beside a detail card.",
      details: ["Rendered instantly from a cached plan; regenerate on demand."],
      screen: "inventory-markdown",
    },
    {
      title: "By Location",
      route: "/inventory/by-location",
      summary: "Every location's stock value, cover and sell-through side by side, with the per-location dashboard for each store.",
      details: ["Opens the store-transfer detail for a chosen location."],
      screen: "inventory-by-location",
    },
    {
      title: "Buy Plan",
      route: "/inventory/buy-plan",
      summary:
        "The reorder as a buy sheet: units per size per style from the category size curve, against real sell-through and return rate, over a six-week horizon.",
      details: [
        "Sizes at ≥90% sell-through are flagged 'constrained' — they sold out, so their share understates demand — and shaded, never silently inflated.",
        "Category size curves are shown so the split can be checked.",
      ],
      screen: "inventory-buy-plan",
    },
    {
      title: "Cash Release",
      route: "/inventory/cash-release",
      summary:
        "Dead stock as a dated six-week schedule: which products to clear in which week, filled by value, with the expected cash per week and a coverage note.",
      details: [
        "Capped at the 400 largest holdings; the page states what share of dead-stock value that covers.",
        "Expected cash is a recovery estimate at the recommended depth, not a sell-through forecast.",
      ],
    },
    {
      title: "Allocation",
      route: "/inventory/allocation",
      summary:
        "Every store-to-store move worth making, grouped into source → destination runs ranked by expected value, with the units to move per item.",
      details: [
        "Based on the 7-day cross-location window: what is misallocated now, not what has failed everywhere for two seasons.",
        "A run already raised through the Morning Brief shows a 'Sent' chip.",
      ],
    },
    {
      title: "Data Trust",
      route: "/inventory/data-trust",
      summary:
        "Catalogue integrity: products that look like test fixtures and have never sold, what they were inflating, and what every stock figure looks like with them excluded.",
      details: [
        "Exclusion needs two signals — a fixture-like title and zero lifetime sales — so a real product is never removed.",
        "The platform is read-only toward Shopify; archiving the fixtures is the merchant's action.",
        "The checks table searches by check, explanation or what it affects and filters by status; it pages only past 15 checks.",
      ],
      screen: "inventory-data-trust",
    },
    {
      title: "Dead-inventory alerts",
      route: "/inventory/dead-inventory-alerts",
      summary: "Styles unsold at one store while selling at another — misplaced stock — with a per-product, per-location detail and a send-to-manager step.",
      details: ["Automatable from Settings → Automatic sending."],
      screen: "inventory-dead-alerts",
    },
  ],
  howToUse: [
    "Open Inventory Analyst; set the range. Read the verdict tiles and the 'selling but out of stock' list first — that is lost revenue today.",
    "Go to Reorder for what to order now; export the order sheet. Use Buy Plan for the per-size split before placing it.",
    "Go to Warehouse → Store, review the plan, then Review & Send to email each store its transfer list.",
    "Use Allocation for the week's store-to-store van runs.",
    "Open Dead Stock, then Cash Release for the six-week clearance schedule and Markdown Plan for the depth per style.",
    "Check Data Trust once — if fixtures are listed, archive them in Shopify so every figure stops being inflated.",
    "Turn on transfer and dead-inventory auto-sending in Settings once you trust the lists.",
  ],
  benefits: [
    "Money-ranked answers to reorder, move, clear and buy — not a stock count.",
    "Transfers and alerts go straight to the manager who can act, with the detail attached.",
    "A buy sheet that adds up and respects the sizes that actually sell.",
    "Stock figures that are honest about catalogue errors.",
  ],
  goodToKnow: [
    "Days of cover are projections from recent sales pace; a product with no recent sales has no cover figure rather than an infinite one.",
    "Dead Stock, Cash Release, Allocation and Data Trust have no date range — they describe the stockroom as it is now.",
    "Every send from this page is logged and later scored on Results under Transfers and Dead Inventory.",
  ],
  related: ["products", "foresight", "brief", "results", "warehouse"],
});
