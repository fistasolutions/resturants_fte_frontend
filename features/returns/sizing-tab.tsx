import Link from "next/link";
import { TriangleAlert } from "lucide-react";

import { Card } from "@/components/ui/card";
import { formatRate } from "@/lib/returns-format";
import type { SizeProfileCell, SizingStyleRow } from "@/types/returns-intel";

import { SizeHeatGrid } from "./size-heat-grid";
import { SizeProfileChart } from "./size-profile-chart";

export function SizingTab({
  styles,
  sizeProfile,
  rangeQuery,
}: {
  styles: SizingStyleRow[];
  sizeProfile?: SizeProfileCell[];
  rangeQuery: string;
}) {
  const defectCount = styles.filter((style) => style.has_defect).length;

  return (
    <div className="space-y-5">
      <SizeProfileChart profile={sizeProfile} />

      <Card className="flex-row items-start gap-3 border-warning/30 bg-warning/5 p-4">
        <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
        <div className="space-y-1 text-sm">
          <p className="font-medium text-foreground">
            {defectCount > 0
              ? `${defectCount} style${defectCount === 1 ? "" : "s"} show a likely sizing defect`
              : "No sizing defect flagged in this period"}
          </p>
          <p className="text-muted-foreground">
            A size is flagged when it returns at 2× the style&apos;s overall rate on real
            volume — a signal the fit or size chart, not the customer, is the problem.
          </p>
        </div>
      </Card>

      <div className="space-y-3">
        {styles.map((style) => (
          <Card key={style.product_id} className="gap-3 p-4">
            <div className="flex items-center justify-between gap-3">
              <Link
                href={`/returns/style/${style.product_id}?${rangeQuery}`}
                className="min-w-0"
              >
                <span className="block truncate text-sm font-medium text-foreground hover:underline">
                  {style.style_name ?? `#${style.product_id}`}
                </span>
                <span className="text-xs text-muted-foreground">
                  {style.style_code ?? "—"} · {formatRate(style.style_return_rate)} style rate
                </span>
              </Link>
              {style.has_defect && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-destructive/15 px-2 py-0.5 text-xs font-medium text-destructive">
                  <TriangleAlert className="size-3" /> sizing defect
                </span>
              )}
            </div>
            <SizeHeatGrid sizes={style.sizes} />
          </Card>
        ))}
      </div>
    </div>
  );
}
