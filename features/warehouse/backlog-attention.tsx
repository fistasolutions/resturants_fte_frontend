import Link from "next/link";
import { Mail, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { BacklogAttention } from "@/types/warehouse";

/** Warehouse backlog supervision card (SPEC-147): when the fulfillment backlog is
 * aging, say why and give a one-click email to the warehouse manager. State · Reason ·
 * Action — the same ladder Discounts uses. Backend-computed; no entrance animation. */
export function BacklogAttentionCard({ attention }: { attention: BacklogAttention }) {
  if (!attention.needs_attention) return null;
  const red = attention.severity === "red";
  const tone = red ? "border-destructive/30 bg-destructive/5" : "border-warning/30 bg-warning/5";
  const iconTone = red ? "text-destructive" : "text-warning";

  return (
    <Card className={`flex-row flex-wrap items-center justify-between gap-3 border p-4 ${tone}`}>
      <div className="flex min-w-0 items-start gap-2.5">
        <span className={`mt-0.5 shrink-0 ${iconTone}`}>
          <TriangleAlert className="size-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{attention.why}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Email the warehouse manager to clear it — you&apos;ll see the backlog come down in Results.
          </p>
        </div>
      </div>
      <Button size="sm" asChild>
        <Link href="/warehouse/backlog/send">
          <Mail className="size-4" aria-hidden />
          Email warehouse manager
        </Link>
      </Button>
    </Card>
  );
}
