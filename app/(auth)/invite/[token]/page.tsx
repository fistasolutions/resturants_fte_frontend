import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";

import { AuthHeader } from "@/features/auth/auth-header";
import { InviteView } from "@/features/auth/invite-view";
import { SESSION_COOKIE } from "@/lib/session";
import type { InvitationPreview } from "@/services/auth";

export const metadata: Metadata = {
  title: "Your invitation",
};

const API_URL = process.env.API_URL ?? "http://localhost:8000";

async function preview(token: string): Promise<InvitationPreview | null> {
  try {
    const response = await fetch(
      `${API_URL}/api/v1/auth/invitations/${encodeURIComponent(token)}`,
      { cache: "no-store" },
    );
    if (!response.ok) return null;
    const data = await response.json();
    return {
      organizationName: data.organization_name,
      organizationSlug: data.organization_slug,
      email: data.email,
      roleName: data.role_name,
      hasAccount: data.has_account,
    };
  } catch {
    return null;
  }
}

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invitation = await preview(token);
  const signedIn = (await cookies()).has(SESSION_COOKIE);
  if (!invitation) {
    return (
      <div className="space-y-6">
        <AuthHeader
          title="This invitation has expired"
          subtitle="It was used, withdrawn, or is older than 7 days. Ask for a new one."
        />
        <Link href="/login" className="text-sm font-medium underline-offset-4 hover:underline">
          Go to sign in
        </Link>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <AuthHeader title={`Join ${invitation.organizationName}`} subtitle="Your team is waiting." />
      <InviteView token={token} preview={invitation} signedIn={signedIn} />
    </div>
  );
}
