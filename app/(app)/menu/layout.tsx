import { notFound } from "next/navigation";

import { RestaurantShell } from "@/features/restaurant/restaurant-shell";
import { MENU_PAGE } from "@/lib/restaurant-pages";
import { getWorkspace } from "@/services/workspace";

/** SPEC-377: a restaurant brand's page — it exists only for an organization with the `restaurant`
 * feature, checked on the server before anything renders (the workspace read is cached). */
export default async function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  const workspace = await getWorkspace();
  if (!workspace.features.includes("restaurant")) notFound();
  return (
    <RestaurantShell base={MENU_PAGE.base} title={MENU_PAGE.title} description={MENU_PAGE.description} tabs={MENU_PAGE.tabs} periodTabs={MENU_PAGE.periodTabs}>
      {children}
    </RestaurantShell>
  );
}
