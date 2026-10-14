"use client";

import { useState } from "react";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * The drop zone on the Knowledge Base page (SPEC-274): drop a file → the Add dialog
 * opens on the file door with it; the two buttons open the other doors. The dialog
 * still does the refusing (a .jpg is named as coming soon there, not here).
 */
export function KnowledgeDropZone({ onFile, onText, onUrl }: { onFile: (file: File) => void; onText: () => void; onUrl: () => void }) {
  const [over, setOver] = useState(false);
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) onFile(file);
      }}
      className={cn(
        "flex flex-wrap items-center gap-4 rounded-card border border-dashed px-4 py-3 transition-colors",
        over ? "border-foreground bg-accent" : "border-border bg-card/60",
      )}
      data-knowledge-drop
    >
      <Download className="size-5 shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">Drop a file here, or paste a link</p>
        <p className="text-xs text-muted-foreground">PDF · Word · Excel · PowerPoint · CSV · Text · Markdown · a web page. Images, audio and video are coming soon.</p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onText}>
          Paste text
        </Button>
        <Button variant="outline" size="sm" onClick={onUrl}>
          Add a web page
        </Button>
      </div>
    </div>
  );
}
