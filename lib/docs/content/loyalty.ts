import { defineDoc } from "@/lib/docs/define";

/** Frontend SPEC-383 (backend SPEC-398): Loyalty & Gift Cards. */
export const loyaltyDoc = defineDoc({
  slug: "loyalty",
  title: "Loyalty & Gift Cards",
  route: "/loyalty",
  area: "operations",
  tagline: "The brand's points program and its rewards, every member's points, the gift cards sold, and what each franchise holds for the others.",
  sources: ["Orders from the POS and the brand's online ordering", "Gift cards sold at the counter"],
  refresh: "Live",
  updated: "2026-10-16",
  hero: "orders",
  heroCaption: "The restaurant screens are captured on the next capture run; shown is Orders, the store-side page this one sits beside.",
  whatItIs: [
    "Loyalty & Gift Cards runs the two things that bring guests back: a points program — members earn points on the food they buy and spend them on rewards — and gift cards that work at every branch of the brand.",
  ],
  whyItMatters: [
    { title: "Guests come back for a reason", body: "Points turn into food. Members see their points at the counter and on the phone, and earn on every order, online too." },
    { title: "Gift cards across franchises, settled honestly", body: "A card sold at one franchise can be spent at another; the settlement shows what each franchise holds for the others." },
  ],
  howItWorks: [
    "Head office switches the program on and sets the points per unit spent on food and the welcome points.",
    "A guest joins at the counter (Join in the caller panel) or when ordering online. Joining gives the welcome points once.",
    "When a member's order is finished, it earns points on its food (subtotal less discounts), worked out by the backend.",
    "At the counter, a member's rewards show in the caller panel; Use prices the reward into the order and the points leave with it. Cancelling the order gives them back; a refund takes back the points the refunded food earned.",
    "Rewards are used at the counter by looking the guest up by phone, and online at checkout once the member proves the phone is theirs: Use your points emails a 6-digit code to the address on their membership (it works for 10 minutes, 5 tries; at most 3 codes in 15 minutes), and the confirmed code lets them pick a reward for the next 30 minutes. A member with no email on file uses rewards at the store. The answer to asking for a code is the same for anyone, so the page never tells who is a member.",
    "A gift card is sold or reloaded at the counter for cash or by card. Its code is shown once; afterwards only its last four exist anywhere. Selling a card is not a sale — the money counts as sales when the card is spent.",
    "A gift card pays what it holds, at the counter, at the door or online; the rest is paid in cash, by card, or by card online.",
  ],
  sections: [
    {
      title: "Program",
      route: "/loyalty",
      summary: "The program's switch, name, points per unit spent and welcome points; the rewards (an amount off, or one item free); members and points outstanding.",
      details: ["Only head office changes the program and the rewards.", "A free-item reward takes one unit of the dearest matching line off, and needs that item in the order."],
    },
    {
      title: "Members",
      route: "/loyalty?tab=members",
      summary: "Find a member by name, phone or email and read every point that moved.",
      details: ["Adjust points adds or takes points with a reason (Adjust guests' points permission); a balance never goes below zero.", "A franchise sees the members whose home branch is its own."],
    },
    {
      title: "Gift cards",
      route: "/loyalty?tab=gift-cards",
      summary: "Every card by its last four: balance, status and every transaction — sold, reloaded, spent, refunded onto the card, adjusted.",
      details: ["Disable, Enable and Adjust balance need the Manage gift cards permission.", "Head office sees the money still on cards across the brand."],
    },
    {
      title: "Settlement",
      route: "/loyalty?tab=settlement",
      summary: "Head office only: for a period, each franchise's gift-card money sold and spent at its branches, and the difference.",
      details: ["A positive net means the franchise holds money other franchises' guests will spend."],
    },
  ],
  howToUse: [
    "On Program, switch the program on and add two or three rewards.",
    "At the counter, look the caller up, tap Join or Use a reward.",
    "Sell gift cards from Order Taking's Gift card button.",
    "At the end of each month, read the Settlement.",
  ],
  benefits: ["More visits from members.", "Gift cards that work at every branch.", "A clear record of every point and every gift-card dollar."],
  goodToKnow: [
    "A gift card holds between 5 and 500 per load and at most 2,000.",
    "Points never expire in this version.",
  ],
  related: ["pos", "cash", "guests"],
});
