"use client";

import { useCallback, useMemo, useState } from "react";

import {
  applyControls,
  DEFAULT_TABLE_CONTROLS,
  facetOptions,
  isDefaultControls,
  type FacetOption,
  type TableControls,
  type TableSlice,
  type TableSpec,
} from "@/lib/table-controls";

export interface TableControlsState<T> extends TableSlice<T> {
  query: string;
  facet: string | null;
  facets: FacetOption[];
  /** True when a query or facet is narrowing the rows. */
  active: boolean;
  setQuery: (query: string) => void;
  setFacet: (facet: string | null) => void;
  setPage: (page: number) => void;
  clear: () => void;
}

/**
 * The search / facet / page of one loaded table, held in the table component's own
 * state (SPEC-258) — so a page change re-renders that component and nothing else:
 * no navigation, no server component, no refetch. A new query or facet starts back
 * at page 1; a page past the end clamps itself. `spec` should be a module constant.
 */
export function useTableControls<T>(rows: T[], spec: TableSpec<T>): TableControlsState<T> {
  const [controls, setControls] = useState<TableControls>(DEFAULT_TABLE_CONTROLS);

  const facets = useMemo(() => facetOptions(rows, spec.facet), [rows, spec]);
  const slice = useMemo(() => applyControls(rows, controls, spec), [rows, controls, spec]);

  const setQuery = useCallback((query: string) => setControls((c) => ({ ...c, query, page: 1 })), []);
  const setFacet = useCallback((facet: string | null) => setControls((c) => ({ ...c, facet, page: 1 })), []);
  const setPage = useCallback((page: number) => setControls((c) => ({ ...c, page })), []);
  const clear = useCallback(() => setControls(DEFAULT_TABLE_CONTROLS), []);

  return {
    ...slice,
    query: controls.query,
    facet: controls.facet,
    facets,
    active: !isDefaultControls(controls),
    setQuery,
    setFacet,
    setPage,
    clear,
  };
}
