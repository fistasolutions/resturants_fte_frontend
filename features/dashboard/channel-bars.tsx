import { Panel, PanelRow } from "@/components/shared/panel";
import type { ChannelShare } from "@/types/analytics";
import { formatPercent } from "@/utils/format";

/**
 * Sales by channel as rows with a proportional bar (SPEC-233) — four numbers do not
 * need a donut. The share is the backend's; the bar width is that share.
 */
export function ChannelBars({ channels }: { channels: ChannelShare[] }) {
  return (
    <Panel title="Sales by channel" count="by revenue">
      {channels.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-muted-foreground">No sales in this period</p>
      ) : (
        channels.map((entry) => (
          <PanelRow
            key={entry.channel}
            align="center"
            trailing={
              <p className="text-sm font-bold tabular-nums">{formatPercent(entry.share * 100)}</p>
            }
          >
            <p className="text-sm font-semibold leading-snug">{entry.channel}</p>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
              <div
                className="h-full rounded-full bg-foreground"
                style={{ width: `${Math.max(1, Math.min(100, entry.share * 100))}%` }}
              />
            </div>
          </PanelRow>
        ))
      )}
    </Panel>
  );
}
