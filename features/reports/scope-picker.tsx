"use client";

import { useRouter } from "next/navigation";

import { SearchPicker, type PickerOption } from "@/features/reports/search-picker";
import { locationScope, scopeHref, vendorScope } from "@/lib/report-scope";
import type { ReportScopes } from "@/types/reports";

interface ScopePickerProps {
  scopes: ReportScopes;
  activeScope: string;
  activeDate: string | null;
}

/**
 * Brand + location scope pickers (SPEC-034): searchable comboboxes over ALL
 * vendors/locations. The URL stays the single source of truth; scopes are
 * one-dimensional, so choosing in one picker resets the other to All.
 */
export function ScopePicker({ scopes, activeScope, activeDate }: ScopePickerProps) {
  const router = useRouter();

  const brandOptions: PickerOption[] = [
    { scope: "all", label: "All brands" },
    ...scopes.vendors.map((vendor) => ({
      scope: vendorScope(vendor),
      label: vendor,
    })),
  ];
  const locationOptions: PickerOption[] = [
    { scope: "all", label: "All locations" },
    ...scopes.locations.map((location) => ({
      scope: locationScope(location.id),
      label:
        location.has_sales === false
          ? `${location.name} · inventory only`
          : location.name,
    })),
  ];

  const selectedBrand = activeScope.startsWith("vendor:")
    ? brandOptions.find((option) => option.scope === activeScope)
    : brandOptions[0];
  const selectedLocation = activeScope.startsWith("location:")
    ? locationOptions.find((option) => option.scope === activeScope)
    : locationOptions[0];

  function apply(scope: string) {
    router.push(scopeHref(activeDate, scope));
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
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
