"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, ReceiptText } from "lucide-react";

import { QueryErrorState } from "@/components/shared/query-error-state";
import { RoleButton, RoleGate } from "@/components/shared/role-gate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyPanel, FormError, Num, RestaurantSkeleton } from "@/features/restaurant/parts";
import { useApiQuery } from "@/hooks/use-api-query";
import { RESTAURANT_KEY, restaurantQueries } from "@/lib/queries/restaurant";
import {
  STATEMENT_STATUSES,
  STATEMENT_STATUS_LABELS,
  money,
  normalizeStatementStatus,
  periodLabel,
  statementActions,
  withParams,
} from "@/lib/restaurant";
import { cn } from "@/lib/utils";
import { generateStatements, moveStatement } from "@/services/restaurant-actions";
import type { StatementStatus, WeeklyStatement } from "@/types/restaurant";

const STATUS_VARIANT: Record<StatementStatus, "default" | "secondary" | "outline"> = {
  draft: "outline",
  issued: "secondary",
  paid: "default",
  void: "outline",
};

function Row({ statement, onError }: { statement: WeeklyStatement; onError: (message: string | null) => void }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [paying, setPaying] = useState(false);
  const [reference, setReference] = useState("");
  const [busy, setBusy] = useState(false);

  const move = async (action: "issue" | "paid" | "void") => {
    setBusy(true);
    onError(null);
    try {
      await moveStatement(statement.id, action, reference.trim() || undefined);
      setPaying(false);
      await queryClient.invalidateQueries({ queryKey: [...RESTAURANT_KEY, "statements"] });
    } catch (err) {
      onError(err instanceof Error ? err.message : "Updating the statement failed.");
    } finally {
      setBusy(false);
    }
  };

  const actions = statementActions(statement.status);
  return (
    <Fragment>
      <TableRow>
        <TableCell>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="flex items-center gap-1 text-left font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {open ? <ChevronDown className="size-4" aria-hidden /> : <ChevronRight className="size-4" aria-hidden />}
            {statement.franchiseeName}
          </button>
          <p className="pl-5 text-xs text-muted-foreground">{periodLabel(statement.periodStart, statement.periodEnd)}</p>
        </TableCell>
        <TableCell className="hidden text-right md:table-cell"><Num>{money(statement.basisSales)}</Num></TableCell>
        <TableCell className="hidden text-right lg:table-cell"><Num>{money(statement.royalty)}</Num></TableCell>
        <TableCell className="hidden text-right lg:table-cell"><Num>{money(statement.adFund)}</Num></TableCell>
        <TableCell className="hidden text-right lg:table-cell"><Num>{money(statement.minimumTopup)}</Num></TableCell>
        <TableCell className="text-right"><Num className="font-semibold">{money(statement.totalDue)}</Num></TableCell>
        <TableCell>
          <Badge variant={STATUS_VARIANT[statement.status]} className={cn(statement.status === "void" && "text-muted-foreground line-through")}>
            {STATEMENT_STATUS_LABELS[statement.status]}
          </Badge>
          {statement.paidReference ? <p className="mt-0.5 text-xs text-muted-foreground">{statement.paidReference}</p> : null}
        </TableCell>
        <TableCell className="text-right">
          {actions.length ? (
            <RoleGate need={["network.manage"]}>
              <div className="flex justify-end gap-1">
                {actions.includes("issue") ? (
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => void move("issue")}>
                    Issue
                  </Button>
                ) : null}
                {actions.includes("paid") ? (
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => setPaying((v) => !v)}>
                    Mark paid
                  </Button>
                ) : null}
                <Button size="sm" variant="ghost" disabled={busy} onClick={() => void move("void")}>
                  Void
                </Button>
              </div>
            </RoleGate>
          ) : null}
        </TableCell>
      </TableRow>
      {paying ? (
        <TableRow>
          <TableCell colSpan={8}>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Payment reference, e.g. ACH 4471"
                aria-label="Payment reference"
                className="h-8 max-w-xs"
                maxLength={120}
              />
              <Button size="sm" disabled={busy} onClick={() => void move("paid")}>
                Record payment
              </Button>
            </div>
          </TableCell>
        </TableRow>
      ) : null}
      {open
        ? statement.lines.map((line) => (
            <TableRow key={line.branchId} className="bg-muted/30">
              <TableCell className="pl-10 text-sm text-muted-foreground">
                <Num>#{line.code}</Num> {line.name}
              </TableCell>
              <TableCell className="hidden text-right md:table-cell"><Num>{money(line.basis)}</Num></TableCell>
              <TableCell className="hidden text-right lg:table-cell"><Num>{money(line.royalty)}</Num></TableCell>
              <TableCell className="hidden text-right lg:table-cell"><Num>{money(line.adFund)}</Num></TableCell>
              <TableCell className="hidden text-right lg:table-cell"><Num>{money(line.minimumTopup)}</Num></TableCell>
              <TableCell colSpan={3} />
            </TableRow>
          ))
        : null}
    </Fragment>
  );
}

/** Royalties › Statements (SPEC-378 over backend SPEC-390): the weekly bills. */
export function StatementsView() {
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const params = useSearchParams();
  const current = Object.fromEntries(params.entries());
  const status = normalizeStatementStatus(params.get("status"));
  const query = useApiQuery(restaurantQueries.statements(status));
  const setup = useApiQuery(restaurantQueries.setup());
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (query.isError) return <QueryErrorState error={query.error} onRetry={() => void query.refetch()} />;
  if (!query.data) return <RestaurantSkeleton tiles={0} />;
  const week = query.data.lastCompleteWeek;
  const isHq = setup.data?.scope.isHq ?? false;

  const bill = async () => {
    setBusy(true);
    setError(null);
    try {
      await generateStatements(week.from);
      await queryClient.invalidateQueries({ queryKey: [...RESTAURANT_KEY, "statements"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Billing the week failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1" role="group" aria-label="Status">
          {[null, ...STATEMENT_STATUSES].map((key) => (
            <Link
              key={key ?? "all"}
              href={withParams(pathname, current, { status: key })}
              aria-current={status === key ? "true" : undefined}
              className={cn(
                "rounded-md border px-2.5 py-1 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring",
                status === key ? "border-foreground/30 bg-muted text-foreground" : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {key ? STATEMENT_STATUS_LABELS[key] : "All"}
            </Link>
          ))}
        </div>
        {isHq ? (
          <RoleButton need={["network.manage"]} disabled={busy} onClick={() => void bill()}>
            <ReceiptText aria-hidden />
            {busy ? "Billing…" : `Bill ${periodLabel(week.from, week.to)}`}
          </RoleButton>
        ) : null}
      </div>
      <FormError message={error} />
      {query.data.statements.length === 0 ? (
        <EmptyPanel
          title="No statements yet"
          body={isHq ? "Bill the last complete week to create a draft statement for every franchisee." : "Your statements appear here once head office bills a week."}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Franchisee · week</TableHead>
                <TableHead className="hidden text-right md:table-cell">Basis sales</TableHead>
                <TableHead className="hidden text-right lg:table-cell">Royalty</TableHead>
                <TableHead className="hidden text-right lg:table-cell">Ad fund</TableHead>
                <TableHead className="hidden text-right lg:table-cell">Minimum top-up</TableHead>
                <TableHead className="text-right">Total due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.data.statements.map((s) => (
                <Row key={s.id} statement={s} onError={setError} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
