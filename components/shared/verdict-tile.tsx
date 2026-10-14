import { Card } from "@/components/ui/card";
import { DeltaBadge } from "@/features/brief/brief-kpis";
import { ExplainButton } from "@/features/chat/explain-button";

/** Shared verdict-tile shape (extracted from the byte-for-byte-duplicated
 * Products/Inventory copies once a third page — Returns Analytics — needed
 * the same thing, past the rule-of-three duplication threshold). `delta`
 * is optional (SPEC-084) — Products/Inventory don't pass it, so their
 * existing tiles render exactly as before. Carries a ✦ Explain button (SPEC-242). */
export function VerdictTile({
  label,
  value,
  caption,
  delta,
  invertDelta,
}: {
  label: string;
  value: string;
  caption: string;
  delta?: number | null;
  invertDelta?: boolean;
}) {
  return (
    <Card className="relative gap-1 px-4 py-3">
      <p className="pr-6 text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
        {label}
      </p>
      <ExplainButton target={{ metric: label, value, delta, detail: caption }} />
      <p className="truncate text-lg font-semibold" title={value}>
        {value}
      </p>
      <div className="flex items-center gap-1.5">
        {delta != null && <DeltaBadge delta={delta} invertDelta={invertDelta} />}
        <p className="text-xs text-muted-foreground">{caption}</p>
      </div>
    </Card>
  );
}
