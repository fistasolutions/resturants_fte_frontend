import type { Metadata } from "next";

import { AuthHeader } from "@/features/auth/auth-header";
import { ForgotForm } from "@/features/auth/forgot-form";

export const metadata: Metadata = {
  title: "Reset your password",
};

export default function ForgotPage() {
  return (
    <div className="space-y-6">
      <AuthHeader
        title="Reset your password"
        subtitle="We'll email you a code to set a new one."
      />
      <ForgotForm />
    </div>
  );
}
