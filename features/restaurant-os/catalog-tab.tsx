"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";

import { Panel, PanelRow } from "@/components/shared/panel";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { RoleButton, RoleGate } from "@/components/shared/role-gate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyPanel, FormError, RestaurantSkeleton } from "@/features/restaurant/parts";
import { GroupDialog, ItemDialog } from "@/features/restaurant-os/catalog-dialogs";
import { useApiQuery } from "@/hooks/use-api-query";
import { RESTAURANT_KEY, restaurantQueries } from "@/lib/queries/restaurant";
import { createCategory, deleteCategory } from "@/services/restaurant-os-actions";
import type { CatalogGroup, CatalogItem } from "@/types/restaurant-os";
import { formatCurrency } from "@/utils/format";

/** Menu › Catalog (SPEC-379 over backend SPEC-392): the brand's menu, head office edits it. */
export function CatalogTab() {
  const queryClient = useQueryClient();
  const query = useApiQuery(restaurantQueries.catalog());
  const [editingItem, setEditingItem] = useState<CatalogItem | null | "new">(null);
  const [editingGroup, setEditingGroup] = useState<CatalogGroup | null | "new">(null);
  const [category, setCategory] = useState("");
  const [error, setError] = useState<string | null>(null);
  if (query.isError) return <QueryErrorState error={query.error} onRetry={() => void query.refetch()} />;
  if (!query.data) return <RestaurantSkeleton tiles={0} />;
  const catalog = query.data;
  const groupNames = new Map(catalog.groups.map((g) => [g.id, g.name]));

  const run = async (work: () => Promise<unknown>) => {
    setError(null);
    try {
      await work();
      await queryClient.invalidateQueries({ queryKey: RESTAURANT_KEY });
    } catch (err) {
      setError(err instanceof Error ? err.message : "That did not work.");
    }
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[260px_1fr_320px]">
      <Panel title="Categories" count={String(catalog.categories.length)}>
        <form
          className="flex gap-2 px-4 py-3"
          onSubmit={(e) => {
            e.preventDefault();
            void run(() => createCategory({ name: category.trim(), sort: catalog.categories.length + 1 })).then(() => setCategory(""));
          }}
        >
          <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="New category" aria-label="New category" className="h-8" maxLength={80} />
          <RoleButton need={["menu.manage"]} type="submit" size="sm" disabled={!category.trim()}>
            Add
          </RoleButton>
        </form>
        {catalog.categories.map((c) => (
          <PanelRow
            key={c.id}
            align="center"
            trailing={
              <RoleGate need={["menu.manage"]}>
                <Button size="icon" variant="ghost" aria-label={`Delete ${c.name}`} onClick={() => void run(() => deleteCategory(c.id))}>
                  <Trash2 aria-hidden />
                </Button>
              </RoleGate>
            }
          >
            <p className="text-sm font-medium text-foreground">{c.name}</p>
            <p className="text-xs text-muted-foreground">{catalog.items.filter((i) => i.categoryId === c.id).length} items</p>
          </PanelRow>
        ))}
      </Panel>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Items</h2>
          <RoleButton need={["menu.manage"]} size="sm" onClick={() => setEditingItem("new")}>
            <Plus aria-hidden /> Add item
          </RoleButton>
        </div>
        <FormError message={error} />
        {catalog.items.length === 0 ? (
          <EmptyPanel title="The menu is empty" body="Add categories, then items. A pizza gets sizes and a toppings group; a drink can simply have a price." />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="hidden lg:table-cell">Choices</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {catalog.items.map((item) => (
                  <TableRow key={item.id} className={item.isActive ? undefined : "opacity-60"}>
                    <TableCell>
                      <p className="font-medium text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.category}
                        {item.kind !== "simple" ? ` · ${item.kind}` : ""}
                        {!item.isActive ? " · off the menu" : ""}
                      </p>
                    </TableCell>
                    <TableCell className="text-sm tabular-nums">
                      {item.sizes.length ? item.sizes.map((s) => `${s.name} ${formatCurrency(s.price)}`).join(" · ") : formatCurrency(item.price)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {item.groupIds.map((id) => (
                          <Badge key={id} variant="secondary">
                            {groupNames.get(id)}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <RoleGate need={["menu.manage"]}>
                        <Button size="sm" variant="ghost" onClick={() => setEditingItem(item)}>
                          Edit
                        </Button>
                      </RoleGate>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <Panel
        title="Toppings & choices"
        count={String(catalog.groups.length)}
        aside={
          <RoleButton need={["menu.manage"]} size="sm" variant="outline" onClick={() => setEditingGroup("new")}>
            <Plus aria-hidden /> Group
          </RoleButton>
        }
      >
        {catalog.groups.length === 0 ? <p className="px-4 py-6 text-sm text-muted-foreground">No groups yet: add Toppings, Crust, Sauce…</p> : null}
        {catalog.groups.map((g) => (
          <PanelRow
            key={g.id}
            align="center"
            trailing={
              <RoleGate need={["menu.manage"]}>
                <Button size="sm" variant="ghost" onClick={() => setEditingGroup(g)}>
                  Edit
                </Button>
              </RoleGate>
            }
          >
            <p className="text-sm font-medium text-foreground">{g.name}</p>
            <p className="text-xs text-muted-foreground">
              {g.kind === "toppings" ? "Toppings" : "Choice"} · {g.options.filter((o) => o.isActive).length} options
              {g.freeQuantity ? ` · ${g.freeQuantity} included` : ""}
            </p>
          </PanelRow>
        ))}
      </Panel>
      {editingItem ? <ItemDialog catalog={catalog} item={editingItem === "new" ? null : editingItem} onClose={() => setEditingItem(null)} /> : null}
      {editingGroup ? <GroupDialog catalog={catalog} group={editingGroup === "new" ? null : editingGroup} onClose={() => setEditingGroup(null)} /> : null}
    </div>
  );
}
