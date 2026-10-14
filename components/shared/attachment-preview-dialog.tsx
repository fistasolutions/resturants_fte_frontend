"use client";

import { FileSpreadsheet } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ComposeAttachment } from "@/types/compose";

interface AttachmentPreviewDialogProps {
  filename: string;
  attachment: ComposeAttachment;
  trigger: React.ReactNode;
}

function CellValue({ value }: { value: string | number }) {
  if (String(value).trim() === "") {
    return <span className="text-muted-foreground" aria-label="Empty cell">—</span>;
  }
  return <>{value}</>;
}

/** Instant, client-only preview of attachment rows already loaded with the draft. */
export function AttachmentPreviewDialog({
  filename,
  attachment,
  trigger,
}: AttachmentPreviewDialogProps) {
  const rowCount = attachment.rows.length;
  const columnCount = attachment.columns.length;

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="flex max-h-[calc(100svh-2rem)] w-[calc(100%-1rem)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:w-[calc(100%-3rem)] sm:max-w-6xl">
        <DialogHeader className="shrink-0 border-b border-border p-4 pr-12 sm:p-6 sm:pr-14">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <FileSpreadsheet className="size-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <DialogTitle className="truncate text-left text-lg leading-6" title={filename}>
                {filename}
              </DialogTitle>
              <DialogDescription className="mt-1 text-left">
                Attachment preview · {rowCount.toLocaleString()} row{rowCount === 1 ? "" : "s"} · {columnCount.toLocaleString()} column{columnCount === 1 ? "" : "s"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 bg-background/50 p-3 sm:p-4">
          {rowCount > 0 && columnCount > 0 ? (
            <div className="h-full max-h-[calc(100svh-13rem)] overflow-hidden rounded-table border border-border bg-card">
              <Table containerClassName="h-full max-h-[calc(100svh-13rem)] overflow-auto">
                <caption className="sr-only">Contents of {filename}</caption>
                <TableHeader className="sticky top-0 z-10 bg-muted shadow-sm">
                  <TableRow className="hover:bg-muted">
                    <TableHead scope="col" className="w-12 border-r border-border px-3 text-right text-muted-foreground">
                      <span className="sr-only">Row</span>#
                    </TableHead>
                    {attachment.columns.map((column, columnIndex) => (
                      <TableHead key={`${column}-${columnIndex}`} scope="col" className="min-w-40 px-3">
                        {column || `Column ${columnIndex + 1}`}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attachment.rows.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      <TableCell className="border-r border-border px-3 text-right text-xs tabular-nums text-muted-foreground">
                        {rowIndex + 1}
                      </TableCell>
                      {attachment.columns.map((_, columnIndex) => (
                        <TableCell key={columnIndex} className="max-w-80 whitespace-normal break-words px-3 align-top leading-5">
                          <CellValue value={row[columnIndex] ?? ""} />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex min-h-64 flex-col items-center justify-center rounded-table border border-dashed border-border bg-card p-6 text-center">
              <span className="mb-3 flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <FileSpreadsheet className="size-4" aria-hidden />
              </span>
              <p className="text-sm font-medium">This attachment is empty</p>
              <p className="mt-1 text-xs text-muted-foreground">There are no rows available to preview.</p>
            </div>
          )}
        </div>

        <DialogFooter className="m-0 shrink-0 rounded-none px-4 py-3 sm:px-6">
          <p className="mr-auto self-center text-xs text-muted-foreground">
            Previewing the data that will be attached when you send.
          </p>
          <DialogClose asChild><Button variant="outline">Close preview</Button></DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
