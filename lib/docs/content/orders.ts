import { defineDoc } from "@/lib/docs/define";

export const ordersDoc = defineDoc({
  slug: "orders",
  title: "Orders",
  route: "/orders",
  area: "operations",
  tagline: "Every order from placement to fulfilment to refund — searchable, filterable, exportable, and the drill-down target for every alert about orders.",
  sources: ["Shopify"],
  refresh: "15-minute sync; six years of order history backfilled",
  updated: "2026-09-11",
  hero: "orders",
  heroCaption:
    "The Orders list: summary tiles for the range, the All / Returned / Cancelled / Discounted tabs, filters by location, fulfilment and order age, search by order number, and CSV export.",
  whatItIs: [
    "Orders is the raw transaction list, built for accountability rather than browsing. It lists every order for the chosen range with status, location, customer, value and age, and slices it into returned, cancelled and discounted orders. Every alert elsewhere that mentions orders — unfulfilled on the dashboard, overdue on the brief, a returns spike — links to the exact filtered list behind it.",
    "It also owns the overdue-orders Review & Send: the unshipped-past-48-hours list grouped by location, reviewed on screen and sent to each location's manager.",
  ],
  whyItMatters: [
    {
      title: "Nothing overdue sits invisible",
      body: "Age filters and the review page surface every paid, unfulfilled order past the threshold, by location, with the oldest first.",
    },
    {
      title: "One click from alert to evidence",
      body: "A dashboard or brief figure lands on the exact orders that produced it — no re-filtering, no doubt about which orders were meant.",
    },
    {
      title: "The full order, in context",
      body: "Order detail shows line items with images, discount codes, refunds and the customer's order history, and links out to the customer, product and location pages.",
    },
    {
      title: "Any slice, exported",
      body: "The filtered list exports to CSV — the one sanctioned CSV export in the product — for anyone who needs to work the list elsewhere.",
    },
  ],
  howItWorks: [
    "The 15-minute sync upserts orders, line items, refunds, discount codes and locations by Shopify id; a bulk backfill loaded six years of history.",
    "The list is served paginated from the database with server-side filters (location, fulfilment, age, tab) and a search on order number; summary tiles are computed for the same slice.",
    "Returned, Cancelled and Discounted are the same list with a fixed filter, each with the same tiles and export.",
    "The Review page groups overdue orders by location, drafts the manager email with the list attached, and records each send so Results can score it.",
  ],
  sections: [
    {
      title: "All orders",
      route: "/orders",
      summary: "The list for the range with summary tiles, filters and search; each row opens the order detail.",
      details: [
        "Filters: location (including Online / unattributed), fulfilment status, order age.",
        "Search by order number; paginated; Export CSV of the current slice.",
      ],
      screen: "orders",
    },
    {
      title: "Order detail",
      route: "/orders/[id]",
      summary: "One order: line items with images, discount codes applied, refunds, fulfilment, location, and the customer's history.",
      details: ["Opens from any order link across the app — dashboard, brief, chat answers, returns."],
    },
    {
      title: "Returned orders",
      route: "/orders/returns",
      summary: "Orders with a refund or return, with a contextual link to Returns Intelligence for the why.",
      details: ["Tiles show the count and value returned in the range."],
      screen: "orders-returns",
    },
    {
      title: "Cancelled",
      route: "/orders/cancelled",
      summary: "Cancelled orders for the range, with their value.",
      details: [],
      screen: "orders-cancelled",
    },
    {
      title: "Discounted",
      route: "/orders/discounted",
      summary: "Orders carrying any discount — automatic, code or manual — with a contextual link to Discount Monitoring.",
      details: ["The Discounts page links back here for the transaction view."],
      screen: "orders-discounted",
    },
    {
      title: "Review & Send — overdue orders",
      route: "/orders/review",
      summary: "Unshipped orders past 48 hours grouped by location, each with its manager recipient, ready to send one location or all.",
      details: [
        "Reached from the Morning Brief's decision card or directly.",
        "A location already sent today is marked; sends are logged and scored on Results → Orders.",
      ],
      screen: "orders-review",
    },
    {
      title: "Returns spike",
      route: "/orders/returns-spike",
      summary: "The orders behind a returns-spike alert on the dashboard — the product that is coming back faster than its history, and its returned orders.",
      details: [],
      screen: "orders-returns-spike",
    },
  ],
  howToUse: [
    "Open Orders and set the range. Use the tabs to switch between all, returned, cancelled and discounted orders.",
    "Filter by location, fulfilment or age; search an order number to jump to one order.",
    "Click a row to open the order detail; follow the links to the customer or product.",
    "Click Export CSV to download the current slice.",
    "For overdue orders, open Review (or the brief's card), check recipients per location, and Send.",
  ],
  benefits: [
    "Overdue orders are visible, grouped and sent to the people who ship them.",
    "Every order figure on any page is one click from its rows.",
    "Six years of history without leaving the app.",
  ],
  goodToKnow: [
    "Orders CSV export is a specific, approved carve-out of the product's export scope; other exports live where they were approved (tax Excel, report PDF).",
    "The age filter measures from order creation to now for unfulfilled orders.",
    "'Online / unattributed' is the bucket for orders with no POS location — including web orders.",
  ],
  related: ["brief", "returns", "discounts", "customers", "warehouse"],
});
