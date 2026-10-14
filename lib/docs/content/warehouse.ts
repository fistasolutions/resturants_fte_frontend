import { defineDoc } from "@/lib/docs/define";

export const warehouseDoc = defineDoc({
  slug: "warehouse",
  title: "Warehouse",
  route: "/warehouse",
  area: "operations",
  tagline: "Packing performance from iPacky and the live unfulfilled backlog from Shopify — who is packing, how fast, how accurately, and whether orders are getting stuck.",
  sources: ["iPacky", "Shopify"],
  refresh: "iPacky today-sync every 15 minutes (Live badge); full sync nightly at 01:00 UTC",
  updated: "2026-09-11",
  hero: "warehouse",
  heroCaption:
    "The Warehouse page: packing KPIs for the range, the per-packer table (orders, items per hour, pack time, deviations, repacks, utilisation), the hourly strip, and the live backlog panel.",
  whatItIs: [
    "Warehouse is the fulfilment page. From iPacky's packing records it shows how the warehouse team performed in the chosen range — orders and items packed, average pack time, ready-to-packed lead time, deviations and repacks — per packer and per hour. From Shopify it shows the live unfulfilled backlog: how many orders are waiting, how old the oldest is, and which ones have been stuck for more than a week.",
    "When the backlog ages past the threshold, the page flags it and lets you email the warehouse manager from a reviewed draft; the Results page later shows whether the backlog dropped.",
  ],
  whyItMatters: [
    {
      title: "Packing accountability per person",
      body: "Productivity and quality per packer — throughput, pack time, deviations, repacks — replaces an impression with a measured record, and each packer has a drill-down.",
    },
    {
      title: "Stuck orders are visible before customers write in",
      body: "The backlog panel names the oldest unfulfilled orders and how long they have waited; the Morning Brief's 'orders not packed in five days' card links here.",
    },
    {
      title: "Detect → email → result",
      body: "An aging backlog becomes a severity-toned card with a one-click email to the warehouse manager; the send is logged and scored.",
    },
  ],
  howItWorks: [
    "iPacky order checks (packer, duration, deviations, repacks) sync nightly, with a lighter 15-minute today-sync so the page carries a Live badge during the day; a CSV import exists for backfilling history.",
    "Packing KPIs and the per-packer and hourly tables are computed in set-based SQL for the selected range.",
    "The backlog panel reads paid, unfulfilled Shopify orders from the local database — counts, oldest, and the over-a-week list — and the backend judges whether it needs attention and why.",
    "'Email warehouse manager' opens the shared compose panel: an AI-drafted message you can edit or rewrite, sent to the address set in Settings → Manager notifications, with the send recorded for Results.",
  ],
  sections: [
    {
      title: "Packing performance",
      route: "/warehouse",
      summary:
        "KPI tiles — orders packed, items packed, average pack time, average ready → packed, deviations, repacks — and the per-packer table with items/hr, orders/hr, deviation rate and utilisation.",
      details: [
        "Click a packer for their own page: orders packed with duration, deviations and notes.",
        "The hourly strip shows throughput by hour of day for the range.",
        "The live-sync status shows when iPacky last synced; an upload control imports an iPacky export.",
      ],
      screen: "warehouse",
    },
    {
      title: "Backlog",
      route: "/warehouse/backlog",
      summary:
        "The unfulfilled backlog in full: every waiting order with its age, oldest first, and the attention card when the queue is aging.",
      details: [
        "'No orders older than a week' is the clean state and is stated, not left blank.",
      ],
      screen: "warehouse-backlog",
    },
    {
      title: "Email the warehouse manager",
      route: "/warehouse/backlog/send",
      summary: "The compose panel for the aging-backlog email — review, edit or AI-rewrite the draft, then send; history of past sends alongside.",
      details: ["Requires a warehouse manager email in Settings; the panel says so if it is missing."],
    },
  ],
  howToUse: [
    "Open Warehouse and set the range. Read the KPI tiles, then the per-packer table; click a name for that packer's orders.",
    "Check the backlog panel for the oldest unfulfilled orders; open Backlog for the full list.",
    "If the attention card appears, click Email warehouse manager, review the draft, and send.",
    "Set or change the recipient under Settings → Manager notifications → Warehouse manager.",
    "Check Results → Warehouse a few days later to see whether the backlog dropped.",
  ],
  benefits: [
    "A measured, per-person view of packing productivity and accuracy.",
    "Stuck orders surfaced daily, with the oldest named.",
    "A one-click, logged escalation when the queue ages.",
  ],
  goodToKnow: [
    "iPacky measures packing, not shipping — there is no carrier or delivery date in the platform.",
    "The page reads only the local database; iPacky is never called from a request.",
    "The iPacky integration no-ops when credentials are absent; the page then shows the backlog from Shopify alone.",
  ],
  related: ["orders", "brief", "results", "settings"],
});
