import { defineDoc } from "@/lib/docs/define";

/** Frontend SPEC-377 (backend SPEC-387/389): a restaurant brand's Royalties page. */
export const royaltiesDoc = defineDoc({
  slug: "royalties",
  title: "Royalties",
  route: "/royalties",
  area: "operations",
  tagline: "What each franchisee owes in royalty and ad fund for the period, from its branches' net sales.",
  sources: ["Your POS (FoodTec): completed orders", "Your network: each franchisee's rates"],
  refresh: "Whenever orders arrive",
  updated: "2026-10-15",
  hero: "tax-reports",
  heroCaption: "The restaurant screens are captured on the next capture run; shown is Sales & Tax, the store-side statement page this one follows.",
  whatItIs: [
    "Royalties shows one statement per franchisee: the branches that traded, their net sales, the royalty and ad-fund rates and amounts, and the total due.",
  ],
  whyItMatters: [
    { title: "One basis for everyone", body: "Every franchisee is billed on the same net sales the rest of the product shows." },
    { title: "No spreadsheet month-end", body: "The statement is ready for any period, for the whole network or one franchisee." },
  ],
  howItWorks: [
    "Net sales are completed orders' subtotal less discounts; tax, tips and delivery fees are left out.",
    "Royalty and ad fund are net sales times each franchisee's rate, rounded to the cent on the franchisee's total.",
    "The brand's own (corporate) branches are listed at zero.",
  ],
  sections: [
    { title: "Royalties", route: "/royalties", summary: "One statement per franchisee with the totals, and the basis the figures use.", details: ["A franchise member sees only their own statement."] },
  ],
  howToUse: [
    "Pick the billing period with the date controls.",
    "Read the totals, then each franchisee's line.",
    "Open a franchisee to check its branches and rates.",
  ],
  benefits: [
    "Royalty statements in seconds, not days.",
    "The same figures franchisees see on their own screens.",
  ],
  goodToKnow: [
    "If a franchise agreement defines sales differently, the basis changes in one place on the backend.",
  ],
  related: ["network"],
});
