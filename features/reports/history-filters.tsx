"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { SearchPicker, type PickerOption } from "@/features/reports/search-picker";
import { locationScope, vendorScope } from "@/lib/report-scope";
import type { ReportScopes } from "@/types/reports";

interface HistoryFiltersProps {
  scopes: ReportScopes;
  q: string;
  type: string | null;
  scope: string | null;
}

function buildHref(
  q: string,
  type: string | null,
  scope: string | null,
): string {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (scope) params.set("scope", scope);
  else if (type) params.set("type", type);
  const query = params.toString();
  return query ? `/reports/history?${query}` : "/reports/history";
}

/**
 * History filter bar (SPEC-035): All / Daily briefings chips + searchable
 * Brand & Location pickers that pin the archive to ONE exact view. Selection
 * lands in the URL — shareable, back-button-safe, server-side filtered.
 */
export function HistoryFilters({ scopes, q, type, scope }: HistoryFiltersProps) {
  const router = useRouter();

  const brandOptions: PickerOption[] = [
    { scope: "type:vendor", label: "All brands" },
    ...scopes.vendors.map((vendor) => ({
      scope: vendorScope(vendor),
      label: vendor,
    })),
  ];
  const locationOptions: PickerOption[] = [
    { scope: "type:location", label: "All locations" },
    ...scopes.locations.map((location) => ({
      scope: locationScope(location.id),
      label:
        location.has_sales === false
          ? `${location.name} · inventory only`
          : location.name,
    })),
  ];

  const selectedBrand = scope?.startsWith("vendor:")
    ? brandOptions.find((option) => option.scope === scope)
    : type === "vendor"
      ? brandOptions[0]
      : undefined;
  const selectedLocation = scope?.startsWith("location:")
    ? locationOptions.find((option) => option.scope === scope)
    : type === "location"
      ? locationOptions[0]
      : undefined;

  function apply(selection: string) {
    if (selection.startsWith("type:")) {
      router.push(buildHref(q, selection.slice("type:".length), null));
    } else {
      router.push(buildHref(q, null, selection));
    }
  }

  const chipClass = (active: boolean) =>
    `inline-flex min-h-8 items-center rounded-full border px-3 py-1 text-xs font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring ${
      active
        ? "border-primary bg-primary text-primary-foreground"
        : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground"
    }`;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <nav aria-label="Filter reports by type" className="flex items-center gap-1.5">
        <Link
          href={buildHref(q, null, null)}
          aria-current={!type && !scope ? "page" : undefined}
          className={chipClass(!type && !scope)}
        >
          All
        </Link>
        <Link
          href={buildHref(q, "daily", null)}
          aria-current={type === "daily" ? "page" : undefined}
          className={chipClass(type === "daily")}
        >
          Daily briefings
        </Link>
      </nav>
      <SearchPicker
        label="Brand"
        placeholder="Search brands…"
        options={brandOptions}
        selected={selectedBrand}
        onSelect={apply}
      />
      <SearchPicker
        label="Location"
        placeholder="Search locations…"
        options={locationOptions}
        selected={selectedLocation}
        onSelect={apply}
      />
    </div>
  );
}
