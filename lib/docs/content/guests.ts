import { defineDoc } from "@/lib/docs/define";

/** Frontend SPEC-377 (backend SPEC-387/389): a restaurant brand's Guests page. */
export const guestsDoc = defineDoc({
  slug: "guests",
  title: "Guests",
  route: "/guests",
  area: "customers",
  tagline: "Who orders, who comes back, who has gone quiet — and the guests worth the most.",
  sources: ["Your POS (FoodTec): the guest on each order (phone, email or customer id)"],
  refresh: "Whenever orders arrive",
  updated: "2026-10-15",
  hero: "customers",
  heroCaption: "The restaurant screens are captured on the next capture run; shown is Customers, the store-side page this one follows.",
  whatItIs: [
    "Guests counts the guests who ordered in the period, the new and the returning, those whose last order was 30 to 90 days ago (lapsed) or longer (lost), and lists the most valuable guests.",
  ],
  whyItMatters: [
    { title: "Win back before they are gone", body: "A lapsed guest is cheaper to bring back than a new one is to win. The counts show how many there are." },
    { title: "Know the regulars", body: "The most valuable guests, with their orders and opt-in, are the list a loyalty offer starts from." },
  ],
  howItWorks: [
    "A guest is matched by the POS's customer id, then by phone, then by email, so the same person is one guest across branches.",
    "Counts and totals are worked out from the orders; nothing is kept on the guest that could drift.",
    "Lapsed and lost are measured on the period's last day: lapsed when the last order was 30 to 90 days before it, lost when it was longer ago.",
  ],
  sections: [
    { title: "Guests", route: "/guests", summary: "Active, new, returning, lapsed and lost guests, orders per guest, and the 25 most valuable guests.", details: ["Narrow it to a franchisee, a region or a period with the controls above."] },
  ],
  howToUse: [
    "Open Guests for the last 28 days.",
    "Compare lapsed with active to judge how many slip away.",
    "Use the opt-in column before planning any email or SMS.",
  ],
  benefits: [
    "The size of the win-back opportunity.",
    "The regulars named.",
    "One guest across every branch.",
  ],
  goodToKnow: [
    "An order with no phone, email or customer id has no guest.",
    "Only guests who opted in may be marketed to.",
  ],
  related: ["network", "operations"],
});
