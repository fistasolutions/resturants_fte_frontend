"use client";

import { EmptyLine, NUM, Section, TD, TH, Tile } from "@/features/finance/finance-ui";
import { compactMoney, shortDate } from "@/lib/finance";
import { cn } from "@/lib/utils";
import type { ValueBaseline } from "@/types/finance";
import { formatCurrency, formatPercent } from "@/utils/format";

/**
 * Before Finance (SPEC-330): the year before the first connection, read from the paid
 * bills — what leaked when nobody was watching. This is the "before" every month is
 * compared with, so it is frozen on the first full read and says so.
 */
export function BaselinePanel({ baseline }: { baseline: ValueBaseline | null }) {
  if (!baseline) {
    return (
      <Section title="Before Finance" meta="the year before connecting">
        <EmptyLine>No bills paid in the year before connecting, so there is nothing to compare with yet.</EmptyLine>
      </Section>
    );
  }
  const b = baseline;
  return (
    <Section
      title="Before Finance"
      meta={`${shortDate(b.from)} – ${shortDate(b.to)} · ${b.bills.toLocaleString("en-US")} bills paid${b.frozen ? "" : " · provisional until the first full read"}`}
    >
      <div className="grid grid-cols-2 gap-2 p-3 lg:grid-cols-4">
        <Tile
          label="Discounts missed"
          value={compactMoney(b.discounts.missed)}
          tone={b.discounts.missed > 0 ? "warn" : null}
          sub={`${b.discounts.taken} of ${b.discounts.offered} taken · from your books`}
        />
        <Tile
          label="Probably paid twice"
          value={compactMoney(b.paidTwice.amount)}
          tone={b.paidTwice.amount > 0 ? "bad" : null}
          sub={`${b.paidTwice.count} extra ${b.paidTwice.count === 1 ? "copy" : "copies"} · from your books`}
        />
        <Tile
          label="Cash sent early"
          value={compactMoney(b.early.cost)}
          sub={
            b.early.count
              ? `${b.early.count} bills, ${b.early.avgDays ?? 0} days early on average · estimated`
              : "None beyond 3 days · estimated"
          }
        />
        <Tile
          label="Late fees"
          value={compactMoney(b.late.fees)}
          sub={
            b.late.count
              ? `${b.late.count} late (${b.late.share != null ? formatPercent(b.late.share * 100) : "—"}) · estimated`
              : "No bills paid late · estimated"
          }
        />
      </div>
      {b.paidTwice.items.length > 0 && (
        <div className="overflow-x-auto border-t border-border">
          <p className="px-3 pt-2.5 text-xs text-muted-foreground">
            Same vendor, same amount and the same bill number (or bill date). Possible — check with the vendor, who can
            issue a credit.
          </p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className={TH}>Vendor · bill</th>
                <th className={TH}>Companies</th>
                <th className={cn(TH, "text-right")}>Each</th>
                <th className={cn(TH, "text-right")}>Extra paid</th>
                <th className={TH}>Paid on</th>
              </tr>
            </thead>
            <tbody>
              {b.paidTwice.items.map((item, index) => (
                <tr key={`${item.vendor}-${item.number ?? index}`} className="border-t border-border">
                  <td className={TD}>
                    <span className="font-medium">{item.vendor}</span>
                    {item.number && <span className="block text-[11px] text-muted-foreground">{item.number}</span>}
                  </td>
                  <td className={cn(TD, "text-muted-foreground")}>{item.companies.join(", ")}</td>
                  <td className={cn(TD, NUM)}>{formatCurrency(item.amount)}</td>
                  <td className={cn(TD, NUM, "font-semibold text-destructive")}>{formatCurrency(item.extra)}</td>
                  <td className={cn(TD, "text-xs text-muted-foreground")}>{item.paidOn.map(shortDate).join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  );
}
