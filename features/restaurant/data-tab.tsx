"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Copy, KeyRound, Trash2 } from "lucide-react";

import { Panel, PanelRow } from "@/components/shared/panel";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { RoleButton, RoleGate } from "@/components/shared/role-gate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormError, RestaurantSkeleton } from "@/features/restaurant/parts";
import { useApiQuery } from "@/hooks/use-api-query";
import { RESTAURANT_KEY, restaurantQueries } from "@/lib/queries/restaurant";
import { createIngestKey, importRestaurantFile, revokeIngestKey } from "@/services/restaurant-actions";
import type { ImportKind, ImportReport } from "@/types/restaurant";
import { formatDateTime } from "@/utils/format";

const KINDS: { key: ImportKind; label: string; hint: string }[] = [
  { key: "orders", label: "Orders", hint: "Order details export: one row per order, or one row per item with the order number repeated." },
  { key: "menu", label: "Menu", hint: "Menu items with their price and recipe (food) cost." },
  { key: "labor", label: "Labor", hint: "Labor hours and cost per branch per business day." },
];

function Keys() {
  const queryClient = useQueryClient();
  const query = useApiQuery(restaurantQueries.ingestKeys());
  const [name, setName] = useState("FoodTec");
  const [fresh, setFresh] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refresh = () => queryClient.invalidateQueries({ queryKey: [...RESTAURANT_KEY, "ingest-keys"] });

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      const made = await createIngestKey(name.trim());
      setFresh(made.key);
      setCopied(false);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Creating the key failed.");
    }
  };

  const revoke = async (id: number) => {
    setError(null);
    try {
      await revokeIngestKey(id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Revoking the key failed.");
    }
  };

  if (query.isError) return <QueryErrorState error={query.error} onRetry={() => void query.refetch()} />;
  const live = (query.data ?? []).filter((k) => !k.revokedAt);
  return (
    <Panel title="Ingest keys" count={query.data ? String(live.length) : undefined}>
      <div className="space-y-3 px-4 py-3">
        <p className="text-sm text-muted-foreground">
          Your POS (FoodTec&apos;s integration team, or a scheduled export) sends orders, menu and labor with a key.
          The key is shown once; keep it with whoever sends the data.
        </p>
        <form onSubmit={create} className="flex flex-wrap gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} aria-label="Key name" className="max-w-xs" maxLength={120} />
          <RoleButton need={["restaurant_data.manage"]} type="submit" disabled={!name.trim()}>
            <KeyRound aria-hidden />
            New key
          </RoleButton>
        </form>
        {fresh ? (
          <div className="space-y-2 rounded-xl border border-border bg-muted/40 p-3">
            <p className="text-xs font-semibold text-foreground">Copy this key now — it will not be shown again.</p>
            <div className="flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-md bg-background px-2 py-1 font-mono text-xs">{fresh}</code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  void navigator.clipboard.writeText(fresh).then(() => setCopied(true));
                }}
              >
                <Copy aria-hidden />
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>
        ) : null}
        <FormError message={error} />
      </div>
      {!query.data ? (
        <div className="px-4 py-3"><RestaurantSkeleton tiles={0} /></div>
      ) : (
        live.map((key) => (
          <PanelRow
            key={key.id}
            align="center"
            trailing={
              <RoleGate need={["restaurant_data.manage"]}>
                <Button size="icon" variant="ghost" aria-label={`Revoke ${key.name}`} onClick={() => void revoke(key.id)}>
                  <Trash2 aria-hidden />
                </Button>
              </RoleGate>
            }
          >
            <p className="text-sm font-medium text-foreground">
              {key.name} <code className="font-mono text-xs text-muted-foreground">{key.prefix}…</code>
            </p>
            <p className="text-xs text-muted-foreground">
              {key.createdAt ? `Created ${formatDateTime(key.createdAt)}` : null}
              {key.lastUsedAt ? ` · last used ${formatDateTime(key.lastUsedAt)}` : " · not used yet"}
            </p>
          </PanelRow>
        ))
      )}
    </Panel>
  );
}

