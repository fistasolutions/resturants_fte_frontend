"use client";

import { createContext, useContext, useMemo, useState } from "react";

import { getDataManagerPreview } from "@/services/data-manager";
import type { DataManagerPreview, SourceTable } from "@/types/data-manager";

/** A file dropped on Sources: a sheet read in the browser, or a document waiting for the engine. */
export interface QueuedFile {
  name: string;
  size: number;
}

interface DataManagerState {
  data: DataManagerPreview;
  uploads: SourceTable[];
  queued: QueuedFile[];
  applied: boolean;
  addUpload: (table: SourceTable) => void;
  queue: (file: QueuedFile) => void;
  apply: () => void;
}

const DataManagerContext = createContext<DataManagerState | null>(null);

/**
 * Data Manager's session state (SPEC-374): the example data, plus what the owner did on this
 * visit — sheets read in the browser, documents waiting for the import engine, applied changes.
 * Held in the shell so a tab switch keeps it.
 */
export function DataManagerProvider({ children }: { children: React.ReactNode }) {
  const [uploads, setUploads] = useState<SourceTable[]>([]);
  const [queued, setQueued] = useState<QueuedFile[]>([]);
  const [applied, setApplied] = useState(false);
  const value = useMemo<DataManagerState>(
    () => ({
      data: getDataManagerPreview(),
      uploads,
      queued,
      applied,
      addUpload: (table) => setUploads((list) => [table, ...list]),
      queue: (file) => setQueued((list) => [file, ...list]),
      apply: () => setApplied(true),
    }),
    [uploads, queued, applied],
  );
  return <DataManagerContext.Provider value={value}>{children}</DataManagerContext.Provider>;
}

export function useDataManager(): DataManagerState {
  const state = useContext(DataManagerContext);
  if (!state) throw new Error("useDataManager must be used inside DataManagerProvider");
  return state;
}
