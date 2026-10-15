import { notFound } from "next/navigation";

import { RestaurantShell } from "@/features/restaurant/restaurant-shell";
import { OPERATIONS_PAGE } from "@/lib/restaurant-pages";
import { getWorkspace } from "@/services/workspace";

/** SPEC-377: a restaurant brand's page — it exists only for an organization with the `restaurant`
 * feature, checked on the server before anything renders (the workspace read is cached). */
export default async function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  const workspace = await getWorkspace();
  if (!workspace.features.includes("restaurant")) notFound();
  return (
    <RestaurantShell base={OPERATIONS_PAGE.base} title={OPERATIONS_PAGE.title} description={OPERATIONS_PAGE.description} tabs={OPERATIONS_PAGE.tabs}>
      {children}
    </RestaurantShell>
  );
}
