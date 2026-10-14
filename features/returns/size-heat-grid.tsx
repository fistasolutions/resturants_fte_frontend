import { cn } from "@/lib/utils";
import { formatRate, rateTone, sizeRank } from "@/lib/returns-format";
import type { SizeCell } from "@/types/returns-intel";

import { HEAT_CELL_CLASS } from "./tone";

/** A style's size run as rate-colored cells. Flagged (likely grading-defect)
 * cells get a destructive ring so they read at a glance. */
export function SizeHeatGrid({ sizes }: { sizes: SizeCell[] }) {
  const ordered = [...sizes].sort((a, b) => sizeRank(a.size) - sizeRank(b.size));
  return (
    <div className="flex flex-wrap gap-1.5">
      {ordered.map((cell) => (
        <div
          key={cell.size}
          title={`${cell.size}: ${cell.units_returned}/${cell.units_sold} returned`}
          className={cn(
            "flex min-w-14 flex-col items-center gap-0.5 rounded-md px-2 py-1.5",
            HEAT_CELL_CLASS[rateTone(cell.return_rate)],
            cell.flagged && "ring-2 ring-destructive ring-offset-1 ring-offset-background",
          )}
        >
          <span className="text-xs font-semibold">{cell.size}</span>
          <span className="text-xs tabular-nums opacity-90">{formatRate(cell.return_rate)}</span>
        </div>
      ))}
    </div>
  );
}
