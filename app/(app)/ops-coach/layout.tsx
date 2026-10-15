import { notFound } from "next/navigation";

import { RestaurantShell } from "@/features/restaurant/restaurant-shell";
import { OPS_COACH_PAGE } from "@/lib/restaurant-pages";
import { getWorkspace } from "@/services/workspace";

/** SPEC-385: a restaurant brand's employee — only for an organization with the `restaurant` feature. */
export default async function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  const workspace = await getWorkspace();
  if (!workspace.features.includes("restaurant")) notFound();
  return (
    <RestaurantShell base={OPS_COACH_PAGE.base} title={OPS_COACH_PAGE.title} description={OPS_COACH_PAGE.description} periodTabs={OPS_COACH_PAGE.periodTabs} filters={false}>
      {children}
    </RestaurantShell>
  );
}
