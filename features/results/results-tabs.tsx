"use client";

import { useState } from "react";
import Link from "next/link";

import { FolderPanel, FolderTabBar, folderTab } from "@/components/shared/folder-tabs";
import { Card } from "@/components/ui/card";
import { ordersPageHref } from "@/lib/order-filters";
import { RESULTS_CATEGORY_TABS, RESULTS_LEDGER_TAB, RESULTS_MANAGERS_TAB, RESULTS_TABS } from "@/lib/results-tabs";
import { useVisibleTabs } from "@/features/navigation/nav-prefs-provider";
import { ManagersTab } from "@/features/results/managers-tab";
import type {
  ManagerAccountability,
  OutcomeEntry,
  OutcomeLink,
  OutcomeVerdict,
  ResultsData,
  ValueLedger,
} from "@/types/results";
import { formatCurrency } from "@/utils/format";

export function resolveLink(link: OutcomeLink): string {
  switch (link.type) {
    case "overdue":
      return "/brief/overdue";
    case "orders":
      return ordersPageHref({ location: link.location_key });
    case "inventory":
      return "/inventory";
    case "transfers":
      return link.location_key
        ? `/inventory/transfers/review/send/${link.location_key}`
        : "/inventory/transfers/review";
    case "dead_inventory":
      return `/inventory/dead-inventory-alerts/${link.product_id}/${link.location_id}`;
    case "customers":
      return "/customers";
    case "traffic":
      return "/traffic";
    case "discounts":
      return "/discounts/attention";
    case "warehouse":
      return "/warehouse";
    case "support":
      return "/team-performance/agents";
    case "returns":
      return "/returns";
  }
}

