import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { AuthHeader } from "@/features/auth/auth-header";
import { installProblemText } from "@/lib/shopify-install";

export const metadata: Metadata = {
  title: "Installing from Shopify",
};

/** Where an install from Shopify ends when it could not finish (SPEC-344): what happened, in
 * words, and the way forward. Open signed in or not. */
export default async function ShopifyInstallPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  const { title, body } = installProblemText(reason);
  return (
    <div className="space-y-6">
      <AuthHeader title={title} subtitle={body} />
      <div className="flex flex-col gap-2">
        <Button asChild className="w-full">
          <Link href="https://admin.shopify.com" prefetch={false}>
            Back to Shopify
          </Link>
        </Button>
        <Button asChild variant="outline" className="w-full">
          <Link href="/login" prefetch={false}>
            Sign in to ftes
          </Link>
        </Button>
      </div>
    </div>
  );
}
