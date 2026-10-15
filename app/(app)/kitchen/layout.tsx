import { notFound } from "next/navigation";

import { RestaurantShell } from "@/features/restaurant/restaurant-shell";
import { KITCHEN_PAGE } from "@/lib/restaurant-pages";
import { getWorkspace } from "@/services/workspace";

/** SPEC-379: a restaurant brand's page — only for an organization with the `restaurant` feature. */
export default async function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  const workspace = await getWorkspace();
  if (!workspace.features.includes("restaurant")) notFound();
  return (
    <RestaurantShell base={KITCHEN_PAGE.base} title={KITCHEN_PAGE.title} description={KITCHEN_PAGE.description} tabs={KITCHEN_PAGE.tabs} periodTabs={KITCHEN_PAGE.periodTabs} filters={false}>
      {children}
    </RestaurantShell>
  );
}
