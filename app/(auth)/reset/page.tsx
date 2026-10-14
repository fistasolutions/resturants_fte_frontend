import type { Metadata } from "next";

import { AuthHeader } from "@/features/auth/auth-header";
import { ResetForm } from "@/features/auth/reset-form";

export const metadata: Metadata = {
  title: "Set a new password",
};

export default async function ResetPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const email = ((await searchParams).email ?? "").trim().toLowerCase();
  return (
    <div className="space-y-6">
      <AuthHeader
        title="Set a new password"
        subtitle={
          email ? (
            <>
              If <span className="font-medium text-foreground">{email}</span> has an account,
              a code is on its way.
            </>
          ) : (
            "Enter the code we emailed you and a new password."
          )
        }
      />
      <ResetForm email={email} />
    </div>
  );
}
