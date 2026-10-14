"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { TemplateCard } from "@/features/report-fte/template-card";
import { useWorkspace } from "@/features/workspace/workspace-provider";
import { isGuided } from "@/lib/company-switches";
import { CADENCE_FILTERS, filterTemplates, offeredTemplates } from "@/lib/report-fte";
import { REPORT_FTE_BASE } from "@/lib/report-fte-tabs";
import { cn } from "@/lib/utils";
import type { ReportCadence, TemplatesData } from "@/types/report-fte";

/**
 * Report FTE → Templates (SPEC-256): every template the platform implies, filtered
 * by cadence; each card opens its editor; the last card starts from a question.
 */
export function TemplatesView({ data }: { data: TemplatesData }) {
  const [cadence, setCadence] = useState<ReportCadence | "all">("all");
  // SPEC-365: a guided workspace lists only templates its connected data can run.
  const { visibility, connected } = useWorkspace();
  const offered = offeredTemplates(data.templates, isGuided(visibility), new Set(connected));
  const templates = filterTemplates(offered, cadence);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Templates <span className="text-muted-foreground">· {offered.length}</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            A template is an ordered list of sections bound to MCP tools — data, not code. Click
            one to open it in the editor.
          </p>
        </div>
        <div className="flex flex-wrap gap-1" role="group" aria-label="Filter by cadence">
          {CADENCE_FILTERS.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => setCadence(filter.key)}
              aria-pressed={cadence === filter.key}
              className={cn(
                "rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                cadence === filter.key
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {templates.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center">
          <p className="text-sm font-medium text-foreground">No template runs on that cadence yet.</p>
          <p className="mt-1 text-xs text-muted-foreground">Start from a question and schedule it.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {templates.map((template) => (
            <TemplateCard key={template.id} template={template} />
          ))}
          <Link
            href={REPORT_FTE_BASE}
            className="flex min-w-0 flex-col items-start gap-1.5 rounded-xl border border-dashed border-border bg-card p-3 outline-none transition-colors hover:border-foreground/40 focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="grid size-7 place-items-center rounded-lg bg-muted text-muted-foreground">
              <Plus className="size-4" aria-hidden />
            </span>
            <span className="text-sm font-semibold text-foreground">Start from a question</span>
            <span className="text-xs leading-snug text-muted-foreground">
              Describe the report on the Desk; the FTE proposes the sections and tools.
            </span>
          </Link>
        </div>
      )}
      <div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`${REPORT_FTE_BASE}/tools`}>See every tool a section can bind to</Link>
        </Button>
      </div>
    </div>
  );
}
