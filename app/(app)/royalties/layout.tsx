import { notFound } from "next/navigation";

import { RestaurantShell } from "@/features/restaurant/restaurant-shell";
import { ROYALTIES_PAGE } from "@/lib/restaurant-pages";
import { getWorkspace } from "@/services/workspace";

/** SPEC-377: a restaurant brand's page — it exists only for an organization with the `restaurant`
 * feature, checked on the server before anything renders (the workspace read is cached). */
export default async function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  const workspace = await getWorkspace();
  if (!workspace.features.includes("restaurant")) notFound();
  return (
    <RestaurantShell base={ROYALTIES_PAGE.base} title={ROYALTIES_PAGE.title} description={ROYALTIES_PAGE.description} tabs={ROYALTIES_PAGE.tabs} periodTabs={ROYALTIES_PAGE.periodTabs}>
      {children}
    </RestaurantShell>
  );
}