export function verdictBadge(verdict: OutcomeVerdict) {
  const config: Record<OutcomeVerdict, { label: string; cls: string }> = {
    worked: { label: "✓ Worked", cls: "bg-success/10 text-success border-success/20" },
    early: { label: "→ Too early to tell", cls: "bg-warning/10 text-warning border-warning/20" },
    none: { label: "✗ No change", cls: "bg-muted text-muted-foreground border-border" },
  };
  const { label, cls } = config[verdict];
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded px-2 py-0.5 text-[11px] font-bold border ${cls}`}
    >
      {label}
    </span>
  );
}

export function OutcomeRow({ entry }: { entry: OutcomeEntry }) {
  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{entry.headline}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{entry.meta}</p>
        </div>
        {verdictBadge(entry.verdict)}
      </div>
      <p className="text-sm text-muted-foreground">{entry.detail}</p>
      <Link
        href={resolveLink(entry.link)}
        className="inline-block w-fit text-xs font-semibold text-foreground underline underline-offset-4"
      >
        View details →
      </Link>
    </Card>
  );
}

function EmptyTab() {
  return (
    <Card className="border border-dashed border-border bg-muted/30 px-4 py-10 text-center">
      <p className="text-sm text-muted-foreground">No sends yet.</p>
    </Card>
  );
}

const LEDGER_KEY = RESULTS_LEDGER_TAB;
const MANAGERS_KEY = RESULTS_MANAGERS_TAB;
type ActiveTab = keyof ResultsData | typeof LEDGER_KEY | typeof MANAGERS_KEY;

const CATEGORY_LABELS: Record<string, string> = {
  overdue: "Overdue",
  transfers: "Transfers",
  winback: "Winback",
  dead_inventory: "Dead Inventory",
  orders: "Orders",
  store_traffic: "Store Traffic",
  discount_review: "Discount Reviews",
  warehouse: "Warehouse",
  support: "Support Team",
  returns: "Returns",
};

/**
 * The roll-up (SPEC-188). Only winback rows carry an attributed value; the tile
 * therefore states how many actions are monetised, and unvalued rows show "—".
 * A reader must never mistake the total for full coverage.
 */
function LedgerPanel({ ledger }: { ledger: ValueLedger }) {
  const { summary, entries } = ledger;

  if (entries.length === 0) {
    return (
      <Card className="border border-dashed border-border bg-muted/30 px-4 py-10 text-center">
        <p className="text-sm text-muted-foreground">
          No actions taken yet — the ledger fills as the platform sends on your behalf.
        </p>
      </Card>
    );
  }

  const tiles = [
    { label: "Actions taken", value: String(summary.actionsTaken), note: null },
    { label: "Worked", value: String(summary.worked), note: null },
    { label: "Still measuring", value: String(summary.stillMeasuring), note: null },
    {
      label: "Measured value",
      value: formatCurrency(summary.measuredValue),
      note: `from ${summary.actionsWithValue} of ${summary.actionsTaken} actions`,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map((tile) => (
          <Card key={tile.label} className="p-4">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {tile.label}
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums text-foreground">
              {tile.value}
            </p>
            {tile.note && (
              <p className="mt-0.5 text-xs text-muted-foreground">{tile.note}</p>
            )}
          </Card>
        ))}
      </div>

      <div className="space-y-3">
        {entries.map((entry, index) => (
          <Card key={`${entry.category}-${entry.sentAt}-${index}`} className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{entry.headline}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {CATEGORY_LABELS[entry.category] ?? entry.category} · {entry.meta}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-sm font-bold tabular-nums text-foreground">
                  {entry.value === null
                    ? "—"
                    : formatCurrency(entry.value)}
                </span>
                {verdictBadge(entry.verdict)}
              </div>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{entry.detail}</p>
            {entry.valueBasis && (
              <p className="mt-1 text-xs text-muted-foreground italic">
                {entry.valueBasis}
              </p>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

export function ResultsTabs({
  data,
  ledger,
  managers,
}: {
  data: ResultsData;
  ledger: ValueLedger;
  /** Null while the managers query is pending or failed — the tab degrades alone. */
  managers: ManagerAccountability | null;
}) {
  const [active, setActive] = useState<ActiveTab>(LEDGER_KEY);
  const entries = active === LEDGER_KEY || active === MANAGERS_KEY ? [] : data[active];
  // SPEC-338: the tabs this member switched off in Settings → Sidebar stay out of the bar.
  const shown = new Set(useVisibleTabs("/results", RESULTS_TABS, (tab) => tab.key, active).map((tab) => tab.key));

  return (
    <div>
      <FolderTabBar role="tablist" label="Results by send type">
        <button
          type="button"
          role="tab"
          aria-selected={active === LEDGER_KEY}
          onClick={() => setActive(LEDGER_KEY)}
          {...folderTab(active === LEDGER_KEY)}
        >
          Value Ledger
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
            {ledger.summary.actionsTaken}
          </span>
        </button>
        {shown.has(MANAGERS_KEY) ? (
        <button
          type="button"
          role="tab"
          aria-selected={active === MANAGERS_KEY}
          onClick={() => setActive(MANAGERS_KEY)}
          {...folderTab(active === MANAGERS_KEY)}
        >
          Managers
          {managers ? (
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
              {managers.summary.managers}
            </span>
          ) : null}
        </button>
        ) : null}
        {RESULTS_CATEGORY_TABS.filter((tab) => shown.has(tab.key)).map((tab) => {
          const count = data[tab.key].length;
          const isActive = tab.key === active;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActive(tab.key)}
              {...folderTab(isActive)}
            >
              {tab.label}
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                {count}
              </span>
            </button>
          );
        })}
      </FolderTabBar>

      <FolderPanel>
        {active === LEDGER_KEY ? (
          <LedgerPanel ledger={ledger} />
        ) : active === MANAGERS_KEY ? (
          managers ? (
            <ManagersTab data={managers} />
          ) : (
            <Card className="border border-dashed border-border bg-muted/30 px-4 py-10 text-center">
              <p className="text-sm text-muted-foreground">
                Manager accountability could not be loaded — try refreshing.
              </p>
            </Card>
          )
        ) : entries.length === 0 ? (
          <EmptyTab />
        ) : (
          <div className="space-y-3">
            {entries.map((entry, i) => (
              <OutcomeRow key={`${entry.headline}-${i}`} entry={entry} />
            ))}
          </div>
        )}
      </FolderPanel>
    </div>
  );
}
