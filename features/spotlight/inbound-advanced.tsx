"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";

import { Card } from "@/components/ui/card";
import { IntentTemplatesEditor } from "@/features/spotlight/intent-templates-editor";
import { useApiQuery } from "@/hooks/use-api-query";
import { spotlightQueries } from "@/lib/queries/spotlight";
import { cn } from "@/lib/utils";

/**
 * Inbound Engine → Advanced (SPEC-263): the search-intent templates, moved here from
 * Brand Brain. Collapsed by default and read only when opened — the templates ride
 * on the brain query, so an owner who never opens this pays nothing for it.
 */
export function InboundAdvanced() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const brain = useApiQuery(open ? spotlightQueries.brandBrain() : null);
  const reconcile = () => void queryClient.invalidateQueries({ queryKey: ["spotlight", "brand-brain"] });

  return (
    <Card className="gap-0 p-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-5"
      >
        <span>
          <span className="block text-sm font-semibold">Advanced — search-intent templates</span>
          <span className="block text-xs text-muted-foreground">
            The phrasing the query bank blankets each category with. Most owners never need to touch this.
          </span>
        </span>
        <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} aria-hidden />
      </button>
      {open ? (
        <div className="border-t border-border px-4 py-4 sm:px-5">
          {brain.isPending ? (
            <p className="text-sm text-muted-foreground">Loading templates…</p>
          ) : brain.isError ? (
            <p className="text-sm text-destructive">Couldn&apos;t load the templates right now.</p>
          ) : (
            <IntentTemplatesEditor templates={brain.data.intentTemplates} personas={brain.data.personas} onChanged={reconcile} />
          )}
        </div>
      ) : null}
    </Card>
  );
}
