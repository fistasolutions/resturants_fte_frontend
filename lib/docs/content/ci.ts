import { defineDoc } from "@/lib/docs/define";

export const ciDoc = defineDoc({
  slug: "ci",
  title: "Continuous Innovation",
  route: "/ci",
  area: "platform",
  tagline: "Every build report since day one, inside the product — what was asked for, what was built, why it matters, and the screenshot that proves it. And, since 2026-09-17, every plan waiting for the owner's decision.",
  sources: ["The build reports' own generators", "The two earliest reports as printed pages", "The plans the team writes in the app and the owner's decisions on them"],
  refresh: "Re-generated when a new report is produced",
  updated: "2026-09-21",
  hero: "ci",
  heroCaption:
    "The feed: the engagement report as the hero with its four numbers, then every weekly and daily report by month, newest first — period, kind, the headline, the memo, effort and screens.",
  whatItIs: [
    "Continuous Innovation is the record of the engagement as the owner reads it: the same documents delivered as PDFs — one engagement report, the weekly reports and the daily reports — rendered in the product from the sources that produced them, so the story of the build lives beside the build.",
    "The feed opens with the engagement report and then lists every report newest first, grouped by month. Each card leads with the report's headline and its cover memo — the value in two sentences — and says how much effort it took and how many screens it captured.",
    "The page has two tabs. Reports is the record of what was built. Plans is the record of what comes next: every proposal the team puts on the table is a card the owner opens, reads and decides on at the end — Yes or No — and the decision is stored with the plan.",
  ],
  whyItMatters: [
    {
      title: "One place for the whole story",
      body: "The PDFs were emailed and filed; here they are one click from any page, in order, searchable by eye.",
    },
    {
      title: "Every claim with its proof",
      body: "Each section keeps what was asked for, what was built, why it matters and the value it delivers — with the exact screenshot from the live app the day it shipped.",
    },
    {
      title: "The decision lives with the plan",
      body: "What to build next used to be settled in chat and calls. Now the owner reads the plan in the product, accepts or rejects it there, and a rejection records why not and how it should look instead — so the next version is built from his words.",
    },
    {
      title: "Nothing rewritten",
      body: "The text is the report's own text; the pipeline resolves formatting and nothing else. A report that predates its generator is shown as its printed pages.",
    },
  ],
  howItWorks: [
    "A root tool imports each report's generator as data — the sections, the day summaries, the before/after table, the next steps, the rules — and writes one generated bundle plus every screenshot downscaled for the web.",
    "The page is static: no fetch, no cache; the bundle is the data. A new report means running its generator as before, then the pipeline.",
    "Inline emphasis in the reports is rendered as real elements, never injected as HTML.",
    "Plans are rows in the database, not generated content: the team writes a plan in the app — three boxes (title, why now, what you get), two optional lines (in one line, which falls back to the first bullet; the value) and a collapsed Details row (where it lives, effort, an optional image) — and the owner's decision is written to the same row — who, when, a note on a Yes, the two texts on a No. The owner can edit or revert a decision; the team cannot change a decided plan.",
  ],
  sections: [
    {
      title: "The feed",
      route: "/ci",
      summary: "The engagement report as the hero, then every report by month, newest first: period, kind, headline, memo, effort, screens and areas.",
      details: [
        "Four counters on top: since when, how many reports, how many screens from the live app, and the kinds.",
        "A filter bar — kind (All · Engagement · Weekly · Daily), month, and a search over the headline, memo and area titles — with the result count and a Clear button; six reports a page. The filters and the page are in the URL, so a view can be shared and survives a reload.",
        "Each card leads with the period and kind, the headline, a three-line memo, then 'What it delivered' — the first three areas by name — and effort, screens and areas.",
      ],
      screen: "ci",
    },
    {
      title: "A report",
      route: "/ci/[id]",
      summary: "Three columns: the reports by date on the left, the report in the middle as the PDF prints it, and its contents on the right with the visible section highlighted.",
      details: [
        "Each section: the ask and its status, what we built / why it matters / the value it delivers, what is inside it, and the screenshots with their route and caption.",
        "Then the closing pages a report carries: before and after, where this leaves us, the rules behind the work.",
        "The report opens in its business view — what was asked for, what it now does, why it matters, the value — with the engineering lines (endpoints, spec numbers, timings, test talk) kept out of sight. A 'Technical detail' switch shows them; the choice is remembered in this browser.",
        "On a phone the columns stack; the contents column appears from a wide screen.",
      ],
      screen: "ci-reader",
    },
    {
      title: "The engagement report",
      route: "/ci/engagement",
      summary: "The complete account — incubation, frontend, backend, AI agents, hardening — every area with its line items and effort.",
      details: [],
      screen: "ci-engagement",
    },
    {
      title: "Plans",
      route: "/ci/plans",
      summary: "Every proposal as a card, newest first, coloured by the decision: neutral while awaiting, green once accepted, red once rejected with the owner's notes on it.",
      details: [
        "Four tiles on top: awaiting decision, accepted, rejected with notes, and the effort still on the table (the days of every awaiting plan added up).",
        "A status filter — All · Awaiting · Accepted · Rejected — in the URL, so a view can be shared; it narrows the cards without a request.",
        "Each card: the date and effort, the status pill, the title, the one-line memo, the value line, and — once decided — the verdict: 'Accepted by … on …' or the two rejection texts, 'Why not' and 'Instead'.",
        "New plan is the team's door, kept to three boxes: title, why now, what you get (one per line). Under them two optional lines — in one line (left empty, the first bullet is used) and the value — and a collapsed Details row with where it lives, effort in days and an optional image of what it looks like (PNG, JPEG or WebP, up to 5 MB).",
      ],
      screen: "ci-plans",
    },
    {
      title: "A plan and the decision",
      route: "/ci/plans/[id]",
      summary: "The plan in the platform's own panels — in one line, why now, what you get; effort, where it lives, the value; what it looks like — with the decision at the end.",
      details: [
        "Beside the plan, 'About this plan': status, proposed on, by whom, effort, decided by, decided on.",
        "Your decision closes the page, and both answers take words. Yes — build it opens one optional box — any suggestions or conditions — and Submit; the note is saved with the plan and shown under the verdict and on its card. No — not like this opens two boxes, both required: why not, and how it should look instead. Submit stays off until each has ten characters; the answer is saved with the plan and shown on its card in red. Back returns to the choice.",
        "A decided plan shows its verdict where the buttons were, with Edit decision: the choice comes back with the current words already in the boxes — keep the verdict and change the words, or flip it; Submit replaces the earlier decision, Cancel keeps it, and Revert decision (after a confirm) withdraws it altogether — the plan is awaiting again with its notes cleared. Only the owner's decision can change: the team cannot edit or remove a plan once it is decided.",
        "Edit and Remove of the plan itself exist only while it is awaiting.",
      ],
      screen: "ci-plan",
    },
    {
      title: "Rejecting with notes",
      route: "/ci/plans/[id]",
      summary: "The rejection form, both boxes filled, Save enabled — what the team reads before writing the next version.",
      details: [],
      screen: "ci-plan-reject",
    },
  ],
  howToUse: [
    "Open Continuous Innovation from the sidebar; read the hero card for the engagement as a whole.",
    "Pick a day or a week; the memo on the card is the summary, the report is the detail.",
    "Inside a report, use the contents on the right to jump to an area, and the dates on the left to move between reports without going back.",
    "On Plans, open a card, read to the end, and decide. If it is a No, say why and how it should look instead — that is what the next version is built from.",
  ],
  benefits: [
    "The owner can show anyone what was delivered on any day, with proof, from inside the product.",
    "No report is ever lost or out of date: it is regenerated from the same source as the PDF.",
    "The value of each day is the first thing on the card, not buried on page three.",
    "The decision on what comes next is made where the plan is, recorded with who and when, and never lost in a chat thread.",
  ],
  goodToKnow: [
    "The two earliest weekly reports predate their generators and are shown as their printed pages with their contents transcribed.",
    "Effort is the sum of the report's own section estimates; a report without them shows none rather than a guess.",
    "Every signed-in user sees both sides of Plans — writing and deciding — because the product has no roles yet (roles stay on the Coming Soon list); the decision records who made it.",
  ],
  related: ["system", "ai", "settings"],
});
