import { defineDoc } from "@/lib/docs/define";

export const productsDoc = defineDoc({
  slug: "products",
  title: "Product Analyst",
  route: "/products",
  area: "merchandising",
  tagline: "Winners, losers and money leaks — which products and brands make money, which quietly lose it, and what to fix, buy or bundle next.",
  sources: ["Shopify", "Loop Returns"],
  refresh: "15-minute sync; AI commentary cached and re-warmed on the schedule",
  updated: "2026-10-09",
  hero: "products",
  heroCaption:
    "Product Analyst overview for a date range: verdict tiles (best seller, highest margin, highest return rate, no recent sales), revenue by category, and the AI's reading of the period.",
  whatItIs: [
    "Product Analyst is the merchandising page. For any date range it ranks the catalog by what matters — revenue, real margin after cost, return rate, silence — and turns the result into verdicts: this is the best seller, this is the highest-margin line, this one is bleeding to returns, these have not sold in sixty days.",
    "Eight tabs go deeper: the Catalog with a status on every product, the Return Leak list, Fit — which way each style runs and the size guide its returns earn — True Profit per SKU after every deduction, Content Gaps in listings, margin-ranked Bundles, Brands with a buy more / buy less / stop verdict, and Costs — where the landed cost behind every margin is entered and reconciled. Facts and estimates are kept visibly apart, and any product without cost data says so rather than being treated as free.",
  ],
  whyItMatters: [
    {
      title: "Profit, not revenue, decides",
      body: "A best-seller that only sells at 40% off is a subsidy. True Profit ranks every SKU after cost of goods, allocated discounts and returns — losses first — so buying and markdown decisions are made against what a product actually earns.",
    },
    {
      title: "Returns are a money leak, named",
      body: "The Return Leak list prices the products losing the most to returns and gives each a short, specific next step written from its return reasons.",
    },
    {
      title: "Bundles that add margin, not just basket size",
      body: "Pairs are ranked by the margin they earn together, not by how often they co-occur — the most common pair is rarely the most profitable one.",
    },
    {
      title: "Listings fixed where the money is",
      body: "Content Gaps ranks selling products by the revenue behind a thin gallery, so the hour spent shooting or writing goes where it pays.",
    },
  ],
  howItWorks: [
    "The analytics engine computes revenue, units, margin and return rate per product for the range in set-based SQL over the synced orders, refunds, variants (with their cost) and Loop return reasons.",
    "Order-level discounts are allocated to each line pro-rata by value, so per-product, per-category and per-location margin reconcile exactly to the store-wide net figure.",
    "Verdict tiles and the money-leak list are computed rankings; the AI writes the commentary and each product's suggested next step from those figures, cached per range so the page stays fast.",
    "True Profit merges order lines and refund lines (by refund date, the same basis as the store-wide returns figure); products without variant cost are labelled 'No cost data' and never 'Healthy'.",
    "Bundles measure attach rate against the rarer product of the pair; Content Gaps counts synced images per product and excludes gift cards and never-sold products on purpose.",
  ],
  sections: [
    {
      title: "Overview",
      route: "/products",
      summary:
        "Verdict tiles for the range — best seller, highest margin, highest return rate, no sales in 60+ days — with revenue by category and the AI's commentary.",
      details: [
        "Tiles link to the product detail page.",
        "Commentary streams in separately so the fast figures never wait on it.",
      ],
      screen: "products",
    },
    {
      title: "Catalog",
      route: "/products/catalog",
      summary:
        "The whole catalog as a table or card grid with a status badge on every product — best seller, slow mover, dead stock — and summary tiles.",
      details: [
        "Paginated; searchable; each row opens the product detail with images, variants, units sold, revenue, stock and units per location.",
      ],
      screen: "products-catalog",
    },
    {
      title: "Return Leak",
      route: "/products/returns",
      summary:
        "Products ranked by the money lost to returns, each with an AI-written next step derived from the dominant return reason.",
      details: [
        "Links to the Returns Intelligence hub for the by-style and sizing view.",
      ],
      screen: "products-returns",
    },
    {
      title: "Fit",
      route: "/products/fit",
      summary:
        "Which way each style fits — runs small, runs large, true to size, or varies by size — read from the reasons customers gave for returns and the sizes they exchanged to, with a size guide per style.",
      details: [
        "Reads the whole Loop return history (up to a year), not the date range, so the picker is not shown on this tab. The line under the tiles says how many returns it rests on and since when.",
        "Tiles: the share of returns that are about fit, the money refunded on them, and how many styles run small, run large or vary by size.",
        "A style gets a verdict only after at least 5 fit returns: runs small when 65% or more of them said too small, runs large at 35% or less, 'fit varies' when the returns split both ways and the style comes back for fit at 1.5 times the store's rate or more, true to size otherwise. Confidence rises at 10 and 20 fit returns and drops a step when the exchanges point the other way.",
        "Vendors pools each label's styles (spellings like 'Hailey' and 'HAILEY' count as one); clicking a vendor narrows the styles below to it.",
        "The styles table has verdict chips with counts, a search, sortable columns and 25 styles a page; the view is in the address, so back and forward work and a filtered list can be shared as a link.",
        "A style opens on its own page with the breadcrumb: the size guide — a headline, the evidence behind it, and per-size advice such as 'XS → Order S' only where that size has at least 4 fit returns of its own and a clear direction — the per-size table, which way exchanges moved, and the vendor's profile.",
        "Copy guide puts the guide on the clipboard as plain text for the product page. Nothing is written to Shopify.",
        "Glisp and the Report Builder read the same verdicts, so 'which styles run small?' is answered from these figures.",
      ],
    },
    {
      title: "True Profit",
      route: "/products/true-profit",
      summary:
        "Per product: gross revenue − allocated discount − cost of goods − refunds = true profit, sorted losses-first.",
      details: [
        "Headline tiles count the loss-makers and the money they cost, and the products with no cost data.",
        "Returns come from refund lines by refund date so the column sums toward the store total.",
        "A product missing cost is reported as such — its 'profit' would just be revenue under another name.",
        "The table searches by product or category, filters by verdict with a count on each chip, and shows 15 products a page; paging and filtering happen in place — the tiles above never reload.",
      ],
      screen: "products-true-profit",
    },
    {
      title: "Content Gaps",
      route: "/products/content-gaps",
      summary:
        "Selling products ranked by the revenue behind a thin or empty image gallery — the work list for the next photo shoot.",
      details: [
        "Products with no image and no sales are excluded as catalog hygiene; gift cards are excluded because they sell on one image by design.",
        "No conversion rate is shown: session data is not synced and an invented one would mislead.",
        "The table searches by product or category, filters by gap (No image, Single image, Thin gallery) and shows 15 products a page, in place.",
      ],
      screen: "products-content-gaps",
    },
    {
      title: "Bundles",
      route: "/products/bundles",
      summary:
        "Product pairs ranked by combined margin, with attach rate and the margin the pair already earned — the sets worth merchandising.",
      details: [
        "Two tiles contrast the top pair by margin with the top pair by frequency, because the gap is the argument for the page.",
        "Pairs missing cost on either side are excluded and counted.",
      ],
      screen: "products-bundles",
    },
    {
      title: "Brands",
      route: "/products/brands",
      summary:
        "One row per brand with a verdict — Stop buying, Buy less, Buy more, Hold — and the sentence that names the number behind it: sales, returns across every channel, sell-through, dead stock, and margin after cost.",
      details: [
        "Six tiles: brands counted, then how many fall under each verdict. A zero under Stop buying is shown as a zero.",
        "Returns are Shopify refunds from every channel, the counter included — not only online returns — so a brand's return rate is the whole picture. Reasons stay on Return Leak.",
        "Sell-through is units sold ÷ (units sold + on hand) for the range; dead stock is the brand's products with stock and no sale in the range.",
        "Margin is shown with how much of the brand's sales carry a cost ('65% (95% costed)'); a brand with no cost data says so. Margin only decides a verdict when at least half of the brand's sales are costed.",
        "Verdict rules: Stop when a quarter or more of units come back, or the brand loses money after cost; Buy less when sell-through is 45% or under, or returns are 15% or more; Buy more when sell-through is 80% or more with low returns; Hold otherwise. Brands under 20 units in the range are listed as Too few sales rather than judged.",
        "The same brand spelled two ways in the catalogue (Hailey / HAILEY) is one row.",
        "The tab follows the page's date range like every other; set 90 days for a buying-season view.",
      ],
    },
    {
      title: "Costs",
      route: "/products/costs",
      summary:
        "Where the owner tells the platform what a product really cost by the time it reached the shelf — freight, duty, brokerage, insurance, handling and shrinkage on top of the supplier's price — and checks that what was recorded reconciles to the invoices.",
      details: [
        "Four tiles: cost coverage (the share of the period's sales on lines with any known cost — landed or Shopify's — flagged below the 50% floor every margin verdict already uses), landed coverage, variants costed out of variants selling, and shipments received in the period.",
        "Record a shipment: the invoice header (reference, supplier, received date, invoice currency and the rate to the store's currency, allocation method, and the freight, duty, brokerage, insurance and handling totals) plus a CSV of the lines — sku, quantity, unit_cost, optional weight; a template is one click. Preview shows every line's allocated components and landed unit cost, and which came from an assumption, before anything is recorded.",
        "Allocation is to the cent: each invoice total is converted once and split across the lines by value, units or weight so the lines always sum back to the invoice. A row the file cannot match to a variant refuses the whole file and names the row — nothing is half-recorded.",
        "Duty and handling left blank on the invoice fall back to the Assumptions — shrinkage %, handling per unit, default duty % and duty % by product type — and every such line says so. Assumptions apply to what is recorded from then on, never to a lot already recorded.",
        "Enter one variant by hand for a cost that never came on a shipment: search by SKU or product, then the per-unit components in the purchase currency.",
        "Every order line carries the landed cost in force on its sale date. A cost recorded today applies from its effective date forward; earlier sales keep the cost they had, so a past margin never moves because of a new entry. True Profit, Brands, Discount Decisions and Profit Lens read this cost first and fall back to Shopify's unit cost where none is recorded.",
        "Reconciliation shows, for shipments received in the period, the landed cost recorded against the invoices entered; the variance is named — by construction it is the part that came from assumptions. Manual entries carry no invoice and are counted separately.",
        "Shipments lists the latest ones; deleting one removes its rows and re-costs the affected order lines. Re-resolve all lines is a repair action that recomputes every line on the store — about a minute on a large store.",
      ],
      screen: "products-costs",
    },
  ],
  howToUse: [
    "Open Product Analyst and set the date range (top right). Start with the verdict tiles and the AI commentary.",
    "Go to True Profit to see the loss-makers first; decide whether each needs a price change, a discount rule change or a stop on reordering.",
    "Open Return Leak for the products losing most to returns and read the suggested fix; follow the link to Returns for the sizing breakdown.",
    "Use Content Gaps to plan a shoot: the top rows are the products where an image earns the most.",
    "Use Bundles to pick sets: look at attach rate and margin per bundle before merchandising.",
    "Before a buying trip, open Brands at 90 days: the Stop and Buy less rows are the conversation with each supplier, and the Why column is the number to quote.",
    "When a shipment lands, open Costs, set the assumptions once, then record the shipment from its invoices and the packing list CSV — preview first, then record. From then on every margin on this page is the real one for those lines.",
    "Use the Catalog to search any product and open its detail — variants, per-location units, gallery.",
  ],
  benefits: [
    "A ranked list of what makes money, what loses it and what is dead weight — instead of scrolling a product list and guessing.",
    "Real margins from real landed costs — not Shopify's supplier price alone — with missing cost visibly flagged.",
    "A buy more / buy less / stop list per brand, with returns counted at the counter as well as online.",
    "Specific next steps per product, written from the data.",
    "Merchandising and photography effort directed by revenue at stake.",
  ],
  goodToKnow: [
    "Margin reads the landed cost recorded on the Costs tab first — the supplier's price plus freight, duty, brokerage, insurance, handling and shrinkage, in force on the sale's date — and falls back to the unit cost recorded in Shopify where none is; the cost-coverage percentage is stated wherever margin is shown.",
    "Return reasons exist only for returns processed through Loop; the Return Leak tab states its coverage.",
    "Bundles show margin that already moved; no incremental-lift projection is made because the data cannot support the counterfactual.",
    "AI commentary is cached per range and warmed by the scheduler; it is metered on AI Performance under 'Pages — AI commentary'.",
  ],
  related: ["inventory", "returns", "foresight", "discounts"],
});
