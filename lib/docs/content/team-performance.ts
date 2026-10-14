import { defineDoc } from "@/lib/docs/define";

export const teamPerformanceDoc = defineDoc({
  slug: "team-performance",
  title: "Team Performance",
  route: "/team-performance",
  area: "customers",
  tagline: "Customer support, measured — volume, speed, resolution, CSAT and backlog per agent, every conversation searchable, revenue at risk, and what customers keep asking about.",
  sources: ["Gorgias", "Shopify"],
  refresh: "Gorgias tickets, messages and CSAT sync every 15 minutes",
  updated: "2026-09-11",
  hero: "team-performance",
  heroCaption:
    "Team Performance overview for a range: KPIs versus the prior period, the alerts strip, revenue at risk from unhappy high-value customers, contact rate, and breakdowns by channel and contact reason.",
  whatItIs: [
    "Team Performance turns the Gorgias support inbox into a management view. It measures the team and each agent — conversations handled, first-response and resolution times, resolution rate, reopens and CSAT — and lists every conversation so a manager can read the thread behind any number.",
    "It connects support to money: open or unhappy tickets from high-lifetime-value customers are flagged as revenue at risk, contact rate is tracked as tickets per hundred orders, and Voice of Customer mines the conversations for the questions and pain themes that keep recurring.",
  ],
  whyItMatters: [
    {
      title: "Per-agent performance without a spreadsheet",
      body: "Tickets, response speed, resolution, reopens and CSAT per agent, with a podium and a leaderboard — attribution works because Gorgias records the agent on each ticket.",
    },
    {
      title: "Protect the customers who matter most",
      body: "Revenue at risk ranks unresolved or unhappy conversations by the customer's lifetime value, so the most valuable open cases are handled first.",
    },
    {
      title: "Alerts that name the problem",
      body: "Unanswered, aging over 24 hours, reopened, unhappy — each is a filtered list, not a number.",
    },
    {
      title: "Hear what customers keep saying",
      body: "Voice of Customer classifies questions into demand and pain themes across the whole inbox — aggregated, never personal.",
    },
  ],
  howItWorks: [
    "Tickets, messages, agents, tags and CSAT survey results sync from Gorgias into the database every 15 minutes.",
    "Metrics are computed in set-based SQL per range and per agent; customers are matched to Shopify by email so lifetime value, refunds and exchanges can sit beside a conversation.",
    "Revenue at risk multiplies open or unhappy tickets by the matched customer's lifetime value; contact rate divides tickets by orders in the period.",
    "Voice of Customer runs an AI classification over conversation text into themes, and reports only the aggregated themes and counts.",
    "Support supervision: when the queue needs attention the overview flags it with a one-click email to the support lead; sends are logged and scored on Results → Support Team.",
  ],
  sections: [
    {
      title: "Overview",
      route: "/team-performance",
      summary:
        "Support health at a glance — volume, response speed, resolution, backlog versus the previous period — with the alerts strip, revenue at risk, contact rate and breakdowns by channel and contact reason.",
      details: ["The attention card and Email support lead appear when the queue is aging."],
      screen: "team-performance",
    },
    {
      title: "Conversations",
      route: "/team-performance/conversations",
      summary:
        "Every conversation, searchable by subject, customer or order and filterable by agent, channel, status and satisfaction; open one to read the full thread.",
      details: [
        "A conversation shows the customer's all-time refunds and exchanges beside it, matched by email.",
        "Read-only from Gorgias — nothing here replies or edits a ticket.",
      ],
      screen: "team-conversations",
    },
    {
      title: "Agents",
      route: "/team-performance/agents",
      summary: "The podium and per-agent table — conversations, average first response, average resolution, resolution rate, reopened, CSAT — with an agent page and review for each.",
      details: ["Gorgias agents not yet mapped to a staff name can be mapped inline."],
      screen: "team-agents",
    },
    {
      title: "Alerts",
      route: "/team-performance/alerts",
      summary: "Conversations that need attention — unanswered, unhappy, reopened, or open over 24 hours — each list linking to the thread.",
      details: [],
      screen: "team-alerts",
    },
    {
      title: "Voice of Customer",
      route: "/team-performance/voice-of-customer",
      summary: "What customers keep asking about — demand and pain themes with counts, the top question, what they are unhappiest about, and which themes are rising fastest.",
      details: ["Aggregated themes only; no personal data is shown."],
      screen: "team-voc",
    },
  ],
  howToUse: [
    "Open Team Performance and set the range. Read the KPIs against the prior period and the alerts strip.",
    "Open Revenue at risk and work the top rows first — they are the most valuable customers with an open or unhappy ticket.",
    "Use Agents to compare the team; click an agent to see their conversations.",
    "Use Conversations to find any thread by subject, customer or order number.",
    "Read Voice of Customer monthly to see which product or policy questions are growing.",
    "If the queue is aging, send the support-lead email from the attention card and check Results → Support Team later.",
  ],
  benefits: [
    "Agent performance measured consistently, from the system of record.",
    "Support prioritised by the customer's value to the business.",
    "An honest read on service quality as volume grows.",
    "Product and policy signals mined from real customer language.",
  ],
  goodToKnow: [
    "Requires Gorgias credentials on the Integrations page; the page shows an honest empty state without them.",
    "Gorgias tickets do not carry an order number in this store's data, so support cost per product cannot be computed and is not shown.",
    "Voice of Customer uses an AI classifier; its runs are metered on AI Performance.",
  ],
  related: ["returns", "customers", "results", "brief"],
});
