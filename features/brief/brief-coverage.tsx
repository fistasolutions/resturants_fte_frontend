import Link from "next/link";

import { BriefDot, BriefPanel, BriefRow, type DotTone } from "@/features/brief/brief-panel";
import type { BriefCoverageItem, CoverageStatus } from "@/types/brief";

interface BriefCoverageProps {
  coverage: BriefCoverageItem[];
}

const STATUS_CONFIG: Record<
  CoverageStatus,
  { label: string; dot: DotTone; text: string; live?: boolean }
> = {
  live: { label: "Live", dot: "ok", text: "text-success", live: true },
  delayed: { label: "Delayed", dot: "warn", text: "text-warning" },
  error: { label: "Error", dot: "error", text: "text-destructive" },
  off: { label: "Not connected", dot: "neutral", text: "text-muted-foreground" },
};

/** Compact "X ago" from an ISO timestamp — computed at render (no ticking). */
function agoLabel(iso: string | null): string | null {
  if (!iso) return null;
  const secs = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 90) return "just now";
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

function CoverageRow({ item }: { item: BriefCoverageItem }) {
  const config = STATUS_CONFIG[item.status];
  const ago = agoLabel(item.last_sync_at);
  return (
    <BriefRow
      align="center"
      className="py-2"
      leading={<BriefDot tone={config.dot} live={config.live} />}
      trailing={
        <p className={`text-xs font-medium ${config.text}`}>
          {config.label}
          {ago ? <span className="font-normal text-muted-foreground/70"> · {ago}</span> : null}
        </p>
      }
    >
      <p className="truncate text-sm font-medium leading-snug">{item.name}</p>
      <p className="truncate text-xs leading-snug text-muted-foreground">{item.detail}</p>
    </BriefRow>
  );
}

export function BriefCoverage({ coverage }: BriefCoverageProps) {
  if (coverage.length === 0) return null;
  const liveCount = coverage.filter((c) => c.status === "live").length;
  return (
    <BriefPanel
      title="Integration Health"
      count={`${liveCount}/${coverage.length} live`}
      aside={
        /* SPEC-228: this panel answers "are the five integrations connected".
           The other eighteen scheduled jobs are the same question asked of the
           platform itself, so it links out rather than growing a second panel. */
        <Link
          href="/system"
          className="rounded outline-none underline-offset-2 hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring"
        >
          All scheduled jobs
        </Link>
      }
    >
      {coverage.map((item) => (
        <CoverageRow key={item.key} item={item} />
      ))}
    </BriefPanel>
  );
}
