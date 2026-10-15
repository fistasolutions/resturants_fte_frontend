import { defineDoc } from "@/lib/docs/define";

/** Frontend SPEC-379/380 (backend SPEC-393/395): Order Taking. */
export const posDoc = defineDoc({
  slug: "pos",
  title: "Order Taking",
  route: "/pos",
  area: "operations",
  tagline: "Take counter and phone orders: caller ID, the menu with the pizza builder, coupons, cash or card — straight to the kitchen; then settle and refund the day's orders.",
  sources: ["The brand's menu and offers", "The branch's service settings", "Your guests"],
  refresh: "Live: every change to the order is priced by the backend",
  updated: "2026-10-15",
  hero: "orders",
  heroCaption: "The restaurant screens are captured on the next capture run; shown is Orders, the store-side page this one sits beside.",
  whatItIs: [
    "Order Taking is the branch's point of sale for counter and phone orders. The order goes straight to the branch's kitchen board, numbered for the day, and counts in every figure once it is completed.",
  ],
  whyItMatters: [
    { title: "Every price from one place", body: "The backend prices every order with the brand's menu, the branch's prices and the offers, so the counter, the phone and the website always agree." },
    { title: "The caller is known", body: "Type the phone number and the guest's name, saved addresses and recent orders appear; reorder in one tap." },
  ],
  howItWorks: [
    "Pick the branch and the order type: carryout, delivery or dine-in.",
    "Look up the caller by phone; a new caller is saved with the order.",
    "Tap an item to open the builder: size, toppings on the whole pizza or one half, light or extra, choices, quantity and a note.",
    "The cart is priced by the backend on every change: subtotal, offer, delivery fee, tax and tip.",
    "Choose how it is paid: cash now (type the cash given and the change shows before you place it), card now, or later — cash or card at the door, or at the store.",
    "Place the order; it lands on Kitchen & Dispatch as accepted, with its quoted ready time.",
    "Cash taken goes into the branch's drawer for the day, which Cash & Day Close reconciles.",
  ],
  sections: [
    { title: "New order", route: "/pos", summary: "The menu grid by category, the item builder, the caller panel and the priced cart with checkout and payment.", details: ["The quoted time grows with how busy the kitchen is.", "Items the branch has 86'd cannot be added.", "Cash now refuses less cash than the total."] },
    {
      title: "Orders",
      route: "/pos?tab=orders",
      summary: "The branch's orders for a business day — search by order number, phone or name — with each order's lines, payments and refunds.",
      details: [
        "Take payment settles an unpaid order with cash (with its change) or a card.",
        "Refund gives money back on a finished or cancelled order, up to what was paid: a card paid online goes back through the franchise's Stripe account, cash comes out of today's drawer, a card taken at the counter is refunded on the terminal and recorded here. It needs the Refund orders permission.",
        "A refund comes off net sales and the royalty basis.",
      ],
    },
  ],
  howToUse: [
    "Choose the branch.",
    "Enter the caller's phone and look them up.",
    "Add items with the builder.",
    "Add a coupon or a tip if any, choose the payment, and place the order.",
    "On Orders, open an order to take its payment or refund it.",
  ],
  benefits: [
    "One price everywhere.",
    "Faster phone orders with caller ID and reorder.",
    "Orders straight to the kitchen.",
  ],
  goodToKnow: [
    "Guests pay by card online on the brand's ordering site when the branch's franchise has connected its Stripe account (Network › the franchisee's page).",
    "The POS takes orders even when online ordering is paused for being busy.",
  ],
  related: ["kitchen", "cash", "menu", "network"],
});
