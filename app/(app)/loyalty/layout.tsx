import { notFound } from "next/navigation";

import { RestaurantShell } from "@/features/restaurant/restaurant-shell";
import { LOYALTY_PAGE } from "@/lib/restaurant-pages";
import { getWorkspace } from "@/services/workspace";

/** SPEC-383: a restaurant brand's page — only for an organization with the `restaurant` feature. */
export default async function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  const workspace = await getWorkspace();
  if (!workspace.features.includes("restaurant")) notFound();
  return (
    <RestaurantShell base={LOYALTY_PAGE.base} title={LOYALTY_PAGE.title} description={LOYALTY_PAGE.description} tabs={LOYALTY_PAGE.tabs} periodTabs={LOYALTY_PAGE.periodTabs} filters={false}>
      {children}
    </RestaurantShell>
  );
}
