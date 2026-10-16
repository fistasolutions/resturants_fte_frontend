import { defineDoc } from "@/lib/docs/define";

/** Frontend SPEC-391 (backend SPEC-410): the Catering Desk. */
export const cateringDoc = defineDoc({
  slug: "catering",
  title: "Catering Desk",
  route: "/catering",
  area: "operations",
  tagline: "Catering inquiries from your site, quotes priced from the branch's menu, followed to won or lost.",
  sources: ["The Catering form on the brand's locations site", "Each branch's own menu and prices"],
  refresh: "Live — an inquiry appears the moment a guest sends it",
  updated: "2026-10-16",
  hero: "orders",
  heroCaption: "The restaurant screens are captured on the next capture run; shown is Orders, the store-side page this one sits beside.",
  whatItIs: [
    "The Catering Desk is a digital employee for a restaurant brand. Guests ask for catering from the Catering form on the brand's locations site (/r/<brand>); every inquiry lands here, is given to a branch, quoted from that branch's own menu, sent and followed to won or lost.",
  ],
  whyItMatters: [
    { title: "The biggest tickets", body: "One office lunch can be worth a week of a table's orders — and it goes to whoever answers first." },
    { title: "Priced right, every time", body: "Every line is priced from the branch's real menu, with its own price overrides." },
  ],
  howItWorks: [
    "The guest gives a name, an email or a phone, the date (tomorrow up to a year ahead), the guests, delivery (with an address) or pickup, and what they are planning.",
    "Assign the inquiry to a branch; the quote uses that branch's menu. Add dishes and quantities, a delivery fee and a note, then Price the quote: each dish is priced at the branch's price (a sized dish at its smallest size) and the totals are worked out by the platform.",
    "Send the quote emails the lines, the total and the note to the guest and marks it Quoted. A guest without an email is called instead. Mark it Won or Lost when they answer.",
  ],
  sections: [
    {
      title: "Catering Desk",
      route: "/catering",
      summary: "The inquiries by status (New, Quoted, Won, Lost, All), each with the event, the contact, the notes, the branch, Won/Lost and the quote builder.",
      details: [
        "Assigning, pricing, sending and marking won or lost need the Manage the network permission. A franchise member sees the inquiries of its own branches; unassigned ones are head office's.",
        "This page shipped before its capture exists; it gets its screen on the next capture run.",
      ],
    },
  ],
  howToUse: [
    "Check New each morning and assign every inquiry to the nearest branch.",
    "Price and send the quote the same day.",
    "Mark each quote Won or Lost so the Digital Employees card shows what catering brings in.",
  ],
  benefits: ["Fast answers win the order.", "Quotes priced from the real menu.", "Catering revenue tracked."],
  goodToKnow: [
    "A quote is a message to the guest, not an order; place the order on Order Taking when they confirm.",
    "The Catering form sits at the bottom of the brand's locations page.",
  ],
  related: ["pos", "spotlight", "menu"],
});
