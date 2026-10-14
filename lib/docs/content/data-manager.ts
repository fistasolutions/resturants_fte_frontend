import { defineDoc } from "@/lib/docs/define";

const NOT_CAPTURED = "Data Manager's own screens are captured on the next capture run.";

export const dataManagerDoc = defineDoc({
  slug: "data-manager",
  title: "Data Manager",
  route: "/data-manager",
  area: "merchandising",
  tagline:
    "Your sheets and invoices, turned into real cost and profit: Airtable bases and any uploaded sheet or invoice copied exactly, matched to your products, and turned into real cost, real price, real revenue and real profit.",
  sources: ["Airtable", "Uploaded sheets and invoices", "Shopify"],
  refresh: "Airtable is read when you press Read now; an upload is copied the moment you drop it",
  updated: "2026-10-14",
  hero: "products-costs",
  heroCaption:
    "Products › Costs, where the real cost Data Manager works out lands once you apply it. " + NOT_CAPTURED,
  whatItIs: [
    "Data Manager is the employee for the records a store keeps outside Shopify: purchase orders with sizes and unit prices, supplier balances, payments, freight and duty, stock shipped to each location. It copies them in exactly as they are, from Airtable or from a file you upload, so nobody types them again.",
    "It then matches every row to a product in your store and works out what each item really cost, what customers really paid for it, and what it really earned, side by side with what Shopify's own unit cost says.",
    "Data Manager is switched on per organization. Until the import engine is live, its pages show labelled example data, and a CSV you upload is copied in your browser so you can check the exact copy.",
  ],
  whyItMatters: [
    {
      title: "One real cost on every page",
      body: "Shopify's unit cost usually leaves out freight and duty, so every margin built on it is too high. Data Manager's real cost feeds True Profit, the Dashboard, Discount Decisions and Foresight once you apply it.",
    },
    {
      title: "Nothing typed twice",
      body: "A purchase order, a supplier statement or an invoice is copied as written, cell for cell, instead of being re-entered by hand.",
    },
    {
      title: "Nothing changes behind your back",
      body: "A change in a source waits on the Changes tab until you apply it, and sales already made keep the cost that was true when they sold.",
    },
  ],
  howItWorks: [
    "Connect Airtable or upload a file on Sources. Airtable is read only when you press Read now, so a free Airtable plan's monthly limit is never spent in the background.",
    "Each table is kept as an exact copy: text stays text, a code like 00123 keeps its zeros, a price like 12.50 keeps its decimals, and a lone “.” stays in its cell.",
    "On Matching, Data Manager suggests what each column means (style code, unit cost, freight, quantity by size). You confirm once, and every later read remembers.",
    "It matches each row to a product by its code, then by barcode, and asks you about the rows it is not sure of.",
    "The backend works out real cost, real price, real revenue and real profit from the confirmed columns and your orders. The page only shows the figures.",
    "When a source changes, the changes wait on the Changes tab until you apply them.",
  ],
  sections: [
    {
      title: "Overview",
      route: "/data-manager",
      summary: "Real revenue, real profit and real margin for the last 30 days, cost coverage, what needs you, and what the employee did last.",
      details: ["The margin tile shows how far Shopify's unit cost overstates the real margin.", NOT_CAPTURED],
    },
    {
      title: "Sources",
      route: "/data-manager?tab=sources",
      summary: "Your Airtable bases with their tables, and the upload area for sheets and invoices.",
      details: [
        "Read now copies every table of the connected bases. Reading is manual on purpose.",
        "Uploads take CSV, Excel, PDF and photos of invoices. A CSV or TSV is copied in your browser at once; Excel, PDF and image invoices are read by the import engine.",
        "Uploading the same sheet again shows what changed instead of adding a second copy.",
        NOT_CAPTURED,
      ],
    },
    {
      title: "Tables",
      route: "/data-manager?tab=tables",
      summary: "Every copied table, shown exactly as its source holds it, with a search across its rows.",
      details: ["Each column carries its type (text, number, currency, date and so on); numbers are right-aligned, nothing is rounded or trimmed.", NOT_CAPTURED],
    },
    {
      title: "Matching",
      route: "/data-manager?tab=matching",
      summary: "What each column means, and the rows that could not be matched to a product on their own.",
      details: [
        "Each suggestion shows how sure it is. Nothing is calculated from a column until its meaning is confirmed.",
        "A row that needs a look shows the closest product on your store and how alike they are; pick it once and the row keeps it.",
        NOT_CAPTURED,
      ],
    },
    {
      title: "Real profit",
      route: "/data-manager?tab=profit",
      summary: "Units kept, real price, discount, real cost, real revenue, real profit and real margin per product, vendor or location, beside what Shopify says.",
      details: ["The gap column shows how many points Shopify's unit cost overstates the margin.", NOT_CAPTURED],
    },
    {
      title: "Changes",
      route: "/data-manager?tab=changes",
      summary: "What changed in a source since the last read: changed cells with the old and new value, new rows and removed rows.",
      details: ["Apply counts the changes from today; sales already made keep their cost.", NOT_CAPTURED],
    },
    {
      title: "Settings",
      route: "/data-manager?tab=settings",
      summary: "The connection, how much Data Manager may do on its own, and which cost wins when two places hold one.",
      details: [
        "The order is your tables first, then shipment invoices on Products › Costs, then Shopify's unit cost.",
        "Data Manager never writes to Airtable or to your store.",
        NOT_CAPTURED,
      ],
    },
  ],
  howToUse: [
    "Open Data Manager from Digital Employees.",
    "On Sources, drop a CSV of a purchase order or supplier statement and open its copy on Tables.",
    "On Matching, check what each column means and confirm it.",
    "Read Real profit to see where Shopify's cost overstates your margin.",
    "When a source changes, review the Changes tab and apply.",
  ],
  benefits: [
    "Purchase orders, payments and supplier balances in one place, copied exactly.",
    "A real cost per variant that includes freight and duty.",
    "Real profit per product, vendor and location.",
    "No manual re-entry of figures from sheets or invoices.",
  ],
  goodToKnow: [
    "Switched on per organization; an organization without it never sees the page.",
    "Until the import engine is live, the pages show labelled example data, and only CSV and TSV uploads are copied (in your browser, for this visit).",
    "Airtable's free plan allows about 1,000 API calls a month, which is why reading is manual.",
  ],
  related: ["products", "inventory", "employees", "integrations"],
});
