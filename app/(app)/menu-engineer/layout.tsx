import { notFound } from "next/navigation";

import { RestaurantShell } from "@/features/restaurant/restaurant-shell";
import { MENU_ENGINEER_PAGE } from "@/lib/restaurant-pages";
import { getWorkspace } from "@/services/workspace";

/** SPEC-391: a restaurant brand's employee — only for an organization with the `restaurant` feature. */
export default async function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  const workspace = await getWorkspace();
  if (!workspace.features.includes("restaurant")) notFound();
  return (
    <RestaurantShell base={MENU_ENGINEER_PAGE.base} title={MENU_ENGINEER_PAGE.title} description={MENU_ENGINEER_PAGE.description} periodTabs={MENU_ENGINEER_PAGE.periodTabs} filters={false}>
      {children}
    </RestaurantShell>
  );
}
