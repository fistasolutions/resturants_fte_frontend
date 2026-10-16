import { defineDoc } from "@/lib/docs/define";

/** Frontend SPEC-390 (backend SPEC-408): the Reputation Manager. */
export const reputationDoc = defineDoc({
  slug: "reputation",
  title: "Reputation Manager",
  route: "/reputation",
  area: "operations",
  tagline: "Every guest's rating of their order, what the ratings say branch by branch, and a reply to every unhappy guest.",
  sources: ["Guests' ratings on the order tracker", "The brand's orders, branches and guests"],
  refresh: "Live — a rating appears the moment a guest sends it",
  updated: "2026-10-16",
  hero: "orders",
  heroCaption: "The restaurant screens are captured on the next capture run; shown is Orders, the store-side page this one sits beside.",
  whatItIs: [
    "The Reputation Manager is a digital employee for a restaurant brand. Once an order has reached the guest, the order tracker asks for a rating: one to five stars, a few taps on what stood out, and a comment. The manager collects every rating, shows what they say across the network and branch by branch, and drafts a reply to every unhappy guest for a person to send.",
  ],
  whyItMatters: [
    { title: "Hear every guest", body: "Most guests never write a review; a tap on the tracker hears from far more of them, and while the order is fresh." },
    { title: "Fix the cause, not the review", body: "Late, cold, missing, wrong — the themes say what each branch has to fix." },
    { title: "Answer before it goes public", body: "An unhappy guest who gets a real answer quickly is far less likely to take it to a public review." },
  ],
  howItWorks: [
    "The tracker asks once the order is delivered or picked up, and once only. One to three stars offer the complaints (late, cold, missing item, wrong item, rude); four or five offer the praise (great taste, hot and fresh, fast, friendly).",
    "A rating needs a reply when it has one or two stars or names a complaint, until a reply is sent.",
    "Draft a reply has the Review Reply Writer write one in the brand's voice from the Brand Brain, from the stars, the tags, the guest's words, the branch and the guest's first name. It never offers money, food or a promise; a person decides those. When the writer is unavailable, a plain reply is drafted instead.",
    "Send emails the reply to the guest when they gave an email; otherwise the rating is recorded as answered (by phone or in person). A reply is sent once.",
  ],
  sections: [
    {
      title: "Reputation Manager",
      route: "/reputation",
      summary: "The last 7, 30 or 90 days: average stars, ratings, the share of 4–5 stars, what guests say, each branch's average and most-said complaint, and every rating with its reply.",
      details: [
        "Filters: Waiting for a reply (the default), 1–2 stars, 4–5 stars, All.",
        "Drafting, saving and sending a reply need the Manage the network permission. A franchise member sees its own branches' ratings only.",
        "This page shipped before its capture exists; it gets its screen on the next capture run.",
      ],
    },
  ],
  howToUse: [
    "Open the Reputation Manager each day and answer every rating waiting for a reply.",
    "Check each branch's most-said complaint and take it to that branch's general manager.",
    "Switch to 90 days to see whether a branch's complaint is going away after you acted on it.",
  ],
  benefits: ["Every guest heard.", "Problems named branch by branch.", "Unhappy guests answered in the brand's voice."],
  goodToKnow: [
    "Ratings come from the brand's own ordering site and tracker; Google reviews are not read yet.",
    "Average stars sit on the Digital Employees card with the number waiting for a reply.",
  ],
  related: ["ops-coach", "orders", "network"],
});
