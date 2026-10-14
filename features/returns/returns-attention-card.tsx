"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Mail, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ReturnsAttention } from "@/types/returns";

/** Returns backlog supervision card (SPEC-149): when the returns queue is aging, say why
 * and give a one-click email to the returns lead. State · Reason · Action. Self-fetching
 * client card (like ActionPlanCard) so it never blocks the KPIs; renders nothing when the
 * queue is clean or the call fails. No entrance animation. */
export function ReturnsAttentionCard() {
  const [data, setData] = useState<ReturnsAttention | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/proxy/loop/returns/backlog/attention")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled) setData(d as ReturnsAttention | null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!data?.needs_attention) return null;
  const red = data.severity === "red";
  const tone = red ? "border-destructive/30 bg-destructive/5" : "border-warning/30 bg-warning/5";
  const iconTone = red ? "text-destructive" : "text-warning";

  return (
    <Card className={`flex-row flex-wrap items-center justify-between gap-3 border p-4 ${tone}`}>
      <div className="flex min-w-0 items-start gap-2.5">
        <span className={`mt-0.5 shrink-0 ${iconTone}`}>
          <TriangleAlert className="size-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{data.why}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Email the returns lead to clear it — you&apos;ll see the queue come down in Results.
          </p>
        </div>
      </div>
      <Button size="sm" variant={red ? "default" : "outline"} asChild>
        <Link href="/returns/backlog/send">
          <Mail className="size-4" aria-hidden />
          Email returns lead
        </Link>
      </Button>
    </Card>
  );
}
