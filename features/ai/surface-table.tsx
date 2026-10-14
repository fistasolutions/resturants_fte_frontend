"use client";

import { useState } from "react";

import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BASIS_LABELS,
  categoryCounts,
  effortLabel,
  filterSurfaces,
  formatDuration,
  formatUnitCost,
  formatUsd,
  modelLabel,
  verdictFor,
} from "@/lib/ai-value";
import type {
  AiCategory,
  AiSurface,
  AiValueOverview,
  SurfaceVerdictTone,
} from "@/types/ai-value";

const TONE: Record<SurfaceVerdictTone, string> = {
  earning: "bg-success/10 text-success border-success/20",
  watch: "bg-warning/10 text-warning border-warning/20",
  review: "bg-destructive/10 text-destructive border-destructive/20",
  failing: "bg-destructive/15 text-destructive border-destructive/30",
  neutral: "bg-muted text-muted-foreground border-border",
};

function Chip({ children, tone }: { children: React.ReactNode; tone: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${tone}`}
    >
      {children}
    </span>
  );
}

function Value({ surface }: { surface: AiSurface }) {
  if (surface.value === null) {
    return (
      <Chip tone="bg-muted text-muted-foreground border-border">
        {BASIS_LABELS[surface.valueBasis]}
      </Chip>
    );
  }
  return (
    <span className="font-semibold tabular-nums text-success">{formatUsd(surface.value)}</span>
  );
}

export function SurfaceTable({
  surfaces,
  categories,
}: {
  surfaces: AiSurface[];
  categories: AiValueOverview["categories"];
}) {
  const [active, setActive] = useState<AiCategory | "all">("all");
  const counts = categoryCounts(surfaces);
  const rows = filterSurfaces(surfaces, active);
  const chips: { key: AiCategory | "all"; label: string }[] = [
    { key: "all", label: "All" },
    ...categories,
  ];

  return (
    <>
      <div role="group" aria-label="Filter by category" className="mb-2.5 flex flex-wrap gap-1.5">
        {chips.map((chip) => (
          <button
            key={chip.key}
            type="button"
            aria-pressed={active === chip.key}
            onClick={() => setActive(chip.key)}
            className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
              active === chip.key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            {chip.label}
            <span className="ml-1.5 tabular-nums opacity-60">{counts[chip.key] ?? 0}</span>
          </button>
        ))}
      </div>

      <Card className="gap-0 overflow-hidden py-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Surface</TableHead>
                <TableHead className="text-right">Runs</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Effort a run</TableHead>
                <TableHead className="text-right">Typical</TableHead>
                <TableHead className="text-right">Per run</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Verdict</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((surface, index) => {
                const verdict = verdictFor(surface, index);
                return (
                  <TableRow key={surface.key}>
                    <TableCell>
                      <p className="font-semibold text-foreground">{surface.label}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{surface.detail}</p>
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {surface.runs.toLocaleString("en-US")}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {(() => {
                        const used = modelLabel(surface);
                        if (!used) return <span className="text-muted-foreground">—</span>;
                        return (
                          <>
                            <span className="block font-mono text-xs">{used.model}</span>
                            {used.provider && (
                              <span className="block text-[11px] text-muted-foreground">
                                {used.provider}
                              </span>
                            )}
                          </>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {effortLabel(surface)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {formatDuration(surface.medianMs)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {formatUnitCost(surface.costPerRun)}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {formatUsd(surface.costUsd)}
                    </TableCell>
                    <TableCell>
                      <Value surface={surface} />
                    </TableCell>
                    <TableCell>
                      <Chip tone={TONE[verdict.tone]}>{verdict.label}</Chip>
                    </TableCell>
                  </TableRow>
                );
              })}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center text-sm text-muted-foreground">
                    Nothing in this category has run yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </>
  );
}
