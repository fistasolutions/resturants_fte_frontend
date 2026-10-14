import { Panel, PanelRow } from "@/components/shared/panel";
import { cn } from "@/lib/utils";
import type { NetSales } from "@/types/dashboard";
import { formatCurrency, formatPercent } from "@/utils/format";

interface Props {
  data: NetSales;
}

interface Line {
  label: string;
  amount: number;
  /** Deductions render negative and in destructive colour. */
  deduction?: boolean;
}

/** "7.5% of gross" — display-only, the way the minus sign is (root Rule 8). */
function shareOfGross(amount: number, gross: number): string | null {
  if (gross <= 0) return null;
  return `${formatPercent((amount / gross) * 100)} of gross`;
}

/**
 * Shopify's sales waterfall (backend SPEC-201 / frontend SPEC-184) as four rows in
 * the rail (SPEC-233). Every figure is computed by the backend (root Rule 8); this
 * component only lays them out.
 */
export function NetSalesWaterfall({ data }: Props) {
  const lines: Line[] = [
    { label: "Gross sales", amount: data.grossSales },
    { label: "Discounts", amount: data.discounts, deduction: true },
    { label: "Returns", amount: data.returns, deduction: true },
  ];

  return (
    <Panel title="Net sales" aside={<span>matches Shopify&rsquo;s Sales report</span>}>
      {lines.map((line) => {
        const share = line.deduction ? shareOfGross(line.amount, data.grossSales) : null;
        return (
          <PanelRow
            key={line.label}
            align="center"
            className="py-2"
            trailing={
              <p
                className={cn(
                  "text-sm font-bold tabular-nums",
                  line.deduction ? "text-destructive" : "text-foreground",
                )}
              >
                {line.deduction ? "−" : ""}
                {formatCurrency(line.amount)}
              </p>
            }
          >
            <p className="text-sm font-semibold leading-snug">{line.label}</p>
            {share ? <p className="text-xs leading-snug text-muted-foreground">{share}</p> : null}
          </PanelRow>
        );
      })}
      <PanelRow
        align="center"
        className="bg-muted/40 py-2"
        trailing={<p className="text-base font-bold tabular-nums">{formatCurrency(data.netSales)}</p>}
      >
        <p className="text-sm font-semibold leading-snug">Net sales</p>
        <p className="text-xs leading-snug text-muted-foreground">before tax and shipping</p>
      </PanelRow>
    </Panel>
  );
}
