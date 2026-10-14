import type { Metadata } from "next";

import { AuthHeader } from "@/features/auth/auth-header";
import { VerifyForm } from "@/features/auth/verify-form";

export const metadata: Metadata = {
  title: "Confirm your email",
};

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const email = ((await searchParams).email ?? "").trim().toLowerCase();
  return (
    <div className="space-y-6">
      <AuthHeader
        title="Check your email"
        subtitle={
          email ? (
            <>
              We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>.
            </>
          ) : (
            "Enter the 6-digit code we emailed you."
          )
        }
      />
      <VerifyForm email={email} />
    </div>
  );
}
