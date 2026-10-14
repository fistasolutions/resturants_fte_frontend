import { BriefShell } from "@/features/brief/brief-shell";
import { getGreeting } from "@/utils/format";
import { getWorkspace } from "@/services/workspace";

/** Persistent top bar for the Morning Brief (SPEC-232). The greeting is computed
 * here, on the server, so it is painted with the first byte. */
export default async function BriefLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // SPEC-319: the hour in the store's timezone; the workspace read is the app layout's own
  // (request-cached), so this adds no round trip.
  const { timezone } = await getWorkspace();
  return <BriefShell greeting={getGreeting(new Date(), timezone ?? undefined)}>{children}</BriefShell>;
}
