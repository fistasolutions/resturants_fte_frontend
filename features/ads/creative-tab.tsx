import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatRoas, roasTone, type RoasTone } from "@/lib/ads";
import type { AdCreative, CreativeData } from "@/types/ads";
import { formatCurrency } from "@/utils/format";

import { AdCreativePreview, SearchAdPreview } from "./ad-creative-preview";
import { ChannelBadge, ProvenanceChip } from "./ads-pills";

const ROAS_TONE: Record<RoasTone, string> = {
  strong: "text-success",
  steady: "text-foreground",
  weak: "text-destructive",
};

function PerformanceRow({ creative }: { creative: AdCreative }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-border pt-2 text-xs">
      <span className="text-muted-foreground">
        Spend <span className="text-foreground tabular-nums">{formatCurrency(creative.spent)}</span>
      </span>
      <span className="text-muted-foreground">
        ROAS{" "}
        <span className={cn("font-medium tabular-nums", ROAS_TONE[roasTone(creative.roas)])}>
          {formatRoas(creative.roas)}
        </span>
      </span>
    </div>
  );
}

function SocialCreativeCard({ creative }: { creative: AdCreative }) {
  return (
    <div className="flex flex-col gap-3 rounded-card border border-border p-4">
      <div className="flex flex-wrap items-center gap-2">
        <ProvenanceChip source={creative.source} />
        <ChannelBadge channel={creative.channel} />
      </div>
      <AdCreativePreview
        format={creative.format as "feed" | "story" | "square"}
        productName={creative.productName}
        headline={creative.headline}
      />
      <PerformanceRow creative={creative} />
    </div>
  );
}

function SearchCreativeCard({ creative }: { creative: AdCreative }) {
  return (
    <div className="flex flex-col gap-3 rounded-card border border-border p-4">
      <div className="flex flex-wrap items-center gap-2">
        <ProvenanceChip source={creative.source} />
        <ChannelBadge channel={creative.channel} />
      </div>
      <SearchAdPreview headline={creative.headline} keyword={creative.keyword} />
      <PerformanceRow creative={creative} />
    </div>
  );
}

export function CreativeTab({ data }: { data: CreativeData }) {
  const social = data.creatives.filter((c) => c.format !== "search");
  const search = data.creatives.filter((c) => c.format === "search");

  return (
    <div className="space-y-6">
      <div className="rounded-card border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
        Every ad reuses work the other Digital FTEs already did — paid-social
        creatives come from{" "}
        <span className="font-medium text-foreground">Social Media Manager</span>, search
        headlines and keywords from{" "}
        <span className="font-medium text-foreground">Search Visibility</span> — so nothing
        is generated twice.
      </div>

      <Card className="gap-4">
        <CardHeader>
          <CardTitle>Paid social creative</CardTitle>
          <p className="text-sm text-muted-foreground">
            Reused Social Media Manager posts, templated for Meta placements.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {social.map((creative) => (
              <SocialCreativeCard key={creative.id} creative={creative} />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="gap-4">
        <CardHeader>
          <CardTitle>Search ads</CardTitle>
          <p className="text-sm text-muted-foreground">
            Headlines and keywords sourced from Search Visibility, running on Google Search.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {search.map((creative) => (
              <SearchCreativeCard key={creative.id} creative={creative} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
