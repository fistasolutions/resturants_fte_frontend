"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

import { ShallowLink } from "@/components/shared/shallow-link";
import { Input } from "@/components/ui/input";
import { useDataManager } from "@/features/data-manager/data-manager-context";
import { ExactGrid, ExampleNote } from "@/features/data-manager/parts";
import { dataTabHref } from "@/lib/data-manager";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/utils/format";

/** Tables (SPEC-374): every copied table, shown exactly as its source holds it. */
export function TablesTab() {
  const { data, uploads } = useDataManager();
  const params = useSearchParams();
  const tables = [...uploads, ...data.tables];
  const table = tables.find((t) => t.id === params.get("table")) ?? tables[0];
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const rows = q ? table.rows.filter((row) => row.some((cell) => cell.toLowerCase().includes(q))) : table.rows;

  return (
    <div className="flex flex-col gap-4">
      <ExampleNote />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <nav aria-label="Tables" className="flex flex-col gap-1">
          <p className="px-1 pb-1 text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Tables</p>
          {tables.map((t) => (
            <ShallowLink
              key={t.id}
              href={dataTabHref("tables", { table: t.id })}
              aria-current={t.id === table.id ? "page" : undefined}
              className={cn(
                "flex flex-col rounded-lg border border-transparent px-2.5 py-2 text-left outline-none hover:border-border hover:bg-card focus-visible:ring-2 focus-visible:ring-ring",
                t.id === table.id && "border-border bg-card shadow-[inset_3px_0_0_var(--foreground)]",
              )}
            >
              <span className="truncate text-sm font-semibold">{t.name}</span>
              <span className="truncate text-xs text-muted-foreground">
                {t.origin === "airtable" ? t.container : "Uploaded"} · {formatNumber(t.rowCount)} rows
              </span>
            </ShallowLink>
          ))}
        </nav>
        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold">{table.name}</h2>
              <p className="text-xs text-muted-foreground">
                {table.origin === "airtable" ? `Airtable · ${table.container}` : `Uploaded · ${table.container}`} · exact copy ·{" "}
                {formatNumber(table.rowCount)} rows{table.rows.length < table.rowCount ? `, first ${table.rows.length} shown` : ""}
              </p>
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search rows"
                aria-label="Search rows"
                className="w-56 pl-8"
              />
            </div>
          </div>
          <ExactGrid
            fields={table.fields}
            rows={rows}
            emptyText={q ? `No row contains “${query}”.` : "No rows."}
          />
          <p className="text-xs text-muted-foreground">
            Every field is kept as the source has it: text stays text, links stay links, formulas keep their result, and nothing is rounded or trimmed.
          </p>
        </div>
      </div>
    </div>
  );
}
