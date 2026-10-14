import { notFound } from "next/navigation";

import { CiShell } from "@/features/ci/ci-shell";
import { getWorkspace } from "@/services/workspace";

/** SPEC-323: the reports are the first client's own history, so the section exists only for an
 * organization with the `ci` feature — checked here, on the server, before anything renders. The
 * workspace is the app layout's read, cached for the request; an unreadable one is empty, so the
 * section stays closed. */
export default async function CiLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const workspace = await getWorkspace();
  if (!workspace.features.includes("ci")) notFound();
  return <CiShell>{children}</CiShell>;
}
