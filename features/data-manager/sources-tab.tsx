"use client";

import { useId, useRef, useState } from "react";
import { FileSpreadsheet, FileText, RefreshCw, Upload } from "lucide-react";

import { ShallowLink } from "@/components/shared/shallow-link";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { useDataManager } from "@/features/data-manager/data-manager-context";
import { ExampleNote, Section } from "@/features/data-manager/parts";
import { bodyRows, dataTabHref, headerFields, isPreviewable, parseDelimited, UPLOAD_ACCEPT } from "@/lib/data-manager";
import { cn } from "@/lib/utils";
import { formatDateTime, formatNumber } from "@/utils/format";

/**
 * Sources (SPEC-374): the Airtable bases, read only when the owner asks, and uploads. A CSV or TSV
 * is read in the browser into an exact copy at once; Excel, PDF and image invoices wait for the
 * import engine, which reads them the same way, character for character.
 */
export function SourcesTab() {
  const { data, uploads, queued, addUpload, queue } = useDataManager();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function read(files: FileList | null) {
    for (const file of Array.from(files ?? [])) {
      if (!isPreviewable(file.name)) {
        queue({ name: file.name, size: file.size });
        setMessage(`${file.name} is kept for the import engine, which reads Excel, PDF and image invoices.`);
        continue;
      }
      const rows = parseDelimited(await file.text());
      const fields = headerFields(rows);
      if (fields.length === 0) {
        setMessage(`${file.name} has no rows to copy.`);
        continue;
      }
      const body = bodyRows(rows, fields.length);
      addUpload({
        id: `upload-${Date.now()}-${file.name}`,
        name: file.name.replace(/\.(csv|tsv|txt)$/i, ""),
        origin: "upload",
        container: file.name,
        fields,
        rowCount: body.length,
        rows: body,
        matchedPct: null,
        readAt: new Date().toISOString(),
      });
      setMessage(`Copied ${formatNumber(body.length)} rows and ${fields.length} columns from ${file.name}. Open Tables to see it.`);
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="flex flex-col gap-4">
      <ExampleNote />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Section
          title="Airtable"
          description="Read-only. Each table is copied field for field, only when you press Read now."
          actions={<StatusBadge tone="neutral">Not connected</StatusBadge>}
        >
          <ul className="divide-y divide-border">
            {data.bases.map((base) => {
              const tables = data.tables.filter((t) => base.tableIds.includes(t.id));
              return (
                <li key={base.id} className="flex items-start gap-3 py-2.5">
                  <FileSpreadsheet className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{base.name}</p>
                    {tables.map((t) => (
                      <p key={t.id} className="text-xs text-muted-foreground">
                        {t.name} · {formatNumber(t.rowCount)} rows · {t.fields.length} fields
                        {t.matchedPct !== null ? ` · ${t.matchedPct}% matched` : ""}
                      </p>
                    ))}
                  </div>
                  <span className="text-[11px] text-muted-foreground">{formatDateTime(tables[0]?.readAt ?? "")}</span>
                </li>
              );
            })}
          </ul>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" disabled title="Available once Airtable is connected">
              <RefreshCw aria-hidden />
              Read now
            </Button>
            <p className="text-xs text-muted-foreground">
              Reading is manual, so a free Airtable plan&apos;s monthly limit is never used up in the background.
            </p>
          </div>
        </Section>

        <Section title="Upload a sheet or invoice" description="CSV, Excel, PDF or a photo of an invoice. Copied exactly as written: a code like 00123, a price like 12.50 and a lone “.” stay exactly where they are.">
          <label
            htmlFor={inputId}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(true);
            }}
            onDragLeave={() => setOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setOver(false);
              void read(e.dataTransfer.files);
            }}
            className={cn(
              "flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-border bg-card px-4 py-8 text-center transition-colors hover:bg-muted/40",
              over && "border-foreground bg-muted/60",
            )}
          >
            <Upload className="size-6 text-muted-foreground" aria-hidden />
            <span className="text-sm font-medium">Drop files here, or choose them</span>
            <span className="text-xs text-muted-foreground">Uploading the same sheet again shows what changed instead of adding a copy.</span>
            <input
              ref={inputRef}
              id={inputId}
              type="file"
              multiple
              accept={UPLOAD_ACCEPT}
              className="sr-only"
              onChange={(e) => void read(e.target.files)}
            />
          </label>
          {message ? (
            <p role="status" className="mt-3 text-xs text-muted-foreground">
              {message}{" "}
              {uploads.length > 0 ? (
                <ShallowLink href={dataTabHref("tables", { table: uploads[0].id })} className="font-medium text-foreground underline underline-offset-4">
                  Open the copy
                </ShallowLink>
              ) : null}
            </p>
          ) : null}
        </Section>
      </div>

      <Section title="Uploads" description="Each upload is a table of its own.">
        {uploads.length === 0 && queued.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Nothing uploaded on this visit yet. Drop a CSV above to see its exact copy.</p>
        ) : (
          <ul className="divide-y divide-border">
            {uploads.map((t) => (
              <li key={t.id} className="flex items-center gap-3 py-2.5">
                <FileSpreadsheet className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{t.container}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatNumber(t.rowCount)} rows · {t.fields.length} columns · copied in this browser
                  </p>
                </div>
                <ShallowLink href={dataTabHref("tables", { table: t.id })} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                  Open
                </ShallowLink>
              </li>
            ))}
            {queued.map((f) => (
              <li key={f.name} className="flex items-center gap-3 py-2.5">
                <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{f.name}</p>
                  <p className="text-xs text-muted-foreground">{formatNumber(Math.ceil(f.size / 1024))} KB · read by the import engine once it is live</p>
                </div>
                <StatusBadge tone="info">Waiting</StatusBadge>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
