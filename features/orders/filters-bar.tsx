"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AGE_LABELS,
  FULFILLMENT_LABELS,
  ordersPageHref,
  type AgeBucket,
  type FulfillmentFilter,
  type OrderFilters,
} from "@/lib/order-filters";

const ALL = "__all__";

interface FiltersBarProps {
  filters: OrderFilters;
  locations: { id: number; name: string }[];
  /** Current tab's route (SPEC-079) — a filter change must stay on the same
   * tab, not bounce back to the All tab. */
  basePath: string;
}

/**
 * Top filter controls for the orders page (SPEC-039): fulfillment,
 * location, and age selects that SET filters (the SPEC-038 chips could only
 * remove them). Every change commits to the URL immediately — the URL stays
 * the single source of truth, shareable, and in sync with the export link.
 */
export function FiltersBar({ filters, locations, basePath }: FiltersBarProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function commit(next: OrderFilters) {
    startTransition(() => {
      router.replace(ordersPageHref(next, undefined, basePath), { scroll: false });
    });
  }

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      aria-label="Order filters"
      aria-busy={isPending}
    >
      <Select
        value={filters.fulfillment ?? ALL}
        onValueChange={(value) =>
          commit({
            ...filters,
            fulfillment: value === ALL ? null : (value as FulfillmentFilter),
          })
        }
      >
        <SelectTrigger
          aria-label="Filter by fulfillment"
          disabled={isPending}
          className="w-auto gap-2 border bg-card text-sm disabled:opacity-70"
        >
          <span className="text-muted-foreground">Fulfillment</span>
          <SelectValue>
            {filters.fulfillment ? FULFILLMENT_LABELS[filters.fulfillment] : "All"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All</SelectItem>
          {(
            Object.entries(FULFILLMENT_LABELS) as Array<[FulfillmentFilter, string]>
          ).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.location ?? ALL}
        onValueChange={(value) => {
          const location = value === ALL ? null : value;
          const name =
            location && location !== "online"
              ? (locations.find((entry) => String(entry.id) === location)?.name ?? null)
              : null;
          commit({ ...filters, location, locationName: name });
        }}
      >
        <SelectTrigger
          aria-label="Filter by location"
          disabled={isPending}
          className="w-auto gap-2 border bg-card text-sm disabled:opacity-70"
        >
          <span className="text-muted-foreground">Location</span>
          <SelectValue>
            {filters.location === null
              ? "All"
              : filters.location === "online"
                ? "Online / unattributed"
                : (locations.find((entry) => String(entry.id) === filters.location)
                    ?.name ??
                  filters.locationName ??
                  filters.location)}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All</SelectItem>
          <SelectItem value="online">Online / unattributed</SelectItem>
          {locations.map((location) => (
            <SelectItem key={location.id} value={String(location.id)}>
              {location.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.age ?? ALL}
        onValueChange={(value) =>
          commit({ ...filters, age: value === ALL ? null : (value as AgeBucket) })
        }
      >
        <SelectTrigger
          aria-label="Filter by order age"
          disabled={isPending}
          className="w-auto gap-2 border bg-card text-sm disabled:opacity-70"
        >
          <span className="text-muted-foreground">Placed</span>
          <SelectValue>
            {filters.age ? `${AGE_LABELS[filters.age]} ago` : "Any time"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Any time</SelectItem>
          {(Object.entries(AGE_LABELS) as Array<[AgeBucket, string]>).map(
            ([value, label]) => (
              <SelectItem key={value} value={value}>
                {label} ago
              </SelectItem>
            ),
          )}
        </SelectContent>
      </Select>

      <span aria-live="polite" className="sr-only">
        {isPending ? "Loading filtered orders" : ""}
      </span>
    </div>
  );
}
