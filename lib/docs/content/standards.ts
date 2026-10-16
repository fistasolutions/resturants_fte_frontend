import { defineDoc } from "@/lib/docs/define";

/** Frontend SPEC-392 (backend SPEC-411): Brand Standards. */
export const standardsDoc = defineDoc({
  slug: "standards",
  title: "Brand Standards",
  route: "/standards",
  area: "operations",
  tagline: "QSC visits scored against the brand's checklist, the actions each failure creates, and the branches overdue a visit.",
  sources: ["Field consultants' QSC visits recorded here"],
  refresh: "Live — a visit counts the moment it is saved",
  updated: "2026-10-16",
  hero: "orders",
  heroCaption: "The restaurant screens are captured on the next capture run; shown is Orders, the store-side page this one sits beside.",
  whatItIs: [
    "Brand Standards is a digital employee for a restaurant brand. Field consultants record each visit to a branch against one checklist of Quality, Service and Cleanliness (QSC); every failed point becomes a corrective action the branch must close.",
  ],
  whyItMatters: [
    { title: "One standard for every branch", body: "The same eighteen points, scored the same way, make branches comparable." },
    { title: "Failures become actions", body: "A failed point is not just a lower score — it is a task with a due date until someone closes it." },
  ],
  howItWorks: [
    "Each point is answered Pass, Fail or Not seen; a failed point can carry a note on what was wrong.",
    "The score is the share of points passed among those seen, out of 100; each section is scored the same way. 90 and above meets the standard, 75 to 89 needs work, under 75 is below standard.",
    "Every failed point becomes a corrective action due 14 days after the visit. A branch not visited for 90 days, or never, shows Visit due.",
  ],
  sections: [
    {
      title: "Brand Standards",
      route: "/standards",
      summary: "Record a visit; each branch's latest score, grade and days since its last visit; the open corrective actions, overdue first; and every visit with its section scores.",
      details: [
        "Recording a visit and closing an action need the Manage the network permission. A franchise member records and sees its own branches only.",
        "Every point must be answered before a visit can be saved, and the visit date cannot be in the future.",
        "This page shipped before its capture exists; it gets its screen on the next capture run.",
      ],
    },
  ],
  howToUse: [
    "Record every consultant visit the same day.",
    "Work the open actions from the top: the overdue ones first.",
    "Plan the next round of visits from the branches marked Visit due.",
  ],
  benefits: ["Comparable branches.", "Problems turned into closed actions.", "No branch forgotten."],
  goodToKnow: ["Points marked Not seen do not count for or against the score.", "The Digital Employees card shows the actions past due."],
  related: ["ops-coach", "network"],
});
