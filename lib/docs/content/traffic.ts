import { defineDoc } from "@/lib/docs/define";

export const trafficDoc = defineDoc({
  slug: "traffic",
  title: "Store Traffic",
  route: "/traffic",
  area: "customers",
  tagline: "In-store footfall from V-Count paired with sales — visitors, conversion, which store wins, lost sales in busy hours, peak hours, a cost-neutral staffing plan, and website friction from Microsoft Clarity.",
  sources: ["V-Count", "Shopify", "Microsoft Clarity"],
  refresh: "V-Count today-sync every 15 minutes; full sync nightly 02:00 UTC; Clarity nightly 04:15 UTC",
  updated: "2026-10-09",
  hero: "traffic",
  heroCaption:
    "Store Traffic overview for the week: visitors, transactions, conversion and value per visitor, visitors by store, walk-ins and walk-outs day by day.",
  whatItIs: [
    "Store Traffic shows the one thing Shopify cannot: how many people walked into each store, and how many of them bought. V-Count door counters supply footfall per store per hour; the platform pairs it with the same hours' POS sales to produce conversion rate, value per visitor and — where costs exist — profit per visitor.",
    "From there it answers the operational questions: which store converts best and which is leaving revenue on the table, which hours are busy but under-converting, how to move staff hours from quiet, well-converting hours to busy, under-served ones without adding payroll, and — from Microsoft Clarity — where the website loses people, priced by the revenue behind each page.",
  ],
  whyItMatters: [
    {
      title: "Traffic problem or conversion problem?",
      body: "A store with few visitors and a store with many visitors but few sales need completely different fixes. Conversion per store tells you which one you have.",
    },
    {
      title: "Lost sales, in dollars",
      body: "Busy hours that convert below the store's own average are priced as revenue left on the table — the case for staffing them.",
    },
    {
      title: "A rota change you can defend",
      body: "Staffing proposes hour-for-hour swaps: give from a quiet hour that already converts well, take into a busy hour that does not — cost-neutral, with the estimated gain.",
    },
    {
      title: "The website's friction, joined to money",
      body: "Clarity's dead clicks, rage clicks and quick-backs per page are ranked by the revenue those pages produce, so the fix list is ordered by what it costs.",
    },
  ],
  howItWorks: [
    "V-Count footfall syncs per store per hour, with a 15-minute today-sync so the page is near live; POS orders come from the Shopify sync and are matched to the store and hour.",
    "The engine computes visitors, transactions, conversion, value and profit per visitor per store, per day and per hour; the benchmark store sets the bar for the Store League.",
    "Lost-Sales finds the hours where footfall is high and conversion is below the store's average and prices the gap; Peak Hours renders the day-by-hour heatmap.",
    "Staffing pairs give-candidates (quiet and converting at or above average) with take-candidates (busy and below average) and estimates the gain on the take side only; confidence is low under four observed weeks and the plan says so.",
    "Clarity syncs one day of site behaviour nightly within its 10-calls-per-day budget; URLs are normalised on both sides so pages join to Shopify products and blog posts correctly.",
    "The Morning Brief's 'store converting below benchmark' card and the store-traffic nudge email come from the same figures; nudges can be automated in Settings.",
  ],
  sections: [
    {
      title: "Overview",
      route: "/traffic",
      summary: "Visitors, transactions, conversion, average order value and value per visitor for the range, with visitors by store and the daily walk-in / walk-out charts.",
      details: [
        "'Add product costs to unlock profit' appears where profit per visitor cannot be computed.",
        "A sensor under-counting (more sales than visitors) is flagged rather than hidden.",
      ],
      screen: "traffic",
    },
    {
      title: "Store League",
      route: "/traffic/stores",
      summary: "Stores ranked by conversion and value per visitor — best converter, most footfall, biggest gap — with a per-store drill-down.",
      details: ["A store's page shows its own daily visitors and conversion, hour by hour."],
      screen: "traffic-stores",
    },
    {
      title: "Lost-Sales",
      route: "/traffic/opportunity",
      summary: "The revenue left on the table in busy hours that convert below the store's average, per store, with the hours named.",
      details: [],
      screen: "traffic-opportunity",
    },
    {
      title: "Peak Hours",
      route: "/traffic/hours",
      summary: "A heatmap of visitors and conversion by day of week and hour — busiest hour, busiest day, quietest hour, best-converting hour — in store-local time.",
      details: ["Hours excluded from the average (outliers) are noted on the page."],
      screen: "traffic-hours",
    },
    {
      title: "Staffing",
      route: "/traffic/staffing",
      summary:
        "A cost-neutral rota proposal: hour-for-hour moves from quiet, well-converting hours into busy, under-converting ones, with the estimated gain and a confidence level.",
      details: [
        "Defaults to a 90-day window — a rota change is not defensible on less than four weeks of footfall.",
      ],
    },
    {
      title: "Website",
      route: "/traffic/website",
      summary: "Website friction from Microsoft Clarity — dead clicks, rage clicks, script errors, error clicks, quick-backs per product page — ranked by the revenue those pages drive.",
      details: [
        "The list has a search box (product or path), severity chips (Severe · Notable · Minor, by friction per 100 sessions) and pages of ten; the order stays revenue-first, because that is the order to fix things in.",
        "Every row opens: the chevron reveals each issue Clarity recorded on that page in the last 30 days, in words — '1 script error', '3 dead clicks', '702 quick-backs' — with what each usually means, and a Watch in Clarity link per issue. Quick-backs and excessive scrolling are shown but not counted as friction.",
        "Links land in your own Clarity project, filtered to that page (and to the issue where Clarity has such a filter). Clarity's export carries counts, not which script failed — the recordings show that. Without a Clarity project id on Integrations there are no links, never a link to the wrong place.",
        "Under the list, 'Where the traffic came from, and what it did': one row per channel with Clarity's sessions, scroll depth and quick-backs beside Shopify's orders and revenue from the same channel (Facebook and Instagram are one channel, Meta; Klaviyo and mail apps are Email; the merged names are listed under the channel; your own website is one row, marked Your own site), and a verdict — Converting · Converting, with friction · Good audience, broken page (they read and scroll, then leave: fix the landing page) · Wrong audience (most leave within seconds: fix the targeting) · No orders yet · Too few to judge (under 50 sessions). The rule is fixed and the reason is written under each chip.",
        "An unconnected Clarity shows an honest empty state that links to Integrations.",
      ],
      screen: "traffic-website",
    },
    {
      title: "One page's friction",
      route: "/traffic/website/[handle]",
      summary: "A product page on its own screen — breadcrumb, four tiles, every recorded issue with its Clarity link, the 30-day chart, the day-by-day rows and the storefront paths visitors used.",
      details: [
        "Open it from a row's title or 'Open this page's friction'. The tiles: sessions, friction events, friction per 100 sessions (with the severity), revenue over 90 days — each with ✦ Explain, and the analyst answers from the page's friction by day beside its orders per day (the get_website_friction tool), so 'why did this page convert worse' is one click.",
        "By day: bars for friction events against a line for sessions, then one row per captured day with its counts and scroll depth — so a bad day reads as bad, not as busy.",
        "Where visitors saw it: the canonical /products/ path and any collection-scoped path Clarity recorded, with sessions and events each.",
        "A page Clarity has not recorded in the window says so and links back to the list.",
      ],
    },
  ],
  howToUse: [
    "Open Store Traffic; the default range is 7 days. Read conversion per store on the Overview and Store League.",
    "Open Lost-Sales to see which store and hours leave the most revenue behind.",
    "Use Peak Hours to see the weekly rhythm, then Staffing for the concrete hour swaps.",
    "Open Website after connecting Clarity to find the pages costing the most revenue to friction.",
    "Send a store-traffic nudge from the Morning Brief when a store falls below the benchmark, or automate it in Settings.",
  ],
  benefits: [
    "A true in-store conversion rate, per store, per hour.",
    "The staffing case made in dollars, not impressions.",
    "Stores compared on the same footing, with the gap quantified.",
    "Website fixes ordered by revenue at stake.",
  ],
  goodToKnow: [
    "Requires V-Count credentials; the page explains when V-Count is connected but has no data for the window yet.",
    "Profit per visitor needs product costs; without them the page shows value per visitor and says why.",
    "Clarity returns aggregates, not series, and permits ten API calls a day; the sync spends three.",
    "Times are store-local throughout.",
  ],
  related: ["brief", "foresight", "dashboard", "integrations"],
});
