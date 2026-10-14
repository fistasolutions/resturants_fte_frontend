import { Camera, CircleDot, Globe, Music2, Pin, RectangleVertical, Smartphone, Square, Star, Tag, ThumbsUp, TrendingUp } from "lucide-react";

import { cn } from "@/lib/utils";
import { statusMeta, type StatusTone } from "@/lib/social-post";
import type { CreativeFormat, ReasonKind, SocialChannel } from "@/types/social";
import type { IconComponent } from "@/components/shared/glisp-icon";

/** Title-case a free-form backend token: "tiktok" → "Tiktok", "dead_stock" →
 * "Dead stock". Used only for graceful fallback on values outside our enums. */
function titleCase(value: string): string {
  const cleaned = value.replace(/_/g, " ").trim();
  return cleaned ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1) : cleaned;
}

/**
 * Social Growth chips (SPEC-110). Channel identity is name + lucide icon only —
 * NEVER a platform brand color (root Rule 9). Status/reason coloring uses
 * `--success`/`--warning` status tokens and neutrals; brand red is never used.
 */

const pillBase =
  "inline-flex h-5 w-fit shrink-0 items-center gap-1 rounded-4xl px-2 text-[0.6875rem] font-medium whitespace-nowrap";

const CHANNEL: Record<SocialChannel, { label: string; Icon: typeof Camera }> = {
  instagram: { label: "Instagram", Icon: Camera },
  tiktok: { label: "TikTok", Icon: Music2 },
  facebook: { label: "Facebook", Icon: ThumbsUp },
  pinterest: { label: "Pinterest", Icon: Pin },
};

export function ChannelBadge({
  channel,
  className,
}: {
  /** The live contract sends a free-form string; unknown values degrade to a
   * globe glyph + title-cased label rather than crashing on a missing key. */
  channel: SocialChannel | string;
  className?: string;
}) {
  const { label, Icon } = CHANNEL[channel as SocialChannel] ?? {
    label: titleCase(channel),
    Icon: Globe,
  };
  return (
    <span className={cn(pillBase, "border border-border text-muted-foreground", className)}>
      <Icon className="size-3" aria-hidden />
      {label}
    </span>
  );
}

export function channelLabel(channel: SocialChannel | string): string {
  return CHANNEL[channel as SocialChannel]?.label ?? titleCase(channel);
}

const FORMAT: Record<
  CreativeFormat,
  { label: string; ratioLabel: string; ratio: string; Icon: typeof Square }
> = {
  feed: { label: "Feed", ratioLabel: "4:5", ratio: "4 / 5", Icon: RectangleVertical },
  story: { label: "Story / Reel", ratioLabel: "9:16", ratio: "9 / 16", Icon: Smartphone },
  square: { label: "Square", ratioLabel: "1:1", ratio: "1 / 1", Icon: Square },
};

export function formatMeta(format: CreativeFormat) {
  return FORMAT[format];
}

export function FormatPill({
  format,
  className,
}: {
  format: CreativeFormat;
  className?: string;
}) {
  const { label, ratioLabel, Icon } = FORMAT[format];
  return (
    <span className={cn(pillBase, "bg-muted text-foreground", className)}>
      <Icon className="size-3" aria-hidden />
      {label} · {ratioLabel}
    </span>
  );
}

const REASON: Record<
  ReasonKind,
  { label: string; className: string; Icon: IconComponent }
> = {
  best_seller: {
    label: "Best-seller momentum",
    className: "bg-success/10 text-success",
    Icon: TrendingUp,
  },
  new_drop: {
    label: "New drop",
    className: "bg-secondary text-secondary-foreground",
    Icon: Star,
  },
  dead_stock: {
    label: "Clear dead stock",
    className: "bg-warning/10 text-warning",
    Icon: Tag,
  },
};

export function ReasonChip({
  reason,
  className,
}: {
  /** Free-form in the live contract; unknown reasons fall back to a neutral chip. */
  reason: ReasonKind | string;
  className?: string;
}) {
  const { label, className: tone, Icon } = REASON[reason as ReasonKind] ?? {
    label: titleCase(reason),
    className: "bg-muted text-muted-foreground",
    Icon: CircleDot,
  };
  return (
    <span className={cn(pillBase, tone, className)}>
      <Icon className="size-3" aria-hidden />
      {label}
    </span>
  );
}

/** Post-workflow status chip (SPEC-138) — shared by `PostDetail`, `PostCard`, and
 * the Weekly Plan history. Status tones use `--success`/`--warning`/neutral
 * tokens only; brand red is never used for status (Rule 9). */
const STATUS_TONE_CLASS: Record<StatusTone, string> = {
  review: "bg-secondary text-secondary-foreground",
  changes: "bg-warning/10 text-warning",
  success: "bg-success/10 text-success",
  neutral: "bg-muted text-muted-foreground",
};

export function PostStatusChip({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const { label, tone } = statusMeta(status);
  return (
    <span className={cn(pillBase, STATUS_TONE_CLASS[tone], className)}>{label}</span>
  );
}
