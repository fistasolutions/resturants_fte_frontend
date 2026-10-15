import { defineDoc } from "@/lib/docs/define";

/** Frontend SPEC-377 (backend SPEC-387/389): a restaurant brand's Royalties page. */
export const royaltiesDoc = defineDoc({
  slug: "royalties",
  title: "Royalties",
  route: "/royalties",
  area: "operations",
  tagline: "What each franchisee owes in royalty and ad fund on the brand's gross-sales basis, and the weekly statements that bill it: draft, issued, paid.",
  sources: ["Your POS (FoodTec): completed orders", "Your network: each franchisee's rates"],
  refresh: "Whenever orders arrive",
  updated: "2026-10-15",
  hero: "tax-reports",
  heroCaption: "The restaurant screens are captured on the next capture run; shown is Sales & Tax, the store-side statement page this one follows.",
  whatItIs: [
    "Royalties shows what each franchisee owes for any period, and turns each week into a statement that head office issues and records as paid.",
    "Every franchisee is billed on the same gross sales the rest of the product shows, under the brand's rules on Network › Settings.",
  ],
  whyItMatters: [
    { title: "One basis for everyone", body: "Every franchisee is billed on the same net sales the rest of the product shows." },
    { title: "No spreadsheet month-end", body: "The statement is ready for any period, for the whole network or one franchisee." },
  ],
  howItWorks: [
    "Gross sales are food and drink at menu price on every channel (marketplace orders before the marketplace's commission), plus the delivery charges the store keeps when the brand counts them. Tax, tips, discounts, voids and refunds never count.",
    "Royalty and ad fund are gross sales times each franchisee's rate, rounded to the cent on the franchisee's total. The brand's own (corporate) branches owe nothing.",
    "A weekly statement can add a minimum weekly royalty per open franchise branch, when the brand sets one.",
    "Billing a week creates a draft per franchisee; billing it again refreshes drafts and leaves issued and paid statements as they are.",
  ],
  sections: [
    { title: "This period", route: "/royalties", summary: "One line per franchisee for any period: branches trading, gross sales, rates, royalty, ad fund and total due, with the rules that decided the basis.", details: ["A franchise member sees only its own line.", "Narrow it to a franchisee or a region with the controls above."] },
    { title: "Statements", route: "/royalties?tab=statements", summary: "The weekly bills: each franchisee's week with its branch lines, minimum top-up, total due and status.", details: ["Head office bills the last complete week, issues each statement, records the payment with its reference, or voids a statement that should not stand.", "A paid statement cannot be changed or voided.", "A franchise member sees its own statements, read-only."] },
  ],
  howToUse: [
    "Set the brand's rules on Network › Settings: delivery charges, the week's first day, any minimum.",
    "On Statements, bill the last complete week.",
    "Check each draft's branch lines, then issue it.",
    "When a franchisee pays, record the payment with its reference.",
  ],
  benefits: [
    "Royalty statements in seconds, not days.",
    "The same figures franchisees see on their own screens.",
  ],
  goodToKnow: [
    "If a franchise agreement defines gross sales differently, the brand's rules change it in one place.",
    "A week can be billed only once it has ended.",
  ],
  related: ["network"],
});
