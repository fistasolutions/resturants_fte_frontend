import { notFound } from "next/navigation";

import { RestaurantShell } from "@/features/restaurant/restaurant-shell";
import { NETWORK_PAGE } from "@/lib/restaurant-pages";
import { getWorkspace } from "@/services/workspace";

/** SPEC-377: a restaurant brand's page — it exists only for an organization with the `restaurant`
 * feature, checked on the server before anything renders (the workspace read is cached). */
export default async function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  const workspace = await getWorkspace();
  if (!workspace.features.includes("restaurant")) notFound();
  return (
    <RestaurantShell base={NETWORK_PAGE.base} title={NETWORK_PAGE.title} description={NETWORK_PAGE.description} tabs={NETWORK_PAGE.tabs} periodTabs={NETWORK_PAGE.periodTabs}>
      {children}
    </RestaurantShell>
  );
}
