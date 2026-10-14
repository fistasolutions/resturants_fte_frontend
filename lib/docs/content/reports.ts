import { defineDoc } from "@/lib/docs/define";

export const reportsDoc = defineDoc({
  slug: "reports",
  title: "Daily Reports",
  route: "/reports",
  area: "command",
  tagline: "The written executive report — daily, weekly or monthly, store-wide or scoped to one brand or location — with every past report kept.",
  sources: ["Shopify"],
  refresh: "Generated every morning at the time set in Settings; on demand any time",
  updated: "2026-10-06",
  hero: "reports",
  heroCaption:
    "A daily report: verdict and AI summary first, then financials, operations, same-store sales, sales by channel, top styles, unfulfilled orders and aged dead stock by location, risks, opportunities and next actions.",
  whatItIs: [
    "Daily Reports is the report an owner can forward without editing. Every morning the platform computes the day's figures and the AI writes an executive briefing around them: a verdict, a summary in complete sentences, the financial and operational tables, and a short list of risks, opportunities and recommended actions.",
    "It can be scoped. The same report exists for any brand (vendor) or any store location, and as a weekly or monthly period instead of a day. Every report ever generated is stored and searchable.",
  ],
  whyItMatters: [
    {
      title: "Verdict before tables",
      body: "'Strong day', 'Watch closely' or 'Flat' is the first thing on the page, followed by the AI's summary — the reader gets the judgement, then the evidence.",
    },
    {
      title: "Real margin, honestly labelled",
      body: "Gross revenue, net revenue and product margin are shown with the share of sales the margin figure actually covers, so a partial cost base can never masquerade as a complete one.",
    },
    {
      title: "One report per brand or store",
      body: "A brand manager or a store manager gets their own full breakdown — same structure, their numbers — instead of reading around the company total.",
    },
    {
      title: "A permanent record",
      body: "Reports are stored, not regenerated: what the report said on a given morning is what it still says, which is what an audit trail needs.",
    },
  ],
  howItWorks: [
    "At the scheduled time (Settings → Daily report, in the store's timezone) the scheduler asks the analytics engine for the period's metrics: sales, orders, AOV, refunds, margin, same-store sales, channel split, top styles, unfulfilled orders and aged dead stock per location.",
    "The report-writer agent receives those computed figures and writes the summary, risks, opportunities and actions. It is handed numbers; it does not produce them.",
    "The result is saved as a report row with its scope and period, and rendered on the page as structured sections.",
    "Scoped reports (brand or location) run the same pipeline with a filter; weekly and monthly periods aggregate the same way.",
    "Export PDF asks the backend to render the stored report as a real PDF; Generate report produces a fresh one for the selected scope and period on demand.",
  ],
  sections: [
    {
      title: "Today's report",
      route: "/reports",
      summary:
        "The latest report for the selected scope and period, laid out compactly: the summary, one strip of six figures, then the tables and lists as panels, then risks, opportunities and actions side by side.",
      details: [
        "The strip: gross revenue, net revenue, product margin (on the share of revenue with a known cost — 'Pending' until costs are filled in Shopify), orders, AOV and refunds; revenue, orders and AOV carry their change against the prior day, 7 days or 30 days. Every tile has ✦ Explain.",
        "Store performance and unfulfilled orders by location sit side by side; every unfulfilled count opens the matching orders in a new tab. Aged dead stock, top products and sales by channel are three panels in one row; top 10 styles and same-store sales the next.",
        "Risks, Opportunities and the recommended next actions — written by the AI from the figures above — are three panels in one row on a wide screen.",
        "The same layout serves the weekly and monthly rollups with their note at the top; a report generated before the structured layout keeps the older viewer with a regenerate notice.",
      ],
      screen: "reports",
    },
    {
      title: "Scope and period",
      route: "/reports",
      summary:
        "Brand and Location pickers narrow the report to one vendor or one store; the period toggle switches Daily, Weekly and Monthly.",
      details: [
        "Scope and period live in the URL, so a scoped report can be bookmarked or shared.",
        "A scoped report that has not been generated yet offers Generate report right there.",
        "Scheduled reports: under the toggle, the store-wide view lists the Report Builder's scheduled reports you chose to show here (the 'Also show it on the Daily Reports page' box when scheduling) — daily ones under Daily, weekly under Weekly, monthly under Monthly — newest first, with when each ran and who it was sent to. Each opens the full report. Nothing is listed until a schedule has run once.",
      ],
    },
    {
      title: "History",
      route: "/reports/history",
      summary:
        "Every stored report — daily briefings and brand/location views — searchable by brand or location name and filterable by period.",
      details: [
        "Open any past report exactly as it was written that morning.",
        "The history menu on the main page jumps to recent reports without leaving it.",
      ],
      screen: "reports-history",
    },
  ],
  howToUse: [
    "Open Daily Reports. The latest company-wide daily report is shown.",
    "Read the verdict and summary first; expand into the financial and operational sections as needed.",
    "To see one brand or one store, pick it in the Brand or Location selector. To change the horizon, switch to Weekly or Monthly.",
    "Click Generate report to produce a fresh report for the current scope and period right now.",
    "Click Export PDF to download the report as a PDF for forwarding.",
    "Use History to find and reopen any past report; search by brand or location name.",
    "Change the generation time under Settings → Daily report; it takes effect immediately.",
  ],
  benefits: [
    "A complete, forwardable briefing every morning with no one writing it.",
    "The same report for each brand and store, so managers see their own numbers.",
    "Judgement first — verdict and summary — with the tables as backing.",
    "A searchable archive of every report ever generated.",
  ],
  goodToKnow: [
    "Product margin covers only products with a cost recorded in Shopify; the report states the coverage percentage beside the figure.",
    "The daily report's generation time is per store and set in Settings → Daily report; the scheduler reschedules live when it changes.",
    "PDF export is a server-rendered PDF of the stored report; it is the one sanctioned PDF export in the product.",
    "AI runs for report writing are metered on the AI Performance page under 'Reports — daily executive'.",
  ],
  related: ["brief", "dashboard", "settings", "ai"],
});
