import { notFound } from "next/navigation";

import { RestaurantShell } from "@/features/restaurant/restaurant-shell";
import { DEVELOPMENT_PAGE } from "@/lib/restaurant-pages";
import { getWorkspace } from "@/services/workspace";

/** SPEC-395: a restaurant brand's page — only for an organization with the `restaurant` feature. */
export default async function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  const workspace = await getWorkspace();
  if (!workspace.features.includes("restaurant")) notFound();
  return (
    <RestaurantShell base={DEVELOPMENT_PAGE.base} title={DEVELOPMENT_PAGE.title} description={DEVELOPMENT_PAGE.description} periodTabs={DEVELOPMENT_PAGE.periodTabs} filters={false}>
      {children}
    </RestaurantShell>
  );
}
