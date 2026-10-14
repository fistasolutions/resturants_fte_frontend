const KPIS: { label: string; bar: string }[] = [
  { label: "Net sales", bar: "w-3/4" },
  { label: "Orders", bar: "w-1/2" },
  { label: "Avg order", bar: "w-2/3" },
  { label: "Returns", bar: "w-2/5" },
];

/**
 * A drawing of the app for the login screen (SPEC-312 Patches, the owner's pick "R5 · Red
 * Band"): a window in the marketing site's style — three dots, a title, mono labels — holding the
 * KPI strip and a net-sales chart with the brand-red line against last period's dashed one.
 * Figures are drawn as bars, never numbers: nothing on it pretends to be data. Drawn in the
 * `--showcase-*` tokens. Decorative: hidden from assistive technology.
 */
export function ProductPreview() {
  return (
    <div
      aria-hidden
      className="flex h-96 flex-col overflow-hidden rounded-l-xl border border-r-0 border-showcase-border bg-showcase-card text-showcase-foreground shadow-2xl shadow-showcase-band/20"
    >
      <div className="flex items-center justify-between border-b border-showcase-border px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <span key={i} className="size-2 rounded-full bg-showcase-border" />
            ))}
          </div>
          <span className="text-sm font-medium">Good morning</span>
        </div>
        <span className="font-mono text-xs text-showcase-muted">Updated every 15 min</span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-3.5 p-4">
        <div className="grid grid-cols-4 gap-2.5">
          {KPIS.map((kpi) => (
            <div key={kpi.label} className="flex flex-col gap-2 rounded-lg border border-showcase-border p-3">
              <span className="font-mono text-[10px] tracking-widest text-showcase-muted uppercase">
                {kpi.label}
              </span>
              <div className={`h-3 rounded-sm bg-showcase-tile ${kpi.bar}`} />
            </div>
          ))}
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-1.5 rounded-lg border border-showcase-border p-3.5">
          <span className="font-mono text-[10px] tracking-widest text-showcase-muted uppercase">
            Net sales · this period vs last
          </span>
          <svg viewBox="0 0 640 180" preserveAspectRatio="none" className="h-full w-full">
            <polyline
              points="0,156 60,150 120,153 180,136 240,142 300,124 360,130 420,112 480,118 540,102 640,106"
              fill="none"
              className="stroke-showcase-muted/50"
              strokeWidth="2"
              strokeDasharray="5 5"
              vectorEffect="non-scaling-stroke"
            />
            <polyline
              points="0,140 60,128 120,134 180,104 240,112 300,84 360,94 420,64 480,74 540,46 640,54"
              fill="none"
              className="stroke-showcase-band"
              strokeWidth="2.5"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
