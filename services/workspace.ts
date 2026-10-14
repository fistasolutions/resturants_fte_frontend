import "server-only";

import { cache } from "react";

import { serverApi } from "@/lib/api";
import { EMPTY_WORKSPACE, toWorkspace, type ApiWorkspace, type Workspace } from "@/lib/workspace";

/** The workspace (backend SPEC-319): navigation, branding, features, store settings. When it
 * cannot be read the platform defaults stand and nothing is hidden — the backend still refuses
 * every call a role may not make (SPEC-315). Cached per request (SPEC-318): a page that needs it
 * shares the layout's read. */
export const getWorkspace = cache(async (): Promise<Workspace> => {
  try {
    return toWorkspace(await serverApi<ApiWorkspace>("/workspace"));
  } catch {
    return EMPTY_WORKSPACE;
  }
});
