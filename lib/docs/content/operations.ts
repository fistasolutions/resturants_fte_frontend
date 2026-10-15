import { defineDoc } from "@/lib/docs/define";

/** Frontend SPEC-377 (backend SPEC-387/389): a restaurant brand's Operations page. */
export const operationsDoc = defineDoc({
  slug: "operations",
  title: "Operations",
  route: "/operations",
  area: "operations",
  tagline: "How fast orders reach guests, when guests order, and through which channels — for the whole network or any part of it.",
  sources: ["Your POS (FoodTec): order times, channels and sources"],
  refresh: "Whenever orders arrive",
  updated: "2026-10-15",
  hero: "orders",
  heroCaption: "The restaurant screens are captured on the next capture run; shown is Orders, the store-side page whose table this one follows.",
  whatItIs: [
    "Operations reads the timestamps and channels on every order to show speed of service, the dayparts, and the mix of channels and order sources.",
  ],
  whyItMatters: [
    { title: "Speed is the guest's experience", body: "Late deliveries are the first reason a guest does not order again. The branches with the worst on-time rate come first." },
    { title: "Staff to the rush", body: "Knowing which hours carry the sales is how labor is scheduled." },
  ],
  howItWorks: [
    "Delivery time runs from when the order was placed to when it was delivered; carryout time to when it was ready.",
    "An order is late when it was delivered after the time promised.",
    "Dayparts follow the branch's local clock: breakfast 05–11, lunch 11–14, afternoon 14–17, dinner 17–21, late night 21–05.",
  ],
  sections: [
    { title: "Speed of service", route: "/operations", summary: "Average and p90 delivery time, on-time and late rates, carryout time, and the branch table worst first.", details: ["The on-time target is 30 minutes unless the page's target says otherwise."] },
    { title: "Dayparts", route: "/operations?tab=dayparts", summary: "Net sales, orders, average ticket and share per daypart, and a weekday-by-hour heat grid.", details: ["Hours are each branch's own local time."] },
    { title: "Channels", route: "/operations?tab=channels", summary: "Net sales and orders by channel (delivery, carryout, dine-in, catering) and by order source (phone, web, app, walk-in, marketplaces).", details: ["Third-party marketplace orders are those the POS marks DoorDash, Uber Eats or Grubhub."] },
  ],
  howToUse: [
    "Open Speed of service and start with the branch at the top of the table.",
    "Open Dayparts to see where the rush is.",
    "Open Channels to see how much comes through marketplaces.",
  ],
  benefits: [
    "The slowest branches named, every period.",
    "The rush hours of every branch.",
    "The channel mix the marketing plan rests on.",
  ],
  goodToKnow: [
    "Only orders with both times are timed.",
    "The p90 is the time 9 in 10 deliveries arrived within.",
  ],
  related: ["network", "guests"],
});
