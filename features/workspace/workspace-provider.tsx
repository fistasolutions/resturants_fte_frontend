"use client";

import { createContext, useContext, useMemo } from "react";

import {
  isDefaultLocale,
  resolveStoreLocale,
  syncClientStoreLocale,
  type StoreLocale,
} from "@/lib/store-locale";
import { EMPTY_WORKSPACE, type Workspace } from "@/lib/workspace";

interface WorkspaceValue {
  workspace: Workspace;
  locale: StoreLocale;
  /** True when the store formats differently from a server render (SPEC-319). */
  localeDiffers: boolean;
}

const DEFAULT_VALUE: WorkspaceValue = {
  workspace: EMPTY_WORKSPACE,
  locale: resolveStoreLocale(null, null),
  localeDiffers: false,
};

const WorkspaceContext = createContext<WorkspaceValue>(DEFAULT_VALUE);

/**
 * The organization's workspace (SPEC-318) for client components — the layout's one
 * `/workspace` read, handed down rather than fetched again. It also sets the store's currency
 * and timezone for the formatters (SPEC-319) during its own render, so every child formats in
 * them; in the browser only — see `lib/store-locale.ts`.
 */
export function WorkspaceProvider({
  workspace,
  children,
}: {
  workspace: Workspace;
  children: React.ReactNode;
}) {
  const value = useMemo<WorkspaceValue>(() => {
    const locale = resolveStoreLocale(workspace.currency, workspace.timezone);
    return { workspace, locale, localeDiffers: !isDefaultLocale(locale) };
  }, [workspace]);
  syncClientStoreLocale(value.locale);
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

/** Outside a provider (a test harness, an auth page) this is the platform default. */
export function useWorkspace(): Workspace {
  return useContext(WorkspaceContext).workspace;
}

/** Whether this store's money and times format differently from a server render. */
export function useLocaleDiffers(): boolean {
  return useContext(WorkspaceContext).localeDiffers;
}
