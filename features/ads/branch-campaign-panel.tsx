"use client";

import { useState } from "react";
import { Check, Copy, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useApiQuery } from "@/hooks/use-api-query";
import { liftSentence, liftTone } from "@/lib/branch-lift";
import { adsQueries } from "@/lib/queries/ads";
import { cn } from "@/lib/utils";
import type { Campaign } from "@/types/ads";
import { formatCurrency } from "@/utils/format";

const TONE = { up: "text-success", down: "text-destructive", flat: "text-muted-foreground" } as const;

/** A restaurant brand's campaign (SPEC-387): its branch, the link the ad must use, and the branch's
 * sales since launch against the days before. Nothing shows for a shop's campaign. */
export function BranchCampaignPanel({ campaign }: { campaign: Campaign }) {
  const [copied, setCopied] = useState(false);
  const lift = useApiQuery(campaign.branchId != null ? adsQueries.branchLift(campaign.id) : null);
  if (!campaign.trackingLink && campaign.branchId == null) return null;

  const copy = async () => {
    if (!campaign.trackingLink) return;
    const url = new URL(campaign.trackingLink, window.location.origin).toString();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="mt-3 space-y-2 border-t border-border pt-3 text-xs">
      {campaign.branchName ? (
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground">
          <span className="inline-flex items-center gap-1 font-medium text-foreground">
            <MapPin className="size-3" aria-hidden /> {campaign.branchName}
          </span>
          {lift.data ? (
            <span>
              {formatCurrency(lift.data.during.netSales)} from {lift.data.during.orders} orders ·{" "}
              <span className={cn("font-medium", TONE[liftTone(lift.data)])}>{liftSentence(lift.data)}</span>
            </span>
          ) : lift.isError ? (
            <span>Branch sales unavailable right now.</span>
          ) : null}
        </p>
      ) : null}
      {campaign.trackingLink ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground">Ad link</span>
          <code className="min-w-0 max-w-full truncate rounded-md bg-muted px-2 py-1 text-foreground">
            {campaign.trackingLink}
          </code>
          <Button type="button" size="sm" variant="outline" onClick={() => void copy()} aria-label="Copy the ad link">
            {copied ? <Check aria-hidden /> : <Copy aria-hidden />} {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
