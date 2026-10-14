import { GlispIcon } from "@/components/shared/glisp-icon";
import { StatusDot } from "@/components/shared/panel";
import { ScoreTiles } from "@/features/report-fte/score-tiles";
import { splitLead } from "@/lib/report-fte";
import { cn } from "@/lib/utils";
import type { ReportSection, TableCell, ValueTone } from "@/types/report-fte";

const CELL_TONE: Record<ValueTone, string> = {
  neutral: "",
  good: "bg-success/15 text-success",
  warn: "bg-warning/15 text-warning",
  bad: "bg-destructive/15 text-destructive",
};

/**
 * One section of a composed report (SPEC-256): a KPI row, a table, a bar chart or
 * the AI's narrative — each headed by the tool that produced it and a grounded dot.
 * Values arrive formatted with their tone; nothing is computed here.
 */
export function ReportSectionView({ section }: { section: ReportSection }) {
  return (
    <section className="flex flex-col gap-2">
      <h4 className="flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
        {section.kind === "narrative" ? <GlispIcon className="size-3.5 text-ai" aria-hidden /> : null}
        {section.title}
        <code className="rounded bg-ai/10 px-1.5 py-0.5 font-mono text-[10px] font-medium text-ai">
          {section.tool}
        </code>
        <span className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <StatusDot tone={section.grounded ? "ok" : "warn"} />
          {section.grounded ? "grounded" : "could not be computed"}
        </span>
      </h4>
      {section.kind === "kpis" && section.kpis ? (
        <ScoreTiles tiles={section.kpis} columns={4} label={section.title} />
      ) : null}
      {section.kind === "table" && section.columns && section.rows ? (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table
            className="w-full text-left text-sm"
            style={{ minWidth: `${Math.max(440, section.columns.length * 130)}px` }}
          >
            <thead className="bg-muted/40">
              <tr>
                {section.columns.map((column) => (
                  <th
                    key={column.key}
                    className={cn(
                      "whitespace-nowrap px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground",
                      column.align === "right" && "text-right",
                    )}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {section.rows.map((row, index) => (
                <tr key={index} className="border-t border-border">
                  {section.columns!.map((column) => {
                    const cell: TableCell | undefined = row[column.key];
                    return (
                      <td
                        key={column.key}
                        className={cn(
                          "px-3 py-2 tabular-nums",
                          column.align === "right" && "text-right",
                          column.align === "left" && "font-medium text-foreground",
                        )}
                      >
                        {cell?.tone && cell.tone !== "neutral" ? (
                          <span className={cn("rounded-md px-1.5 py-0.5 text-xs font-semibold", CELL_TONE[cell.tone])}>
                            {cell.text}
                          </span>
                        ) : (
                          cell?.text ?? "—"
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {section.kind === "bars" && section.bars ? <Bars bars={section.bars} title={section.title} /> : null}
      {section.kind === "narrative" && section.narrative ? (
        <div className="flex flex-col gap-2">
          {section.narrative.map((paragraph) => {
            const { lead, rest } = splitLead(paragraph);
            return (
              <p key={paragraph} className="text-sm leading-relaxed text-muted-foreground">
                {lead ? <strong className="font-semibold text-foreground">{lead} </strong> : null}
                {rest}
              </p>
            );
          })}
        </div>
      ) : null}
      {section.note ? <p className="text-[11px] text-muted-foreground">{section.note}</p> : null}
    </section>
  );
}

const CHART_W = 640;
const LABEL_W = 200;
const ROW_H = 30;
const TOP = 24;

/** Horizontal bars drawn to one scale from the producer's shares (0–1 of the axis). */
function Bars({ bars, title }: { bars: NonNullable<ReportSection["bars"]>; title: string }) {
  const plotW = CHART_W - LABEL_W - 60;
  const height = TOP + bars.items.length * ROW_H + 22;
  return (
    <svg
      viewBox={`0 0 ${CHART_W} ${height}`}
      className="h-auto w-full max-w-full"
      role="img"
      aria-label={`${title}: ${bars.items.map((b) => `${b.label} ${b.display}`).join(", ")}`}
    >
      <line x1={LABEL_W} y1={TOP - 6} x2={LABEL_W} y2={height - 20} className="stroke-border" strokeWidth="1" />
      <line x1={LABEL_W} y1={height - 20} x2={LABEL_W + plotW} y2={height - 20} className="stroke-border" strokeWidth="1" />
      {bars.items.map((item, i) => {
        const y = TOP + i * ROW_H;
        return (
          <g key={item.label}>
            <text x={LABEL_W - 6} y={y + 12} textAnchor="end" className="fill-foreground text-[10px] font-semibold">
              <title>{item.label}</title>
              {item.label.length > 34 ? `${item.label.slice(0, 33)}…` : item.label}
            </text>
            <rect x={LABEL_W + 1} y={y + 2} width={Math.max(2, plotW * item.share)} height="9" className="fill-foreground" />
            <rect x={LABEL_W + 1} y={y + 13} width={Math.max(2, plotW * item.priorShare)} height="6" className="fill-border" />
            <text x={LABEL_W + 6 + plotW * item.share} y={y + 11} className="fill-muted-foreground text-[10px]">
              {item.display}
            </text>
          </g>
        );
      })}
      {bars.axis.map((tick, i) => {
        const x = LABEL_W + (plotW * i) / Math.max(1, bars.axis.length - 1);
        const anchor = i === 0 ? "start" : i === bars.axis.length - 1 ? "end" : "middle";
        return (
          <text key={tick} x={x} y={height - 6} textAnchor={anchor} className="fill-muted-foreground text-[10px]">
            {tick}
          </text>
        );
      })}
      <rect x={CHART_W - 190} y={6} width="10" height="7" className="fill-foreground" />
      <text x={CHART_W - 176} y={13} className="fill-muted-foreground text-[10px]">{bars.legend[0]}</text>
      {bars.legend[1] ? (
        <>
          <rect x={CHART_W - 100} y={7} width="10" height="5" className="fill-border" />
          <text x={CHART_W - 86} y={13} className="fill-muted-foreground text-[10px]">{bars.legend[1]}</text>
        </>
      ) : null}
    </svg>
  );
}
