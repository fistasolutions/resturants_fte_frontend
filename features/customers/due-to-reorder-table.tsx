"use client";

import { useState, type FormEvent } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DueToReorderPage } from "@/types/customers";
import { formatCurrency } from "@/utils/format";

interface DueToReorderTableProps {
  initialData: DueToReorderPage;
  initialQuery: string;
  pageSize: number;
}

interface MoneyFinderPageResponse {
  due_to_reorder: DueToReorderPage;
}

async function fetchDueToReorder(
  page: number,
  limit: number,
  q: string,
): Promise<DueToReorderPage> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (q) params.set("q", q);
  const res = await fetch(`/api/proxy/customers/money-finder?${params.toString()}`);
  if (!res.ok) throw new Error(`${res.status}`);
  const body = (await res.json()) as MoneyFinderPageResponse;
  return body.due_to_reorder;
}

/** "Due to reorder" search + table + pagination (SPEC-056, backend
 * SPEC-049; client-side paging SPEC-063). Fetches directly from the money
 * finder endpoint on search/page change instead of navigating the route —
 * the hero strip and segment cards above stay mounted and never re-fetch
 * just because someone searched or paged this one table. */
export function DueToReorderTable({
  initialData,
  initialQuery,
  pageSize,
}: DueToReorderTableProps) {
  const [data, setData] = useState(initialData);
  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(page: number, q: string) {
    setLoading(true);
    setError(null);
    try {
      const next = await fetchDueToReorder(page, pageSize, q);
      setData(next);
    } catch {
      setError("Could not load — try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    load(1, query);
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={handleSearch}
        role="search"
        className="relative w-full max-w-md"
      >
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name or email…"
          aria-label="Search customers by name or email"
          className="pl-9"
        />
      </form>

      <Card className="gap-0 p-0">
        {data.customers.length === 0 ? (
          <p className="px-6 py-10 text-sm text-muted-foreground">
            {query
              ? `No customers match "${query}".`
              : "No customers are due to reorder right now — check back after the next sync."}
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
                  <TableHead className="text-right">Days overdue</TableHead>
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
                    <TableCell className="text-right">{c.days_overdue.toFixed(0)}d</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {data.total > pageSize && (
        <nav aria-label="Customer pages" className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            disabled={data.page <= 1 || loading}
            onClick={() => load(data.page - 1, query)}
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
            onClick={() => load(data.page + 1, query)}
          >
            Next
            <ChevronRight className="size-4" aria-hidden />
          </Button>
        </nav>
      )}
    </div>
  );
}
