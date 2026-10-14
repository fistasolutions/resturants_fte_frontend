import { defineDoc } from "@/lib/docs/define";

export const taxReportsDoc = defineDoc({
  slug: "tax-reports",
  title: "Sales & Tax",
  route: "/tax-reports",
  area: "operations",
  tagline: "The sales-tax report for accounting — generated per period, reconciled to the cent, exported to Excel in the accountant's own column layout, with a filing view by jurisdiction and a nexus watch by state.",
  sources: ["Shopify"],
  refresh: "Generated daily at 07:00 UTC for the current period; on demand for any period",
  updated: "2026-09-11",
  hero: "tax-reports",
  heroCaption:
    "Sales & Tax opens on the latest report: period totals, the RECONCILED / REVIEW REQUIRED status with its cause, the report rows by channel and location, and the Excel download.",
  whatItIs: [
    "Sales & Tax produces the report the accountant files from. For any period it computes total, taxable and non-taxable sales, the tax collected per jurisdiction component, and nets refunds — then reconciles the result against independent totals and says, in words, RECONCILED or REVIEW REQUIRED with the difference and where it is.",
    "The Excel workbook is the primary deliverable: the accountant's ten columns in their positions plus an Other Tax column so the columns sum to the total, a By Jurisdiction sheet that separates tax filed by the marketplace channel from tax to remit, and a Reconciliation sheet carrying the exact configuration that produced the figures. Nexus Watch tracks sales into each state against its economic-nexus threshold.",
  ],
  whyItMatters: [
    {
      title: "Open → confirm RECONCILED → send",
      body: "The page exists to answer 'can I send this?' in one glance. Status is a word, its cause is inline, and Download is the primary action.",
    },
    {
      title: "Refunds netted the way the return is filed",
      body: "Refunded tax nets onto the row that holds tax, matched on channel and location, spread pro-rata across jurisdiction components, on an order-date basis — the treatment measured to match the client's filed returns.",
    },
    {
      title: "Both halves of a filing in one workbook",
      body: "By channel and location for the accountant, by jurisdiction with the marketplace-facilitator split for the return — previously stitched by hand every month.",
    },
    {
      title: "Nexus crossings seen weeks ahead",
      body: "Sales into each state against its registration threshold, with a coverage banner that says how much of the data carries a destination so the floor is never mistaken for the total.",
    },
  ],
  howItWorks: [
    "The order sync captures every tax line per order and per refund — rate, title, amount, and whether the channel filed it — and resolves each order's sales channel and POS location.",
    "The report engine aggregates a period by channel and location: total, taxable and non-taxable sales, then each named tax component; refunds are netted onto the matching rows with tax spread pro-rata.",
    "Reconciliation compares the report's totals to independently computed period totals; a difference produces REVIEW REQUIRED with the expected, calculated and difference amounts and the area.",
    "The workbook is rendered with the ten client columns, Other Tax, period totals, the By Jurisdiction sheet (collected = filed by channel + unknown + to remit) and the Reconciliation sheet with the stored configuration.",
    "A daily job generates the current period's report; any period can be generated on demand from the form, and each report is stored with the configuration that produced it.",
  ],
  sections: [
    {
      title: "Latest report and history",
      route: "/tax-reports",
      summary:
        "The most recent report opens on arrival — totals, status with cause, rows — with the history panel listing every period generated, its status and a download.",
      details: [
        "Generate report takes a period and produces a new stored report.",
        "Delete report removes a stored report; the daily job will regenerate the current period.",
      ],
      screen: "tax-reports",
    },
    {
      title: "One report",
      route: "/tax-reports/[reportId]",
      summary:
        "Summary, reconciliation detail, the assumptions panel (the stored configuration), the report rows, and Download.",
      details: [
        "Reconciliation notes — such as tax components beyond the displayed columns — are shown as notes, not failures, when the report balances.",
        "'Needs a decision' surfaces items that require the accountant's call rather than a default.",
      ],
    },
    {
      title: "Nexus Watch",
      route: "/tax-reports/nexus",
      summary:
        "Sales into each state against its economic-nexus threshold: registered states, states needing attention, and the coverage banner stating what share of orders carry a destination.",
      details: [
        "Every figure is a floor while coverage is incomplete — the true number can only be higher, and the page says so first.",
        "A state with no rule configured is listed as such rather than assumed safe.",
      ],
    },
  ],
  howToUse: [
    "Open Sales & Tax. The latest report is shown; read the status. If RECONCILED, click Download and send the workbook.",
    "If REVIEW REQUIRED, read the cause — expected, calculated, difference, area — and resolve it before filing.",
    "To produce a report for another period, use Generate report with the period dates.",
    "Open the report's assumptions panel when a figure is questioned months later; it records the configuration used.",
    "Check Nexus Watch monthly for states approaching their threshold.",
  ],
  benefits: [
    "A filing-ready workbook every period without a spreadsheet stitched by hand.",
    "A reconciliation that must balance, stated in words with its cause.",
    "Jurisdiction and marketplace-facilitator liability separated correctly.",
    "Advance warning of nexus registration obligations.",
  ],
  goodToKnow: [
    "The refund basis (order date) is the client's accounting policy and lives in configuration; every stored report records the basis it used, so old and new reports can be told apart.",
    "The By Jurisdiction sheet is gross of refunds because refund lines carry no per-jurisdiction split; the sheet footer states this.",
    "Tax liability history before July 2026 reports as unknown until the backfill script is run for earlier periods.",
    "Excel export here is a specific approved deliverable; it is not a general export facility.",
  ],
  related: ["orders", "system", "settings"],
});
