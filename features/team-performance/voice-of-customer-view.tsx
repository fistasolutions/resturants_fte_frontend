import { MessageSquareText, Smile, TrendingUp } from "lucide-react";

import { Card } from "@/components/ui/card";
import { ExplainButton } from "@/features/chat/explain-button";
import type { VoiceOfCustomer, VoiceOfCustomerTheme } from "@/types/gorgias";
import { formatNumber } from "@/utils/format";

function Tile({
  icon,
  label,
  value,
  sub,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  tone?: "default" | "success";
}) {
  const ring = tone === "success" ? "border-success/30 bg-success/5" : "border-border bg-card";
  const iconTone = tone === "success" ? "text-success" : "text-muted-foreground";
  return (
    <Card className={`gap-1 border px-4 py-3 ${ring}`}>
      <div className="flex items-center gap-1.5">
        <span className={iconTone}>{icon}</span>
        <p className="min-w-0 flex-1 text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
          {label}
        </p>
        <ExplainButton placement="inline" target={{ metric: label, value, detail: sub }} />
      </div>
      <p className="truncate text-lg font-semibold leading-tight">{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </Card>
  );
}

function TrendChip({ delta }: { delta: number }) {
  if (delta === 0) return <span className="text-xs text-muted-foreground">flat</span>;
  const up = delta > 0;
  return (
    <span className={`text-xs font-medium ${up ? "text-success" : "text-muted-foreground"}`}>
      {up ? "▲" : "▼"} {Math.abs(delta)} vs last period
    </span>
  );
}

function csatTone(score: number | null): string {
  if (score == null) return "text-muted-foreground";
  if (score >= 4) return "text-success";
  if (score >= 3) return "text-warning";
  return "text-destructive";
}

export function VoiceOfCustomerView({ data }: { data: VoiceOfCustomer | null }) {
  if (!data || data.classified === 0) {
    return (
      <Card className="flex flex-col items-center gap-3 px-6 py-12 text-center">
        <MessageSquareText className="size-8 text-muted-foreground" aria-hidden />
        <p className="text-sm font-medium">No recognisable customer questions in this period.</p>
        <p className="max-w-md text-sm text-muted-foreground">
          Themes are read from support-conversation subjects. Widen the date range, or check
          back once more conversations have synced.
        </p>
      </Card>
    );
  }

  const top = data.themes[0];
  const max = Math.max(...data.themes.map((t) => t.count), 1);
  const worstCsat = data.themes
    .filter((t) => t.avg_satisfaction != null)
    .sort((a, b) => (a.avg_satisfaction ?? 5) - (b.avg_satisfaction ?? 5))[0];

  return (
    <div className="space-y-4">
      {/* Insight tiles */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Tile
          icon={<MessageSquareText className="size-4" aria-hidden />}
          label="Top question"
          value={top.reason}
          sub={`${formatNumber(top.count)} conversations${top.share != null ? ` · ${Math.round(top.share * 100)}%` : ""}`}
        />
        {data.top_rising ? (
          <Tile
            tone="success"
            icon={<TrendingUp className="size-4" aria-hidden />}
            label="Rising fastest"
            value={data.top_rising.reason}
            sub={`+${data.top_rising.delta} vs last period`}
          />
        ) : (
          <Tile
            icon={<TrendingUp className="size-4" aria-hidden />}
            label="Questions classified"
            value={formatNumber(data.classified)}
            sub={`of ${formatNumber(data.total_tickets)} conversations`}
          />
        )}
        {worstCsat && worstCsat.avg_satisfaction != null && (
          <Tile
            icon={<Smile className="size-4" aria-hidden />}
            label="Unhappiest about"
            value={worstCsat.reason}
            sub={`${worstCsat.avg_satisfaction.toFixed(1)} CSAT`}
          />
        )}
      </div>

      {/* Ranked themes */}
      <Card className="gap-3 px-4 py-4 md:px-6 md:py-5">
        <div>
          <p className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
            What customers are asking
          </p>
          <h2 className="text-sm font-semibold">Demand &amp; pain themes this period</h2>
        </div>
        <ul className="space-y-2.5">
          {data.themes.map((t: VoiceOfCustomerTheme) => (
            <li key={t.reason} className="flex flex-wrap items-center gap-3">
              <span className="w-44 shrink-0 text-sm font-medium">{t.reason}</span>
              <div className="h-2 min-w-[80px] flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.max((t.count / max) * 100, 3)}%` }}
                />
              </div>
              <span className="w-12 shrink-0 text-right text-sm font-semibold tabular-nums">
                {formatNumber(t.count)}
              </span>
              <span className="w-28 shrink-0 text-right">
                <TrendChip delta={t.delta} />
              </span>
              <span className={`w-16 shrink-0 text-right text-xs tabular-nums ${csatTone(t.avg_satisfaction)}`}>
                {t.avg_satisfaction != null ? `${t.avg_satisfaction.toFixed(1)} ★` : "—"}
              </span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">
          Themes are derived from conversation subjects ({formatNumber(data.classified)} of{" "}
          {formatNumber(data.total_tickets)} recognised this period). Bar = volume, ★ = average
          CSAT for that theme. Aggregated only — no customer names or messages.
        </p>
      </Card>
    </div>
  );
}
