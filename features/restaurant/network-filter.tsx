"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApiQuery } from "@/hooks/use-api-query";
import { restaurantQueries } from "@/lib/queries/restaurant";
import { withParams } from "@/lib/restaurant";

const ALL = "all";

/** Narrow a page to a franchisee or a region. Head office sees every franchisee; a franchise
 * member's list holds only its own (the backend filters it), so the control hides itself. */
export function NetworkFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const current = Object.fromEntries(params.entries());
  const franchisees = useApiQuery(restaurantQueries.franchisees());
  const regions = useApiQuery(restaurantQueries.regions());
  const franchiseeList = franchisees.data ?? [];
  const regionList = regions.data ?? [];

  const go = (key: string, value: string) =>
    router.push(withParams(pathname, current, { [key]: value === ALL ? null : value }));

  return (
    <div className="flex flex-wrap items-center gap-2">
      {franchiseeList.length > 1 ? (
        <Select value={current.franchisee ?? ALL} onValueChange={(value) => go("franchisee", value)}>
          <SelectTrigger className="h-8 w-[200px] text-xs" aria-label="Franchisee">
            <SelectValue placeholder="All franchisees" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All franchisees</SelectItem>
            {franchiseeList.map((f) => (
              <SelectItem key={f.id} value={String(f.id)}>
                {f.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
      {regionList.length > 1 ? (
        <Select value={current.region ?? ALL} onValueChange={(value) => go("region", value)}>
          <SelectTrigger className="h-8 w-[160px] text-xs" aria-label="Region">
            <SelectValue placeholder="All regions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All regions</SelectItem>
            {regionList.map((r) => (
              <SelectItem key={r.id} value={String(r.id)}>
                {r.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
    </div>
  );
}
