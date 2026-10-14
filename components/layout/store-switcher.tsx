"use client";

import { Check, ChevronsUpDown, Plus, Store } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { StoreConnection } from "@/types/store";

interface StoreSwitcherProps {
  store: StoreConnection;
}

/**
 * Header store switcher (SPEC-009): shows the connected store; "Add another
 * store" is honestly disabled — multi-store is a PRD Coming Soon feature.
 */
export function StoreSwitcher({ store }: StoreSwitcherProps) {
  const storeActive = store.status === "active";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Connected store: ${store.domain}. Open store menu`}
        className="inline-flex items-center gap-2 rounded-lg border bg-card px-3 py-1.5 text-sm text-card-foreground transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-accent"
      >
        <Store className="size-4 text-muted-foreground" aria-hidden />
        <span className="max-w-40 truncate">{store.domain}</span>
        <span
          className={`size-1.5 rounded-full ${storeActive ? "bg-success" : "bg-destructive"}`}
          aria-hidden
        />
        <span className="sr-only">
          {storeActive ? "Active" : "Disconnected"}
        </span>
        <ChevronsUpDown className="size-3.5 text-muted-foreground" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-auto min-w-56">
        <DropdownMenuLabel>Connected store</DropdownMenuLabel>
        <DropdownMenuItem className="gap-2.5">
          <Store className="size-4" aria-hidden />
          <span className="min-w-0 flex-1 truncate">{store.domain}</span>
          <Check className="size-4 text-success" aria-label="Selected" />
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled aria-disabled="true" className="gap-2.5">
          <Plus className="size-4" aria-hidden />
          <span className="flex-1 whitespace-nowrap">Add another store</span>
          <Badge className="bg-secondary text-muted-foreground">
            Coming soon
          </Badge>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
