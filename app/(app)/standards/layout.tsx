import { notFound } from "next/navigation";

import { RestaurantShell } from "@/features/restaurant/restaurant-shell";
import { STANDARDS_PAGE } from "@/lib/restaurant-pages";
import { getWorkspace } from "@/services/workspace";

/** SPEC-392: a restaurant brand's employee — only for an organization with the `restaurant` feature. */
export default async function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  const workspace = await getWorkspace();
  if (!workspace.features.includes("restaurant")) notFound();
  return (
    <RestaurantShell base={STANDARDS_PAGE.base} title={STANDARDS_PAGE.title} description={STANDARDS_PAGE.description} periodTabs={STANDARDS_PAGE.periodTabs} filters={false}>
      {children}
    </RestaurantShell>
  );
}
