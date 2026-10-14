"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { returnLabel } from "@/lib/recipient-settings";

/** The way back to the page a deep link came from (SPEC-234) — a plain link,
 * so browser history stays truthful and Back works without it too. */
export function ReturnLink({ returnTo }: { returnTo: string }) {
  return (
    <Button variant="ghost" size="sm" asChild>
      <Link href={returnTo}>
        <ArrowLeft className="size-4" aria-hidden />
        {returnLabel(returnTo)}
      </Link>
    </Button>
  );
}
