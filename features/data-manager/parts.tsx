"use client";

import { Info } from "lucide-react";

import { cn } from "@/lib/utils";
import { isNumericType } from "@/lib/data-manager";
import type { SourceField } from "@/types/data-manager";

/** Data Manager's small shared pieces (SPEC-374): the example note, a card, tiles and the exact-copy grid. */

export function ExampleNote() {
  return (
    <p className="flex items-start gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
      <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
      Example data. Your own tables, matches and real profit appear here after your first import.
    </p>
  );
}

export function Section({
  title,
  description,
  actions,
  className,
  children,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("min-w-0 rounded-2xl border border-border bg-card p-4", className)}>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">{title}</h2>
          {description ? <p className="mt-0.5 text-xs text-muted-foreground">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}

export interface Tile {
  label: string;
  value: string;
  note: string;
  tone?: "default" | "warning" | "destructive" | "success";
}

const TONE: Record<NonNullable<Tile["tone"]>, string> = {
  default: "",
  warning: "text-warning",
  destructive: "text-destructive",
  success: "text-success",
};

export function Tiles({ tiles }: { tiles: Tile[] }) {
  return (
    <dl className="grid grid-cols-2 overflow-hidden rounded-2xl border border-border bg-card sm:grid-cols-3 xl:grid-cols-5">
      {tiles.map((tile) => (
        <div key={tile.label} className="min-w-0 border-b border-l border-border px-4 py-3 [&:nth-child(2n+1)]:border-l-0 sm:[&:nth-child(2n+1)]:border-l sm:[&:nth-child(3n+1)]:border-l-0 xl:[&:nth-child(3n+1)]:border-l xl:[&:nth-child(5n+1)]:border-l-0">
          <dt className="truncate text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">{tile.label}</dt>
          <dd className={cn("mt-1 text-xl font-bold tabular-nums", TONE[tile.tone ?? "default"])}>{tile.value}</dd>
          <dd className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{tile.note}</dd>
        </div>
      ))}
    </dl>
  );
}

/** A table copied exactly: every cell shown as written, numbers right-aligned. */
export function ExactGrid({
  fields,
  rows,
  extraHeader,
  extraCell,
  emptyText = "No rows.",
}: {
  fields: SourceField[];
  rows: string[][];
  extraHeader?: string;
  extraCell?: (row: string[], index: number) => React.ReactNode;
  emptyText?: string;
}) {
  return (
    <div className="max-h-[32rem] overflow-auto rounded-xl border border-border bg-card">
      <table className="w-full border-separate border-spacing-0 text-sm">
        <thead>
          <tr>
            <th className="sticky top-0 z-10 w-px border-b border-border bg-card px-3 py-2 text-left text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
              #
            </th>
            {fields.map((field) => (
              <th
                key={field.name}
                className={cn(
                  "sticky top-0 z-10 whitespace-nowrap border-b border-border bg-card px-3 py-2 text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground",
                  isNumericType(field.type) ? "text-right" : "text-left",
                )}
              >
                {field.name}
                <span className="ml-1.5 rounded border border-border px-1 font-mono text-[10px] font-medium normal-case tracking-normal">
                  {field.type}
                </span>
              </th>
            ))}
            {extraHeader ? (
              <th className="sticky top-0 z-10 whitespace-nowrap border-b border-border bg-card px-3 py-2 text-left text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
                {extraHeader}
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="hover:bg-muted/40">
              <td className="border-b border-border px-3 py-2 text-xs tabular-nums text-muted-foreground">{index + 1}</td>
              {fields.map((field, column) => (
                <td
                  key={field.name}
                  className={cn(
                    "whitespace-pre border-b border-border px-3 py-2 tabular-nums",
                    isNumericType(field.type) ? "text-right" : "text-left",
                  )}
                >
                  {row[column] ?? ""}
                </td>
              ))}
              {extraCell ? <td className="border-b border-border px-3 py-2">{extraCell(row, index)}</td> : null}
            </tr>
          ))}
          {rows.length === 0 ? (
            <tr>
              <td colSpan={fields.length + 2} className="px-3 py-8 text-center text-sm text-muted-foreground">
                {emptyText}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
