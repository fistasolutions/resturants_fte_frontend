import { defineDoc } from "@/lib/docs/define";

/** Frontend SPEC-391 (backend SPEC-409): the Menu Engineer. */
export const menuEngineerDoc = defineDoc({
  slug: "menu-engineer",
  title: "Menu Engineer",
  route: "/menu-engineer",
  area: "operations",
  tagline: "The menu changes worth making — re-price, push, re-cost or retire — with what each is worth, one click to apply.",
  sources: ["The restaurant analytics engine's menu engineering", "The brand's catalog: prices, sizes, recipe costs"],
  refresh: "Live — read each time the page opens, over the period chosen",
  updated: "2026-10-16",
  hero: "orders",
  heroCaption: "The restaurant screens are captured on the next capture run; shown is Orders, the store-side page this one sits beside.",
  whatItIs: [
    "The Menu Engineer is a digital employee for a restaurant brand. It reads what every dish sold and earned over the period, from the menu engineering on the Menu page, and lists the changes worth making, each with what applying it does.",
  ],
  whyItMatters: [
    { title: "Margin hides in the menu", body: "A popular dish with a high food cost quietly loses money on every order; a few cents on its price fixes it." },
    { title: "From a chart to a decision", body: "Menu engineering sorts dishes into stars, plowhorses, puzzles and dogs; this turns that into a short list to decide." },
  ],
  howItWorks: [
    "Re-price: a plowhorse (popular, thin margin) whose food cost is above 32% of its price and that is sold at a single price (no sizes). The new price brings food cost to 30%, rounded up to .49 or .99, and never more than a 10% raise. What it is worth is the raise times the units sold in the period — an estimate at today's volume.",
    "Retire: a dog (few orders, thin margin) selling at under half the popularity line. Push: a puzzle (good margin, few orders). Add its cost: a dish that sells but has no recipe cost.",
    "Head office decides. Applying a re-price changes the brand price in the catalog; retiring takes the dish off the menu; push and add its cost are marked done. Not now hides the suggestion for 90 days; so does a decision.",
  ],
  sections: [
    {
      title: "Menu Engineer",
      route: "/menu-engineer",
      summary: "The period (7, 30 or 90 days), tiles for changes to decide, what the re-prices are worth, dishes to retire and to push, the suggestions filtered by kind, and the decisions already made.",
      details: [
        "Applying and Not now need the Manage the network permission and head office; a franchise member sees the suggestions only.",
        "This page shipped before its capture exists; it gets its screen on the next capture run.",
      ],
    },
  ],
  howToUse: [
    "Open it after a busy month and decide the re-prices first — they are worth the most.",
    "Retire one dog at a time and watch the dish's section on the Menu page.",
    "Ask the branches to suggest each puzzle for a week, then check it again.",
  ],
  benefits: ["Margin recovered dish by dish.", "A shorter, stronger menu.", "Decisions written down with who made them."],
  goodToKnow: [
    "Branch price overrides stay as they are; a re-price changes the brand price.",
    "Dishes sold at several sizes are not re-priced here — change their sizes on the Menu page.",
  ],
  related: ["menu", "ops-coach"],
});
