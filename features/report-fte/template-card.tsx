import Link from "next/link";

import { StatusBadge } from "@/components/shared/status-badge";
import { CADENCE_LABEL } from "@/lib/report-fte";
import { templateEditorHref } from "@/lib/report-fte-tabs";
import type { ReportTemplateSummary } from "@/types/report-fte";

/** One template (SPEC-256) — the whole card links to its editor. */
export function TemplateCard({ template }: { template: ReportTemplateSummary }) {
  return (
    <Link
      href={templateEditorHref(template.id)}
      className="flex min-w-0 flex-col gap-1.5 rounded-xl border border-border bg-card p-3 outline-none transition-colors hover:border-foreground/40 focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span>
        <StatusBadge tone={template.cadence === "daily" ? "ai" : "neutral"}>
          {CADENCE_LABEL[template.cadence]}
        </StatusBadge>
      </span>
      <span className="text-sm font-semibold text-foreground">{template.name}</span>
      <span className="text-xs leading-snug text-muted-foreground">{template.summary}</span>
      <span className="mt-1 flex items-center justify-between border-t border-border pt-1.5 text-[11px] text-muted-foreground">
        <span>
          {template.sectionCount} sections · {template.toolCount} tools
        </span>
        <span>{template.runs}</span>
      </span>
    </Link>
  );
}
