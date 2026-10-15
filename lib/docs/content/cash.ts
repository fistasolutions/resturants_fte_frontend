import { defineDoc } from "@/lib/docs/define";

/** Frontend SPEC-380 (backend SPEC-395): Cash & Day Close. */
export const cashDoc = defineDoc({
  slug: "cash",
  title: "Cash & Day Close",
  route: "/cash",
  area: "operations",
  tagline: "The branch's drawer: open with a float, record paid-ins, paid-outs and drops, count and close the day — and the day's report.",
  sources: ["Payments and refunds taken at the branch", "The branch's orders"],
  refresh: "Every minute, and after every change",
  updated: "2026-10-15",
  hero: "orders",
  heroCaption: "The restaurant screens are captured on the next capture run; shown is Orders, the store-side page this one sits beside.",
  whatItIs: [
    "Cash & Day Close is each branch's drawer for one business day and the day's report. Cash sales and cash refunds land in the drawer by themselves; the shift records what else goes in or out; closing counts the cash against what should be there.",
  ],
  whyItMatters: [
    { title: "Every cash difference is seen", body: "Closing keeps the counted cash next to the expected cash, so a drawer that is short or over is on the record the same night." },
    { title: "One day, one report", body: "Net sales, refunds, voids, tax, tips and delivery fees for the day, by channel and by tender, from the same orders the network's figures use." },
  ],
  howItWorks: [
    "A business day runs from 04:00 to 04:00 in the branch's time zone.",
    "Open the drawer with its float. A cash sale opens the drawer on its own, with no float, if no one has yet; set the float afterwards.",
    "Cash expected = float + cash sales + paid in − paid out − cash refunds − drops.",
    "Close the day with the cash counted; the variance is kept. A closed drawer takes no more cash until the day is reopened.",
  ],
  sections: [
    {
      title: "Cash & Day Close",
      route: "/cash",
      summary: "The drawer — float, cash sales, paid in, paid out, refunds, drops, cash expected, and counted with the variance once closed — beside the day's report by tender and by channel and every cash movement.",
      details: [
        "Paid in, Paid out and Drop to safe are recorded with an amount; a paid out says what it was for.",
        "Pick another business day to read a past day's drawer and report.",
        "Open orders are counted once they are finished.",
      ],
    },
  ],
  howToUse: [
    "Choose the branch.",
    "At opening, open the drawer with its float.",
    "During the day, record paid-ins, paid-outs and drops.",
    "At closing, count the cash, type it in and close the day.",
  ],
  benefits: [
    "A drawer that reconciles itself.",
    "Short or over, seen the same night.",
    "The day's report without a spreadsheet.",
  ],
  goodToKnow: [
    "It needs the Run the cash drawer permission; franchise owners, general managers and shift managers have it.",
    "A card taken at the counter is not cash: it shows under By tender, never in the drawer.",
  ],
  related: ["pos", "kitchen", "network"],
});
