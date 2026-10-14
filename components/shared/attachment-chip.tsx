import { CheckCircle2, Eye, FileSpreadsheet } from "lucide-react";

import { AttachmentPreviewDialog } from "@/components/shared/attachment-preview-dialog";
import { cn } from "@/lib/utils";
import type { ComposeAttachment } from "@/types/compose";

interface AttachmentChipProps {
  filename: string;
  rowCount: number;
  attachment?: ComposeAttachment;
}

function ChipContent({
  filename,
  rowCount,
  previewable,
}: AttachmentChipProps & { previewable: boolean }) {
  return (
    <>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-card ring-1 ring-border">
        <FileSpreadsheet className="size-5 text-muted-foreground" aria-hidden />
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate text-sm font-medium text-foreground" title={filename}>{filename}</span>
        <span className="block text-xs text-muted-foreground">
          {rowCount} row{rowCount === 1 ? "" : "s"}{previewable ? " · Click to preview" : ""}
        </span>
      </span>
      {previewable ? (
        <Eye className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" aria-hidden />
      ) : (
        <CheckCircle2 className="size-4 shrink-0 text-success" aria-label="Ready to attach" />
      )}
    </>
  );
}

/** Compact attachment summary; real draft data activates an animated preview dialog. */
export function AttachmentChip({ filename, rowCount, attachment }: AttachmentChipProps) {
  const baseClassName = "group flex w-full min-w-0 items-center gap-3 rounded-lg border border-border bg-muted/40 p-3 sm:w-fit sm:min-w-80";

  if (!attachment) {
    return <div className={baseClassName}><ChipContent filename={filename} rowCount={rowCount} previewable={false} /></div>;
  }

  return (
    <AttachmentPreviewDialog
      filename={filename}
      attachment={attachment}
      trigger={(
        <button
          type="button"
          className={cn(
            baseClassName,
            "cursor-pointer transition-colors hover:border-foreground/30 hover:bg-muted focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          )}
          aria-label={`Preview attachment ${filename}, ${rowCount} rows`}
        >
          <ChipContent filename={filename} rowCount={rowCount} attachment={attachment} previewable />
        </button>
      )}
    />
  );
}
