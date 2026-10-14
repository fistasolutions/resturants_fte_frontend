import type { Metadata } from "next";

import { AuthHeader } from "@/features/auth/auth-header";
import { LoginForm } from "@/features/auth/login-form";
import { safeNext } from "@/lib/auth-flows";

export const metadata: Metadata = {
  title: "Log in",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <div className="space-y-6">
      <AuthHeader title="Welcome back" subtitle="Sign in to see what's happening in your store." />
      <LoginForm next={safeNext(next)} />
    </div>
  );
}
