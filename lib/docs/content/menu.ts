import { defineDoc } from "@/lib/docs/define";

/** Frontend SPEC-377 (backend SPEC-387/389): a restaurant brand's Menu Engineering page. */
export const menuDoc = defineDoc({
  slug: "menu",
  title: "Menu",
  route: "/menu",
  area: "merchandising",
  tagline: "The brand's menu in one place: which items earn their place, the catalog every branch sells from, the offers, and each branch's prices and what it has run out of.",
  sources: ["Your POS (FoodTec): order lines and the menu with recipe costs"],
  refresh: "Whenever orders or the menu arrive",
  updated: "2026-10-15",
  hero: "products",
  heroCaption: "The restaurant screens are captured on the next capture run; shown is Product Analyst, the store-side page this one replaces for a restaurant brand.",
  whatItIs: [
    "Menu Engineering places every item sold in the period into one of four groups, the standard Kasavana–Smith method restaurants use to engineer a menu.",
    "Stars are popular and profitable; Plowhorses are popular with a thin margin; Puzzles are profitable but rarely ordered; Dogs are neither. Items without a recipe cost wait as Needs cost.",
  ],
  whyItMatters: [
    { title: "Margin, not just sales", body: "An item that sells a lot can still lose you money per plate. The page shows each item's contribution margin and its share of what the menu earns." },
    { title: "One action per item", body: "Each group comes with what to do: feature it, re-cost or re-price it, reposition it, or replace it." },
  ],
  howItWorks: [
    "The backend counts units and revenue per item from the period's completed orders, leaving voided lines out.",
    "An item's margin is its menu price less its recipe cost.",
    "An item is popular when its share of units reaches 70% of an even share. It is profitable when its margin reaches the average margin, weighted by units sold.",
  ],
  sections: [
    { title: "Engineering", route: "/menu", summary: "The four group tiles, the thresholds, every item with its units, mix, price, food cost, margin and contribution, and category totals.", details: ["Click a group or a category to filter the table.", "Narrow it to a franchisee, a region or a period with the controls above."] },
    { title: "Catalog", route: "/menu?tab=catalog", summary: "Head office builds the menu: categories, items with their sizes and recipe costs, and the groups of toppings and choices each item offers.", details: ["A toppings group can allow halves and light or extra, price each topping by size, and include toppings in the price.", "Removing an item or an option retires it, so past orders still name it."] },
    { title: "Offers", route: "/menu?tab=offers", summary: "Coupon codes and offers that apply by themselves: percent or amount off, free delivery, or a set price for a size.", details: ["An offer can be limited to days, order types, dates and a minimum order.", "Only the best offer applies to an order; a code wins over automatic offers."] },
    { title: "Branch menu", route: "/menu?tab=branch", summary: "One branch's prices and what it has run out of.", details: ["A branch price overrides the brand's for that branch only.", "Switching an item, size or topping off (86) removes it from the POS and the online menu at once."] },
  ],
  howToUse: [
    "Build the menu on Catalog, or import it on Network › Data › Import a file › Menu, with recipe costs.",
    "Open Menu Engineering and read the four groups.",
    "Open Plowhorses first: they are where a small price or cost change pays most.",
    "Check Puzzles with your marketing team: they need visibility, not a new recipe.",
  ],
  benefits: [
    "Every item's real margin, not only its sales.",
    "A clear action per item.",
    "The same method across every branch and franchise.",
  ],
  goodToKnow: [
    "Items without a recipe cost are left out of the groups until a cost arrives.",
    "Revenue is each line's total less its own discount.",
  ],
  related: ["network", "operations"],
});
