import { defineDoc } from "@/lib/docs/define";

export const briefDoc = defineDoc({
  slug: "brief",
  title: "Morning Brief",
  route: "/brief",
  area: "command",
  tagline: "The daily action page — what needs attention, today's decisions, and what happened overnight, in one screen.",
  sources: ["Shopify", "Gorgias", "Loop Returns", "iPacky", "V-Count", "Klaviyo"],
  refresh: "Prepared after every 15-minute sync; your approvals and skips show at once",
  updated: "2026-10-09",
  hero: "brief",
  heroCaption:
    "The Morning Brief on a Thursday: yesterday's headline, five attention cards, three ready-to-send decisions, the overnight watch, predictions, and integration health.",
  whatItIs: [
    "The Morning Brief is the page the app opens on. It replaces the habit of reading six reports to work out what to do: every morning it prepares a short list of things that need a look and a handful of pre-packaged decisions, each with the evidence attached and a one-click way to act.",
    "It is deliberately short. If nothing needs a decision, it says so rather than inventing one. Everything on it is computed by the backend from synced data — the AI writes the narrative and never the numbers.",
  ],
  whyItMatters: [
    {
      title: "Ten minutes instead of an hour",
      body: "Overdue orders, stuck stock, silent VIP customers, unanswered tickets and slow returns are five different systems. The brief reads all of them and hands you the three calls worth making today.",
    },
    {
      title: "Approving a card does something real",
      body: "Review & Send emails the right store manager their overdue list, or syncs the win-back list to Klaviyo. A decision here is an action, not a checkbox.",
    },
    {
      title: "Overnight problems surface before customers notice",
      body: "The Overnight Watch compares yesterday to the same weekday historically, counts sync errors, and flags variants about to run out — so a bad night is visible at 7am, not at month end.",
    },
    {
      title: "Every send is remembered and measured",
      body: "What was sent, to whom and when is logged, and the Results page later says whether it worked. Nothing is fired twice by mistake.",
    },
  ],
  howItWorks: [
    "Overnight, the scheduler runs the brief's detectors against the synced database: unshipped orders past 48 hours, best-sellers stocked out at stores while storage holds units, top customers who have gone quiet for longer than their own usual gap, tickets unanswered, returns waiting, refunds not completed, and stores converting below the benchmark.",
    "The heavy part of the page — yesterday's figures, the overdue orders, the transfer opportunities, the quiet top customers, the overnight watch and integration health — is computed once right after each 15-minute sync and saved. Opening the Brief reads that saved copy and adds only what changes between syncs, such as today's approvals and skips, so it opens at once instead of recomputing on every visit.",
    "Each finding is priced in dollars by the analytics engine (revenue held in overdue orders, lifetime value going quiet, revenue ready once transferred) so cards rank by money, not by count.",
    "The AI writes the one-line framing of each decision from those computed figures; it cannot introduce a number of its own.",
    "You open the page, expand the evidence, and either Review & Send, View the underlying list, or Skip today. Sending routes each location's slice to the manager email set in Settings.",
    "The Results page records the before/after for every send, and the brief's history keeps each day's page exactly as it was.",
  ],
  sections: [
    {
      title: "Needs attention",
      route: "/brief",
      summary:
        "Live alert cards for the things that are wrong right now, each with a count, the oldest item, and a link straight to the page that fixes it.",
      details: [
        "Tickets unanswered over 24 hours (Gorgias) → Team Performance alerts.",
        "Orders not packed in five days (Shopify + iPacky) → Warehouse backlog.",
        "Returns waiting over three days and refunds not completed (Loop) → Returns.",
        "A store converting below benchmark (V-Count) → Store Traffic.",
        "Lower-value alerts collapse behind an expander so the top of the page stays short.",
      ],
      screen: "brief",
    },
    {
      title: "Website · what broke yesterday",
      route: "/brief",
      screen: "brief",
      summary:
        "The product pages worth real money whose website friction is new, or at least twice the week's daily average, on Clarity's latest day — three at most, revenue first — and a quiet line for everything else.",
      details: [
        "A row appears only when the page earned $10,000 or more in the last 90 days and its friction (rage clicks, dead clicks, script errors, error clicks) is new — none on any of the seven days before — or up 2× on that week's daily average. The rule is fixed; no AI decides it.",
        "Each row: the page with its severity and a 'new yesterday' or 'up N×' chip, the issues in words with when they started, the 90-day revenue and units, and Watch — the page's recordings in your own Clarity project. The title opens the page's friction screen under Store Traffic › Website.",
        "The closing line counts the other pages that had friction below this line and names the biggest earner among them, so 'nothing else' is a checked fact; the full list is on Store Traffic › Website. The panel does not appear at all until Clarity has captured a day; it is live-only, not in the archive.",
      ],
    },
    {
      title: "Today's decisions",
      route: "/brief",
      summary:
        "Zero to three cards, each a decision with its dollar value, the computed evidence, and Review & Send / View / Skip today.",
      details: [
        "Send managers their overdue-order lists — grouped by location, paid and unfulfilled past 48 hours.",
        "Move stock from storage to selling locations — best-sellers at ≤2 units in a store while storage holds more than 10.",
        "Win back your best customers — top-20% lifetime-value customers silent for twice their usual gap.",
        "Each card shows when it was prepared and whether anything has been sent yet today.",
      ],
    },
    {
      title: "Review & Send — overdue orders",
      route: "/brief/overdue",
      summary:
        "The overdue list grouped by location, reviewed on screen before anything leaves. Send one location or all of them.",
      details: [
        "Each location shows its manager recipient (from Settings → Manager notifications) and the orders that will be attached.",
        "The email is professionally branded, with a summary in the body and the full order list attached as a spreadsheet.",
        "A location already sent today is marked, so nothing goes out twice.",
      ],
      screen: "brief-overdue",
    },
    {
      title: "Review & Send — store traffic nudge",
      route: "/brief/traffic",
      summary:
        "When a store's conversion drops below the benchmark, a nudge to that store's manager is prepared here with the footfall evidence.",
      details: [
        "Shows visitors, conversion and the revenue gap versus the benchmark store.",
        "Sent per location; can be automated from Settings → Automatic sending.",
      ],
      screen: "brief-traffic",
    },
    {
      title: "Overnight watch, predictions and integration health",
      route: "/brief",
      summary:
        "Below the decisions: what the platform saw overnight, where the month is heading, and whether every connected system is live.",
      details: [
        "Sync errors and last success; revenue anomaly check against the same weekday's history.",
        "Returns ticking up on a specific product; variants near stock-out with days of cover.",
        "Pace to goal and revenue so far this month, linking to Foresight → Forecast & Pace.",
        "One tile per integration — Shopify, V-Count, Gorgias, Loop, iPacky, Klaviyo — with its last sync; the System page has the full job history.",
      ],
    },
    {
      title: "History",
      route: "/brief/history",
      summary:
        "Every past brief, with what was decided and sent that day. Pick any date from the date picker on the brief itself.",
      details: [
        "A past day renders exactly as it was prepared — the decisions, values and evidence of that morning.",
        "Useful for 'what did we do about this last week' without re-deriving it.",
      ],
      screen: "brief-history",
    },
  ],
  howToUse: [
    "Open the app — the Morning Brief is the home page. Read the headline line: yesterday's revenue, orders, and the comparison to the same weekday last week.",
    "Scan Needs attention. Click a card's arrow to jump to the page that owns the problem (Team Performance, Warehouse, Returns, Store Traffic).",
    "For each decision card, expand the evidence block to see the computed rows behind the dollar figure.",
    "Click Review & Send to open the per-location review. Check the recipients, then send one location or Send all.",
    "Use Skip today when a decision is not worth acting on; it returns tomorrow if still true.",
    "Check the Overnight watch for sync errors or a revenue anomaly, and the Predictions tiles for pace to goal.",
    "To automate sends, go to Settings → Automatic sending and switch on the decisions you no longer want to review by hand.",
    "Use the date picker (top right) to open any previous day's brief.",
  ],
  benefits: [
    "One page, three yes/no calls, done — instead of assembling the morning from six systems.",
    "Decisions are priced in dollars, so the biggest lever is always at the top.",
    "Managers receive exactly their own location's list, already written, with the detail attached.",
    "A silent overnight failure — a sync error, a stock-out, a revenue anomaly — is visible before opening hours.",
    "Everything sent is logged and later scored on Results.",
  ],
  goodToKnow: [
    "The brief is prepared in the early morning in the store's timezone and stamped with 'Data as of'. Attention cards use the latest 15-minute sync.",
    "Nothing sends without a human unless you switch on Automatic sending in Settings — and even then every send is logged.",
    "Manager recipients come from Settings → Manager notifications; a location without an address is shown as unconfigured, not silently skipped.",
    "Transfer and win-back reviews live on their own pages (Inventory → Warehouse → Store review; Customers → Winback) — the brief's cards link to them.",
    "Integration tiles only appear for systems with credentials configured; an unconfigured integration is a deliberate silence, not a fault.",
  ],
  related: ["results", "settings", "inventory", "customers", "system"],
});
