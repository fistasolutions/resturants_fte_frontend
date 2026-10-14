import { FileText, Share2 } from "lucide-react";

import { cn } from "@/lib/utils";
import type { AssetChannel, AssetStatus, SearchIntent } from "@/types/spotlight";

const STATUS: Record<AssetStatus, { label: string; className: string }> = {
  researching: { label: "Researching", className: "bg-muted text-muted-foreground" },
  drafting: { label: "Drafting", className: "bg-secondary text-secondary-foreground" },
  in_review: { label: "In review", className: "bg-warning/10 text-warning" },
  approved: { label: "Approved", className: "bg-success/10 text-success" },
  published: { label: "Published", className: "bg-success/10 text-success" },
  needs_changes: { label: "Needs changes", className: "bg-destructive/10 text-destructive" },
};

const CHANNEL: Record<AssetChannel, { label: string; Icon: typeof FileText }> = {
  blog: { label: "Blog", Icon: FileText },
  linkedin: { label: "LinkedIn", Icon: Share2 },
};

const INTENT: Record<SearchIntent, string> = {
  informational: "Informational",
  commercial: "Commercial",
  transactional: "Transactional",
  navigational: "Navigational",
};

const pillBase =
  "inline-flex h-5 w-fit shrink-0 items-center gap-1 rounded-4xl px-2 text-[0.6875rem] font-medium whitespace-nowrap";

export function StatusPill({ status }: { status: AssetStatus }) {
  const meta = STATUS[status];
  return <span className={cn(pillBase, meta.className)}>{meta.label}</span>;
}

export function ChannelBadge({ channel }: { channel: AssetChannel }) {
  const { label, Icon } = CHANNEL[channel];
  return (
    <span className={cn(pillBase, "border border-border text-muted-foreground")}>
      <Icon className="size-3" aria-hidden />
      {label}
    </span>
  );
}

export function IntentPill({ intent }: { intent: SearchIntent }) {
  return <span className={cn(pillBase, "bg-muted text-foreground")}>{INTENT[intent]}</span>;
}
