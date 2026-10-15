import { defineDoc } from "@/lib/docs/define";

/** Frontend SPEC-379/380/384 (backend SPEC-393/395/400): Kitchen & Dispatch. */
export const kitchenDoc = defineDoc({
  slug: "kitchen",
  title: "Kitchen & Dispatch",
  route: "/kitchen",
  area: "operations",
  tagline: "Every open order of the branch as a ticket: make it, bake it, send it out, and know who is on the road.",
  sources: ["Orders from the POS and the brand's online ordering"],
  refresh: "Every 10 seconds",
  updated: "2026-10-16",
  hero: "orders",
  heroCaption: "The restaurant screens are captured on the next capture run; shown is Orders, the store-side page this one sits beside.",
  whatItIs: [
    "Kitchen & Dispatch is the branch's kitchen display and delivery board. Each order moves from new to making to the oven to ready, then out for delivery and delivered, or picked up.",
  ],
  whyItMatters: [
    { title: "Nothing is forgotten", body: "Every order is a ticket with its age; a ticket past its quoted time is marked." },
    { title: "Guests see it live", body: "Each move updates the guest's tracker link: made, in the oven, out with the driver, delivered." },
  ],
  howItWorks: [
    "New orders arrive from the POS and the online store; online orders wait to be accepted. An order paid by card online reaches the board only once Stripe says it is paid.",
    "One button moves a ticket to its next stage; a busy kitchen may skip ahead, and every stage passed is time-stamped.",
    "Ready delivery orders go to Dispatch, where a driver is chosen and the order sent out. A map shows the branch, the ready deliveries and every driver's last position, and Suggested runs groups nearby orders (up to three, ready within ten minutes of each other) in driving order — Send together hands the run to one driver.",
    "Each driver gets a link to the driver app on their phone: the run in order, Navigate and Call, Delivered (or Paid cash / Paid card when money is owed), and Share my location, which puts the driver on the dispatch map and on the guest's tracker.",
    "Delivered or picked-up orders complete and count as sales. An order still unpaid is finished with how it was paid — Paid cash or Paid card — and cash goes into the day's drawer.",
  ],
  sections: [
    { title: "Kitchen", route: "/kitchen", summary: "Four columns — New, Making, Oven, Ready — with each ticket's lines, toppings, notes, age and one bump button.", details: ["Cancel asks for a reason, which is kept with the order."] },
    { title: "Dispatch", route: "/kitchen?tab=dispatch", summary: "Ready delivery orders with a driver picker and Send out; orders on the road with Delivered.", details: ["A driver back from the last delivery becomes available again by itself.", "An order the driver collects money for is marked Collect; Delivered asks whether it was paid cash, card or with a gift card (its code)."] },
    { title: "Drivers", route: "/kitchen?tab=drivers", summary: "The branch's drivers: add, set off shift or available, deactivate, and give each one their driver-app link.", details: ["Driver link shows the link once, with Copy; issuing a new one stops the old link working, and Revoke stops it outright.", "Each driver shows when their phone last reported its position."] },
  ],
  howToUse: [
    "Choose the branch.",
    "Bump each ticket as it moves.",
    "On Dispatch, pick a driver and send ready deliveries out.",
    "Mark deliveries delivered when the driver is back.",
  ],
  benefits: [
    "A paperless kitchen.",
    "Faster, fairer dispatch.",
    "Live tracking for guests.",
  ],
  goodToKnow: [
    "The board shows the open orders and those finished in the last hour.",
    "A driver's position is shared only while the driver app is open with Share my location on; guests see it only while their order is on its way.",
    "Orders placed without a map point (an address typed at the counter) still go out, but run alone and do not show on the map.",
  ],
  related: ["pos", "cash", "operations", "network"],
});
