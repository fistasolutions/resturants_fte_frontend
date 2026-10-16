import { notFound } from "next/navigation";

import { RestaurantShell } from "@/features/restaurant/restaurant-shell";
import { REPUTATION_PAGE } from "@/lib/restaurant-pages";
import { getWorkspace } from "@/services/workspace";

/** SPEC-390: a restaurant brand's employee — only for an organization with the `restaurant` feature. */
export default async function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  const workspace = await getWorkspace();
  if (!workspace.features.includes("restaurant")) notFound();
  return (
    <RestaurantShell base={REPUTATION_PAGE.base} title={REPUTATION_PAGE.title} description={REPUTATION_PAGE.description} periodTabs={REPUTATION_PAGE.periodTabs} filters={false}>
      {children}
    </RestaurantShell>
  );
}
