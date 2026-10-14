import { defineDoc } from "@/lib/docs/define";

export const resultsDoc = defineDoc({
  slug: "results",
  title: "Results",
  route: "/results",
  area: "platform",
  tagline: "Every message the platform sent on your behalf, and whether it worked — a before/after verdict per send, rolled up into a value ledger.",
  sources: ["Shopify", "Gorgias", "Loop Returns", "iPacky", "V-Count", "Klaviyo"],
  refresh: "Outcomes re-measured with each 15-minute sync until the window closes",
  updated: "2026-10-09",
  hero: "results",
  heroCaption:
    "Results: the Value Ledger tiles — actions taken, worked, still measuring, measured value — above the chronological ledger, with a tab per send type.",
  whatItIs: [
    "Results closes the loop. Every send the platform makes — overdue-order lists, transfer requests, win-back syncs, dead-inventory alerts, order reviews, store-traffic nudges, discount reviews, warehouse, support and returns escalations — is recorded here with what it was about, when it went, and a verdict measured afterwards: Worked, Too early to tell, or No change.",
    "The Value Ledger on top rolls every category into four numbers and a single chronological list, and is honest about attribution: only win-backs carry a dollar value, because only a named customer list synced on a known date can have its subsequent orders attributed. Everything else is measured by whether the backlog it was about actually dropped.",
  ],
  whyItMatters: [
    {
      title: "Did it work — answered, not assumed",
      body: "An overdue list was sent: did the orders ship? A transfer was requested: did the store's stock arrive? A win-back went out: did they buy? Each send is scored against reality.",
    },
    {
      title: "One place for every outbound action",
      body: "Ten send types, one page. The Morning Brief, Inventory, Customers, Discounts, Warehouse, Team Performance and Returns all send from their own pages; the outcomes land here.",
    },
    {
      title: "A value figure you can defend",
      body: "Measured value is captioned with how many actions it covers, rows without a measurable value show a dash rather than $0, and the basis is stated on each valued row.",
    },
  ],
  howItWorks: [
    "Each send records a snapshot of the thing it was about — the overdue orders, the stocked-out variants, the customer list, the backlog size — at the moment of sending.",
    "On every sync the outcome service re-measures the same thing and compares: orders shipped, stock present, customers ordered, backlog reduced, discounting changed.",
    "A verdict is assigned per send — Worked, Too early to tell (still inside the measurement window), or No change — and can move from 'early' to a final state as days pass.",
    "Win-back sends attribute the revenue of the synced customers' orders after the sync date; the ledger sums only those, and states the basis.",
    "The Results page reads all outcome lists in one request and renders the ledger plus one tab per category; each row links back to the page it came from.",
  ],
  sections: [
    {
      title: "Value Ledger",
      route: "/results",
      summary: "Four tiles — actions taken, worked, still measuring, measured value (captioned with how many actions carry a value) — and the chronological ledger across all categories.",
      details: ["Rows without a measurable value show '—', never $0."],
      screen: "results-ledger",
    },
    {
      title: "Managers",
      route: "/results",
      summary:
        "Every store and every configured warehouse, support and returns lead as a row: nudges received, worked, no change, still measuring, the act rate, the first move, the last nudge — and a Preview of the Monday report card with Send now.",
      details: [
        "Rows are ordered by who acts least (act rate ascending), then still measuring, then never nudged, then stores with nobody to tell — the top of the list is who to call.",
        "A store with no manager email shows 'No email set → Settings' and links straight to its row on Manager notifications; it still appears so the gap is visible.",
        "Acts = worked ÷ (worked + no change). First move = hours until the first order on a list shipped after the nudge; only overdue and orders lists can measure it — the platform sees outcomes, not replies.",
        "Expand a row for its three latest outcomes and a chip per send type.",
        "Preview card opens the Monday report card for that store — health, rank, margin, conversion, discounting, returns, fulfilment for the last completed week, what is open right now, and last week's notes — exactly as the manager receives it. Send now sends it; a second send of the same week is 'Send again'.",
        "Send all Monday cards now sends to every store with a manager email and says, store by store, who received it, who was skipped and why, and any delivery failure.",
        "The weekly automatic send is switched on in Settings → Automatic sending.",
      ],
    },
    {
      title: "Per-type tabs",
      route: "/results",
      summary: "Overdue, Transfers, Winback, Dead Inventory, Orders, Store Traffic, Discount Reviews, Warehouse, Support Team, Returns — each listing that type's sends with its before/after figures and verdict.",
      details: [
        "Each row links to the source page (the location's transfer list, the discounted transaction, the warehouse backlog…).",
        "Verdict badges: ✓ Worked, → Too early to tell, ✗ No change.",
      ],
      screen: "results",
    },
  ],
  howToUse: [
    "Open Results. Read the four ledger tiles — the caption on Measured value tells you how many actions it covers.",
    "Scan the ledger for 'No change' rows; open the source page to decide whether to follow up.",
    "Use the per-type tabs to review one kind of send — for example, every transfer request and whether the stock moved.",
    "Open Managers to see who acts on what you send; fill the 'No email set' rows first, then call whoever sits at the top of the list.",
    "Preview a store's Monday card before switching the weekly send on; Send now sends it to that manager today.",
    "Return after a few days for the 'Too early to tell' rows to settle.",
  ],
  benefits: [
    "Proof, per action, that the platform's prompts changed something — or did not.",
    "A single accountable history of everything sent on the business's behalf.",
    "Accountability by person, not by send type — and a Monday scoreboard in every manager's inbox without forwarding numbers by hand.",
    "A value total that will survive scrutiny because it claims only what it can measure.",
  ],
  goodToKnow: [
    "Measurement windows differ by type; 'Too early to tell' is a real state, not a placeholder.",
    "Transfers and the operational outcomes are measured by backlog or stock movement, not revenue — attributing a store's revenue swing to one transfer would be an inference.",
    "AI Performance is a different question — how the agents performed — and lives on its own page.",
  ],
  related: ["brief", "customers", "inventory", "ai"],
});
