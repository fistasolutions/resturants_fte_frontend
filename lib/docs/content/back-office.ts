import { defineDoc } from "@/lib/docs/define";

/** Frontend SPEC-394 (backend SPEC-414/415): the back office. */
export const backOfficeDoc = defineDoc({
  slug: "back-office",
  title: "Back Office",
  route: "/back-office",
  area: "operations",
  tagline: "Each branch's crew and time clock, the week's schedule against expected sales, and inventory counts with food cost against the recipes.",
  sources: ["The crew's clock-ins and outs", "Counts and deliveries recorded here", "The restaurant analytics engine's sales and recipe costs"],
  refresh: "Live — every clock-out, count and delivery counts at once",
  updated: "2026-10-16",
  hero: "orders",
  heroCaption: "The restaurant screens are captured on the next capture run; shown is Orders, the store-side page this one sits beside.",
  whatItIs: [
    "The back office runs the two costs a branch controls after its sales: labor and food. The crew clock in and out with a PIN, the manager plans the week against the sales the branch usually makes, and the stockroom is counted so the food that was used can be set against what the recipes say the sales should have used.",
  ],
  whyItMatters: [
    { title: "Labor before it happens", body: "A day planned above 30% of its expected sales is flagged while it can still be changed." },
    { title: "Where the food went", body: "The gap between actual and theoretical food cost is waste, over-portioning or loss — each ingredient shows its part." },
  ],
  howItWorks: [
    "Time clock: each crew member has a PIN of 4 to 6 digits, unique at the branch. The PIN clocks them in, or out with their break; hours are time less the break, and the cost is the hours at their rate. The branch's labor for the day — the figure the Ops Coach and the analytics read — is the sum of its finished shifts. A manager can correct a break; the day is re-added.",
    "Schedule: the week starts on a Monday; each planned shift shows its hours and cost. A day's expected sales are the average of the same weekday over the last four weeks, and its labor share is the planned cost over them. A shift ending before it starts runs past midnight.",
    "Inventory: head office keeps the ingredient list with a cost per unit. A count records what is on the shelf (one count a day; counting again that day replaces it); a delivery records what came in and, if given, at what cost. Between the last two counts, each ingredient's use is the opening count plus deliveries less the closing count, and actual food cost is that use at the delivered cost (else the ingredient's). Theoretical food cost is the recipe cost of what the branch sold in the same days; the variance is the difference, also as a share of net sales. An ingredient with more on the shelf than came in is flagged as a count to check.",
  ],
  sections: [
    { title: "Time clock", route: "/back-office?tab=clock", summary: "Clock in or out with a PIN, today's shifts with hours and cost, and the branch's crew with their roles and rates.", details: ["Clocking needs the Take orders permission (the shared POS screen); adding crew and correcting a break need Manage the network."] },
    { title: "Schedule", route: "/back-office?tab=schedule", summary: "The week's planned shifts by day, with hours, cost, expected sales and the labor share; days above 30% are flagged.", details: ["Plan a shift, then Save the week; saving replaces that week's plan."] },
    { title: "Inventory & food cost", route: "/back-office?tab=inventory", summary: "Actual against theoretical food cost between the last two counts, the ingredients driving it, a count of every ingredient, deliveries, and (head office) the ingredient list.", details: ["Two counts are needed before the food cost appears.", "This page shipped before its capture exists; it gets its screen on the next capture run."] },
  ],
  howToUse: [
    "Give every crew member a PIN on their first day.",
    "Plan next week by Thursday and fix the days flagged above 30%.",
    "Count the stock at the same time each week and record every delivery as it arrives.",
  ],
  benefits: ["Labor recorded where the analytics read it.", "A schedule that respects the sales.", "Food cost explained ingredient by ingredient."],
  goodToKnow: [
    "A PIN is stored only as a fingerprint and is never shown again.",
    "Branches whose labor comes from their POS feed keep it; a day with clocked shifts here is summed from them.",
  ],
  related: ["ops-coach", "operations", "menu"],
});
