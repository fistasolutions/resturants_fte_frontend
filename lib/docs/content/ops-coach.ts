import { defineDoc } from "@/lib/docs/define";

/** Frontend SPEC-385 (backend SPEC-402): the Ops Coach. */
export const opsCoachDoc = defineDoc({
  slug: "ops-coach",
  title: "Ops Coach",
  route: "/ops-coach",
  area: "operations",
  tagline: "Every morning, each branch's one thing to fix today — and the branches head office should call first.",
  sources: ["The restaurant analytics engine: sales, orders, delivery times, labor, voids"],
  refresh: "Daily at 10:05 UTC, and whenever head office runs it",
  updated: "2026-10-16",
  hero: "orders",
  heroCaption: "The restaurant screens are captured on the next capture run; shown is Orders, the store-side page this one sits beside.",
  whatItIs: [
    "The Ops Coach is a digital employee for a restaurant brand. Each morning it reads every open branch's last business day against the same weekday a week earlier and writes each general manager one thing to fix today, and head office a short note on the network.",
  ],
  whyItMatters: [
    { title: "One thing, not a dashboard", body: "A general manager gets one sentence and the figures behind it, not ninety-five dashboards." },
    { title: "Who to call first", body: "Head office sees the branches sorted by urgency: no orders recorded, late deliveries, voids, labor, sales down, average ticket." },
  ],
  howItWorks: [
    "Every figure comes from the analytics engine; the coach only chooses what matters and says it.",
    "The one thing to fix is the first rule that applies, in order: no orders recorded on an open branch; late deliveries (five or more and under 75% on time); voids (five or more, or worth over 3% of sales); labor over 32% of sales; sales down 15% or more on the same day last week; an average ticket 10% or more under the network's median. Otherwise the branch is on track.",
    "Wins are named too: sales up 10% or more, 90% of deliveries on time, labor under 25%.",
    "The network note is written by the Ops Coach agent from the network's figures only; when the model cannot write, a plain note is kept instead.",
    "Running again for a day replaces that day's briefs.",
  ],
  sections: [
    {
      title: "Ops Coach",
      route: "/ops-coach",
      summary: "The network note, filters by focus, and a card per branch with its one thing to fix, its figures, its wins and whether it was emailed.",
      details: [
        "Run the first brief / Run again and Email the GMs are head office's (the Manage the network permission).",
        "Email the GMs sends each branch's brief to the general manager email on its branch page, once; branches without one are counted as skipped.",
        "A franchise member sees its own branches' briefs and not the network note.",
      ],
    },
  ],
  howToUse: [
    "Open the Ops Coach each morning; it starts on the branches with something to fix.",
    "Call the branches at the top first.",
    "Add each branch's GM email (Network › branch) and send the briefs from here.",
  ],
  benefits: ["A morning routine for every branch.", "Problems caught the next day, not at month end.", "Head office time spent where it matters."],
  goodToKnow: [
    "The coach reads complete business days only (they end at 04:00 local time).",
    "A branch closed or coming soon is not briefed.",
  ],
  related: ["network", "operations", "kitchen"],
});
