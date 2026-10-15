import { notFound } from "next/navigation";

import { RestaurantShell } from "@/features/restaurant/restaurant-shell";
import { POS_PAGE } from "@/lib/restaurant-pages";
import { getWorkspace } from "@/services/workspace";

/** SPEC-379: a restaurant brand's page — only for an organization with the `restaurant` feature. */
export default async function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  const workspace = await getWorkspace();
  if (!workspace.features.includes("restaurant")) notFound();
  return (
    <RestaurantShell base={POS_PAGE.base} title={POS_PAGE.title} description={POS_PAGE.description} periodTabs={POS_PAGE.periodTabs} filters={false}>
      {children}
    </RestaurantShell>
  );
}
