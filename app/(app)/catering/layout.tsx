import { notFound } from "next/navigation";

import { RestaurantShell } from "@/features/restaurant/restaurant-shell";
import { CATERING_PAGE } from "@/lib/restaurant-pages";
import { getWorkspace } from "@/services/workspace";

/** SPEC-391: a restaurant brand's employee — only for an organization with the `restaurant` feature. */
export default async function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  const workspace = await getWorkspace();
  if (!workspace.features.includes("restaurant")) notFound();
  return (
    <RestaurantShell base={CATERING_PAGE.base} title={CATERING_PAGE.title} description={CATERING_PAGE.description} periodTabs={CATERING_PAGE.periodTabs} filters={false}>
      {children}
    </RestaurantShell>
  );
}
