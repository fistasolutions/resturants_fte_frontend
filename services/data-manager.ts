/**
 * Data Manager's one data seam (SPEC-374). Until the import engine ships, the screens read the
 * labelled example; wiring the backend replaces this function's body, not a screen.
 */
import { DATA_MANAGER_EXAMPLE } from "@/lib/mock/data-manager";
import type { DataManagerPreview } from "@/types/data-manager";

export function getDataManagerPreview(): DataManagerPreview {
  return DATA_MANAGER_EXAMPLE;
}
