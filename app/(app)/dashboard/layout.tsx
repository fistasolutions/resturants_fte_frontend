import { DashboardShell } from "@/features/dashboard/dashboard-shell";
import { getGreeting } from "@/utils/format";
import { getWorkspace } from "@/services/workspace";

/**
 * Persistent header for the Dashboard (SPEC-232). The greeting is computed here, on
 * the server, so it is painted with the header on the very first byte and never
 * waits on a query.
 */
export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // SPEC-319: the hour in the store's timezone; the workspace read is the app layout's own
  // (request-cached), so this adds no round trip.
  const { timezone } = await getWorkspace();
  return <DashboardShell greeting={getGreeting(new Date(), timezone ?? undefined)}>{children}</DashboardShell>;
}
