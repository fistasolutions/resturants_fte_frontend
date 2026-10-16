import { defineDoc } from "@/lib/docs/define";

/** Frontend SPEC-377 (backend SPEC-387/389): a restaurant brand's Network page. */
export const networkDoc = defineDoc({
  slug: "network",
  title: "Network",
  route: "/network",
  area: "command",
  tagline: "Every branch and every franchise of a restaurant brand on one screen: how the network is trading, the branch league, the franchisees, who sees what, and the data the POS sends.",
  sources: ["Your POS (FoodTec): orders, menu, labor", "Your network: franchisees, regions, branches"],
  refresh: "As soon as the POS sends data (push) or a file is imported; figures are read live from the database",
  updated: "2026-10-16",
  hero: "dashboard",
  heroCaption: "The restaurant screens are captured on the next capture run; shown is the Dashboard, which the Network overview's strip-and-chart layout follows.",
  whatItIs: [
    "Network is the home page of a restaurant brand. It shows the whole franchise network: every branch, every franchisee and every region, and how they traded in the period you pick.",
    "Head office (a member with no franchise scope) sees and manages the whole network. A franchise member sees only their franchisee's branches, or some of them, and never the head-office tabs.",
    "It appears only for an organization switched on as a restaurant brand. The pages that read Shopify data are hidden for such an organization.",
  ],
  whyItMatters: [
    { title: "One view of every branch", body: "Net sales, transactions, average ticket, labor, food and prime cost, delivery on-time rate and third-party share, against the period before, for the whole network or any franchisee or region." },
    { title: "Franchises see their own", body: "A franchisee's people see their own branches and figures only, everywhere in the product, because access is set per member, not per page." },
    { title: "The POS stays the record", body: "Orders, menu and labor come from the POS by push or by file. Nothing in the POS is ever changed." },
  ],
  howItWorks: [
    "Head office sets the brand up once: its name, timezone and currency. That creates the brand's network with a first region and its corporate entity.",
    "Franchisees, regions and branches are added one by one or imported from a spreadsheet. Each branch has a store number, and the POS store id its data is matched by.",
    "The POS sends orders, menu items and labor with an ingest key, or a spreadsheet export is imported on the Data tab. Sending the same order again replaces it, so nothing is counted twice.",
    "The backend works out every figure from those orders. Net sales are completed orders' subtotal less discounts, without tax, tips or delivery fees.",
    "Every list and figure is narrowed to what the member may see before it leaves the backend.",
  ],
  sections: [
    { title: "Overview", route: "/network", summary: "The period's KPIs against the period before, net sales by business day, and the top and bottom branches.", details: ["The period is the last 7, 28 or 90 complete days; today is still trading and is left out.", "Narrow it to a franchisee or a region with the filters above the tabs."] },
    { title: "Branches", route: "/network?tab=branches", summary: "The branch league: rank, net sales and change, orders, average ticket, labor, delivery time and on-time rate for every branch.", details: ["The bottom quarter's rank is highlighted.", "Add branch and Import branches are head office's; an import is checked first, then written, and running the same file again changes nothing.", "A branch's page carries its Service settings and its Delivery zones: areas drawn on a map, each with its own delivery fee, order minimum and extra minutes. Once a branch has an active zone, online delivery addresses must fall inside one and postal codes stop counting; with none, the postal codes rule. Draw a zone needs the Manage your branches' service permission; placing the branch on the map is head office's."] },
    { title: "Franchisees", route: "/network?tab=franchisees", summary: "Every franchisee with its branches, royalty and ad-fund rates and contact.", details: ["A franchisee's own page lists its branches, its card payments and its team: its members, invitations and its own roles.", "Card payments connects the franchise's own Stripe account (publishable key, secret key, webhook signing secret) so guests pay by card online; the money goes straight to the franchise. Secrets are never shown again once saved. It needs the Connect payment accounts permission.", "A franchise owner invites people into their franchise only, and creates roles that never hold more than their own."] },
    { title: "Regions", route: "/network?tab=regions", summary: "How the brand groups its branches, with each region's branch count.", details: ["A region with branches cannot be deleted until its branches move."] },
    { title: "Access", route: "/network?tab=access", summary: "Head office only: who sees which part of the network — the whole network, one franchisee, or some of its branches.", details: ["The owner always sees the whole network.", "A role that changes the whole brand (managing the network, the team or the integrations) cannot be limited to a franchise."] },
    { title: "Data", route: "/network?tab=data", summary: "Head office only: ingest keys for the POS, file imports for orders, menu and labor, and the reference the POS integration team needs.", details: ["A key is shown once; only its first characters are kept for display.", "A business day starts at 04:00 in the branch's timezone, unless the POS sends its own business date."] },
    { title: "Settings", route: "/network?tab=settings", summary: "Head office only: the brand's rules — whether delivery charges count toward royalties, the royalty week's first day, a minimum weekly royalty per branch, and the delivery on-time target.", details: ["Every figure and statement uses the new rules from the moment they are saved; issued and paid statements keep what they billed.", "Order by chat (off until switched on): guests can tell the Order Taker what they want on the ordering page. It finds the dishes on the branch's menu, prices them with the same pricing as the menu, and shows the order with a Use this order button; the guest checks out as usual. It never places an order or states a price of its own."] },
  ],
  howToUse: [
    "Open Network and set up the brand.",
    "Add your franchisees with their royalty and ad-fund rates, then import your branches from a spreadsheet.",
    "On Data, create an ingest key for your POS integration, or import an orders export.",
    "Read the Overview for the period, then open the Branches league and the branch that needs attention.",
    "On Access, limit each franchise member to their own franchisee.",
  ],
  benefits: [
    "Every branch's figures in one place, against the period before.",
    "Franchisees see only their own branches.",
    "No retyping: the POS's data arrives by push or by file.",
    "The same order sent twice is counted once.",
  ],
  goodToKnow: [
    "FoodTec has no public developer API; its data arrives by push from an integration or by its report exports. A direct connection follows once FoodTec grants partner access.",
    "Labor and food-cost percentages are worked out only on the days that carry labor and food-cost data.",
    "The restaurant pages appear only for an organization switched on as a restaurant brand.",
  ],
  related: ["menu", "operations", "guests", "royalties"],
});
