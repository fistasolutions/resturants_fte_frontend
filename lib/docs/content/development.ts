import { defineDoc } from "@/lib/docs/define";

/** Frontend SPEC-395 (backend SPEC-416): franchise development. */
export const developmentDoc = defineDoc({
  slug: "development",
  title: "Franchise Development",
  route: "/development",
  area: "operations",
  tagline: "The pipeline that grows the brand: prospects from first inquiry to a signed franchise, and new stores from site search to opening day.",
  sources: ["Prospects and openings recorded here", "The network's franchisees and branches"],
  refresh: "Live — every change counts at once",
  updated: "2026-10-16",
  hero: "orders",
  heroCaption: "The restaurant screens are captured on the next capture run; shown is Orders, the store-side page this one sits beside.",
  whatItIs: [
    "Franchise development is head office's pipeline for growth. Each prospect is followed from the first inquiry to a signed agreement, and each new store from the search for a site to the day it opens — next to the network those franchisees and stores become.",
  ],
  whyItMatters: [
    { title: "No prospect forgotten", body: "Every prospect carries a next step and a date; the steps that are due are listed at the top." },
    { title: "Openings on time", body: "A store whose target date is within 30 days and has not reached training is flagged at risk." },
  ],
  howItWorks: [
    "Prospects: a prospect starts as an inquiry and moves through qualified, discovery day and approved, or to lost. Signing is its own step: it asks for the royalty and ad fund rates and creates the franchisee in the network with the prospect's name. A signed prospect is final.",
    "Openings: an opening belongs to a franchisee and moves through site search, lease signed, permits, build-out and training, or to dropped. Opening is its own step: it asks for the store number and creates the branch, open, with the opening's name and city. An open store is final; a store number already in use is refused.",
    "The summary counts the open prospects, the openings planned in the next 90 days and the openings at risk (a target within 30 days, not yet in training).",
  ],
  sections: [
    { title: "Franchise Development", route: "/development", summary: "The due next steps, the prospects with their stage, and the new-store openings with their franchisee, target date and stage.", details: ["Only head office sees this page; acting needs Manage the network.", "This page shipped before its capture exists; it gets its screen on the next capture run."] },
  ],
  howToUse: [
    "Add every inquiry the day it arrives, with the next step and its date.",
    "Sign an approved prospect here, so the franchisee exists in the network the same day.",
    "Add the opening as soon as a franchisee commits to a store, and move it as each stage finishes.",
  ],
  benefits: ["The growth pipeline next to the network it becomes.", "Signing and opening create the franchisee and the branch, with nothing typed twice."],
  goodToKnow: ["A franchise-scoped member does not see this page — it is head office's.", "Dropping an opening keeps its record; nothing is deleted."],
  related: ["back-office", "royalties", "operations"],
});
