import {
  Ban,
  Megaphone,
  Rocket,
  Search,
  Share2,
  ShieldCheck,
  Tag,
  Telescope,
  TrendingUp,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type {
  AdChannel,
  CampaignStatus,
  CreativeSource,
  GateActionKind,
  RecommendationKind,
} from "@/types/ads";

/**
 * Performance Ads chips (SPEC-111). Channel identity is name + a lucide icon
 * only — NEVER a platform brand color (root Rule 9). Status/reason coloring
 * uses `--success`/`--warning`/`--destructive` status tokens and neutrals;
 * brand red is never used.
 */

const pillBase =
  "inline-flex h-5 w-fit shrink-0 items-center gap-1 rounded-4xl px-2 text-[0.6875rem] font-medium whitespace-nowrap";

const CHANNEL: Record<AdChannel, { label: string; Icon: typeof Megaphone }> = {
  meta: { label: "Meta", Icon: Megaphone },
  google: { label: "Google", Icon: Search },
};

export function ChannelBadge({
  channel,
  className,
}: {
  channel: AdChannel;
  className?: string;
}) {
  const { label, Icon } = CHANNEL[channel];
  return (
    <span className={cn(pillBase, "border border-border text-muted-foreground", className)}>
      <Icon className="size-3" aria-hidden />
      {label}
    </span>
  );
}

export function channelLabel(channel: AdChannel): string {
  return CHANNEL[channel].label;
}

const STATUS: Record<CampaignStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
  pending_approval: {
    label: "Pending approval",
    className: "bg-warning/10 text-warning",
  },
  live: { label: "Live", className: "bg-success/10 text-success" },
  paused: { label: "Paused", className: "bg-secondary text-secondary-foreground" },
  capped: { label: "Capped", className: "bg-destructive/10 text-destructive" },
};

export function StatusPill({
  status,
  className,
}: {
  status: CampaignStatus;
  className?: string;
}) {
  const meta = STATUS[status];
  return <span className={cn(pillBase, meta.className, className)}>{meta.label}</span>;
}

const REASON: Record<
  RecommendationKind,
  { label: string; className: string; Icon: typeof TrendingUp }
> = {
  scale_winner: {
    label: "Scale a winner",
    className: "bg-success/10 text-success",
    Icon: TrendingUp,
  },
  clear_dead_stock: {
    label: "Clear dead stock",
    className: "bg-warning/10 text-warning",
    Icon: Tag,
  },
  defend_branded: {
    label: "Defend branded search",
    className: "bg-secondary text-secondary-foreground",
    Icon: ShieldCheck,
  },
};

export function ReasonChip({
  reason,
  className,
}: {
  reason: RecommendationKind;
  className?: string;
}) {
  const { label, className: tone, Icon } = REASON[reason];
  return (
    <span className={cn(pillBase, tone, className)}>
      <Icon className="size-3" aria-hidden />
      {label}
    </span>
  );
}

const GATE_ACTION: Record<
  GateActionKind,
  { label: string; Icon: typeof Rocket }
> = {
  launch_campaign: { label: "Launch campaign", Icon: Rocket },
  raise_budget: { label: "Raise budget", Icon: TrendingUp },
  expand_audience: { label: "Expand audience", Icon: Users },
};

export function GateActionPill({
  action,
  className,
}: {
  action: GateActionKind;
  className?: string;
}) {
  const { label, Icon } = GATE_ACTION[action];
  return (
    <span className={cn(pillBase, "bg-secondary text-secondary-foreground", className)}>
      <Icon className="size-3" aria-hidden />
      {label}
    </span>
  );
}

const SOURCE: Record<
  CreativeSource,
  { label: string; Icon: typeof Share2 }
> = {
  social: { label: "From Social Media Manager", Icon: Share2 },
  spotlight: { label: "From Search Visibility", Icon: Telescope },
};

export function ProvenanceChip({
  source,
  className,
}: {
  source: CreativeSource;
  className?: string;
}) {
  const { label, Icon } = SOURCE[source];
  return (
    <span className={cn(pillBase, "bg-muted text-muted-foreground", className)}>
      <Icon className="size-3" aria-hidden />
      {label}
    </span>
  );
}

/** Small neutral "gated" marker reused wherever we remind the user spend is
 * capped. Uses the ban glyph to signal "nothing spends unchecked". */
export function GatedTag({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        pillBase,
        "border border-border text-muted-foreground",
        className,
      )}
    >
      <Ban className="size-3" aria-hidden />
      Gated
    </span>
  );
}