function ImportReportView({ report }: { report: ImportReport }) {
  const columns = Object.entries(report.columns);
  return (
    <div className="space-y-3 rounded-xl border border-border bg-muted/40 p-3 text-sm">
      {report.result ? (
        <p className="font-medium text-foreground">
          Imported: {report.result.created} new, {report.result.updated} updated
          {report.result.rejected ? `, ${report.result.rejected} rejected` : ""}.
        </p>
      ) : (
        <p className="font-medium text-foreground">
          {report.rows} rows read, {report.records} {report.kind === "orders" ? "orders" : "records"} ready to import.
        </p>
      )}
      <div className="flex flex-wrap gap-1.5 text-xs">
        {columns.map(([field, header]) => (
          <span key={field} className="rounded-md border border-border bg-background px-1.5 py-0.5">
            {header} → <span className="text-muted-foreground">{field.replace(/_/g, " ")}</span>
          </span>
        ))}
      </div>
      {report.unmapped.length ? <p className="text-xs text-muted-foreground">Not used: {report.unmapped.join(", ")}</p> : null}
      {report.errors.length ? (
        <ul className="max-h-32 space-y-0.5 overflow-y-auto text-xs text-destructive">
          {report.errors.map((e) => (
            <li key={`${e.row}-${e.message}`}>
              Row {e.row}: {e.message}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function FileImport() {
  const queryClient = useQueryClient();
  const [kind, setKind] = useState<ImportKind>("orders");
  const [file, setFile] = useState<File | null>(null);
  const [report, setReport] = useState<ImportReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (dryRun: boolean) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      setReport(await importRestaurantFile(kind, file, dryRun));
      if (!dryRun) await queryClient.invalidateQueries({ queryKey: RESTAURANT_KEY });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Importing the file failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel title="Import a file">
      <div className="space-y-3 px-4 py-3">
        <p className="text-sm text-muted-foreground">
          For history and for anything your POS exports as a spreadsheet. Columns are matched by name; check the
          file first, then import. Sending the same orders again updates them — nothing is counted twice.
        </p>
        <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
          <div className="space-y-1.5">
            <Label>What it holds</Label>
            <Select
              value={kind}
              onValueChange={(value) => {
                setKind(value as ImportKind);
                setReport(null);
              }}
            >
              <SelectTrigger aria-label="What the file holds">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {KINDS.map((k) => (
                  <SelectItem key={k.key} value={k.key}>
                    {k.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="restaurant-file">CSV file</Label>
            <Input
              id="restaurant-file"
              type="file"
              accept=".csv,.tsv,.txt,text/csv"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                setReport(null);
              }}
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{KINDS.find((k) => k.key === kind)?.hint}</p>
        {report ? <ImportReportView report={report} /> : null}
        <FormError message={error} />
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={!file || busy} onClick={() => void run(true)}>
            Check the file
          </Button>
          <RoleButton need={["restaurant_data.manage"]} disabled={!file || busy || !report?.dryRun || report.records === 0} onClick={() => void run(false)}>
            {busy ? "Working…" : "Import"}
          </RoleButton>
        </div>
      </div>
    </Panel>
  );
}

function Reference() {
  return (
    <Panel title="For your POS integration team">
      <div className="space-y-2 px-4 py-3 text-sm text-muted-foreground">
        <p>
          Send JSON with <code className="font-mono text-xs">Authorization: Bearer &lt;key&gt;</code> to your Restaurants
          FTE API address followed by:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <code className="font-mono text-xs">/api/v1/ingest/restaurant/orders</code> — up to 1,000 orders: order id,
            store number or POS store id, placed/promised/ready/out/delivered times, channel, source, status, subtotal,
            discount, tax, tip, delivery fee, total, guest and items.
          </li>
          <li>
            <code className="font-mono text-xs">/api/v1/ingest/restaurant/menu</code> — up to 5,000 items: id, name,
            category, size, price, recipe cost.
          </li>
          <li>
            <code className="font-mono text-xs">/api/v1/ingest/restaurant/labor</code> — up to 2,000 branch-days: labor
            hours, labor cost, actual food cost.
          </li>
        </ul>
        <p>
          Each order is keyed by its POS id, so resending it replaces it. The business day starts at 04:00 in the
          branch&apos;s timezone unless the order carries its own business date.
        </p>
      </div>
    </Panel>
  );
}

/** Network › Data (SPEC-377): getting the POS's data in. */
export function DataTab() {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <div className="space-y-4">
        <Keys />
        <Reference />
      </div>
      <FileImport />
    </div>
  );
}
