"use client";

import { useState, type FormEvent } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { WinbackListResponse } from "@/types/brief";
import { formatCurrency } from "@/utils/format";

interface WinbackReviewTableProps {
  initialData: WinbackListResponse;
  initialQuery: string;
  initialMinSpend: number | null;
  initialMinSilent: number | null;
  pageSize: number;
}

async function fetchWinbackPage(
  page: number,
  limit: number,
  q: string,
  minSpend: number | null,
  minSilent: number | null,
): Promise<WinbackListResponse> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (q) params.set("q", q);
  if (minSpend) params.set("min_spend", String(minSpend));
  if (minSilent) params.set("min_silent", String(minSilent));
  const res = await fetch(`/api/proxy/brief/winback?${params.toString()}`);
  if (!res.ok) throw new Error(`${res.status}`);
  return (await res.json()) as WinbackListResponse;
}

/** Winback list search + table + pagination (SPEC-053, backend SPEC-047;
 * client-side paging SPEC-063). Fetches directly from `/brief/winback`
 * instead of navigating the route — the sync button and header above stay
 * mounted through a search, filter change, or page click. */
export function WinbackReviewTable({
  initialData,
  initialQuery,
  initialMinSpend,
  initialMinSilent,
  pageSize,
}: WinbackReviewTableProps) {
  const [data, setData] = useState(initialData);
  const [q, setQ] = useState(initialQuery);
  const [minSpend, setMinSpend] = useState(initialMinSpend?.toString() ?? "");
  const [minSilent, setMinSilent] = useState(initialMinSilent?.toString() ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(
    page: number,
    query: string,
    spend: number | null,
    silent: number | null,
  ) {
    setLoading(true);
    setError(null);
    try {
      const next = await fetchWinbackPage(page, pageSize, query, spend, silent);
      setData(next);
    } catch {
      setError("Could not load — try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleApply(e: FormEvent) {
    e.preventDefault();
    load(1, q, minSpend ? Number(minSpend) : null, minSilent ? Number(minSilent) : null);
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleApply}
        className="flex flex-wrap items-end gap-3"
      >
        <div className="relative w-full max-w-md">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name or email…"
            aria-label="Search winback customers by name or email"
            className="pl-9"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="min_spend" className="text-xs text-muted-foreground">
            Min lifetime spend
          </Label>
          <Input
            id="min_spend"
            type="number"
            min={0}
            step={50}
            value={minSpend}
            onChange={(e) => setMinSpend(e.target.value)}
            placeholder="$0"
            className="w-32"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="min_silent" className="text-xs text-muted-foreground">
            Min days silent
          </Label>
          <Input
            id="min_silent"
            type="number"
            min={0}
            step={5}
            value={minSilent}
            onChange={(e) => setMinSilent(e.target.value)}
            placeholder="0"
            className="w-28"
          />
        </div>
        <Button type="submit" variant="outline" disabled={loading}>
          Apply filters
        </Button>
      </form>

      <Card className="gap-0 p-0">
        {data.customers.length === 0 ? (
          <p className="px-6 py-10 text-sm text-muted-foreground">
            {q
              ? `No customers match "${q}".`
              : "No dormant VIP customers right now — check back after the next sync."}
          </p>
        ) : (
          <div className={`overflow-x-auto transition-opacity ${loading ? "opacity-50" : ""}`}>
            <Table>
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Lifetime spend</TableHead>
                  <TableHead>Usual gap</TableHead>
                  <TableHead className="text-right">Silent for</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.customers.map((c) => (
                  <TableRow key={c.customer_id}>
                    <TableCell className="font-medium">
                      {[c.first_name, c.last_name].filter(Boolean).join(" ") || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{c.email}</TableCell>
                    <TableCell>{c.orders_count}</TableCell>
                    <TableCell>{formatCurrency(c.total_spent)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      every {c.avg_gap_days.toFixed(0)}d
                    </TableCell>
                    <TableCell className="text-right">{c.days_silent}d</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {data.total > pageSize && (
        <nav aria-label="Winback pages" className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            disabled={data.page <= 1 || loading}
            onClick={() =>
              load(
                data.page - 1,
                q,
                minSpend ? Number(minSpend) : null,
                minSilent ? Number(minSilent) : null,
              )
            }
          >
            <ChevronLeft className="size-4" aria-hidden />
            Previous
          </Button>
          <p className="text-xs text-muted-foreground tabular-nums">
            Page {data.page} of {data.pages} · {data.total} customer{data.total === 1 ? "" : "s"}
          </p>
          <Button
            variant="outline"
            size="sm"
            disabled={data.page >= data.pages || loading}
            onClick={() =>
              load(
                data.page + 1,
                q,
                minSpend ? Number(minSpend) : null,
                minSilent ? Number(minSilent) : null,
              )
            }
          >
            Next
            <ChevronRight className="size-4" aria-hidden />
          </Button>
        </nav>
      )}
    </div>
  );
}
