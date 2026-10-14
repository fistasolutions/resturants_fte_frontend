import type { Metadata } from "next";

import { AuthHeader } from "@/features/auth/auth-header";
import { RestoreView } from "@/features/auth/restore-view";
import { plausibleRestoreToken } from "@/lib/organization-lifecycle";

export const metadata: Metadata = {
  title: "Restore your organization",
};

/** The link in a deletion email (SPEC-332): open signed in or not — the token is the credential. */
export default async function RestorePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <div className="space-y-6">
      <AuthHeader
        title="Restore your organization"
        subtitle="It was scheduled for deletion. Restoring brings back every store, member and chat."
      />
      <RestoreView token={plausibleRestoreToken(token) ? token : null} />
    </div>
  );
}
