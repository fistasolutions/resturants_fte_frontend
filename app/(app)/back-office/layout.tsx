import { notFound } from "next/navigation";

import { RestaurantShell } from "@/features/restaurant/restaurant-shell";
import { BACK_OFFICE_PAGE } from "@/lib/restaurant-pages";
import { getWorkspace } from "@/services/workspace";

/** SPEC-394: a restaurant brand's page — only for an organization with the `restaurant` feature. */
export default async function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  const workspace = await getWorkspace();
  if (!workspace.features.includes("restaurant")) notFound();
  return (
    <RestaurantShell base={BACK_OFFICE_PAGE.base} title={BACK_OFFICE_PAGE.title} description={BACK_OFFICE_PAGE.description} tabs={BACK_OFFICE_PAGE.tabs} periodTabs={BACK_OFFICE_PAGE.periodTabs} filters={false}>
      {children}
    </RestaurantShell>
  );
}
